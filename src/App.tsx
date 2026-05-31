import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Card, CardContent, CssBaseline, ThemeProvider } from "@mui/material";
import { basename, downloadDir, join } from "@tauri-apps/api/path";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import "./App.css";
import { AppTopbar } from "./components/app-topbar";
import { GeneratePanel } from "./components/generate-panel";
import { HistorySidebar } from "./components/history-sidebar";
import { RecognizePanel } from "./components/recognize-panel";
import { createQrDataUrl, decodeQrFromFile, decodeQrFromPath } from "./lib/qr";
import { clearHistory, deleteHistoryItem, pushHistory, readHistory } from "./lib/storage";
import type { DecodeResult, FeedbackState, HistoryItem, PanelMode } from "./lib/types";
import { copyText, openExternalUrl, shorten, trimContent } from "./lib/utils";
import { rqrcodeTheme } from "./theme/rqrcode-theme";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp"];

function App() {
  const [mode, setMode] = useState<PanelMode>("generate");
  const [generateInput, setGenerateInput] = useState("https://example.com");
  const [generatePreview, setGeneratePreview] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [recognizeResult, setRecognizeResult] = useState<DecodeResult | null>(null);
  const [recognizeMeta, setRecognizeMeta] = useState("");
  const [recognizeError, setRecognizeError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>({
    severity: "info",
    text: "",
  });
  const [busyLabel, setBusyLabel] = useState("");
  const [isSurfaceDragActive, setIsSurfaceDragActive] = useState(false);
  const [isWindowDragActive, setIsWindowDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeHistory = history.filter((item) => item.kind === mode);
  const generateCharCount = trimContent(generateInput).length;
  const trimmedGenerateInput = trimContent(generateInput);
  const generatePreviewCaption = shorten(trimmedGenerateInput || "等待输入", 82);
  const isBusy = Boolean(busyLabel);
  const dragActive = isSurfaceDragActive || isWindowDragActive;
  const statusText = busyLabel || (feedback.severity === "info" ? "" : feedback.text);
  const workspaceTitle = mode === "generate" ? "生成二维码" : "识别二维码";
  const topbarStatus = isBusy ? busyLabel : "";

  useEffect(() => {
    void (async () => {
      const storedHistory = await readHistory();
      setHistory(storedHistory);
      setSelectedHistoryId(storedHistory[0]?.id ?? "");
    })();
  }, []);

  useEffect(() => {
    if (!trimmedGenerateInput) {
      setGeneratePreview("");
      setGenerateError("请输入要生成二维码的内容");
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const nextPreview = await createQrDataUrl(trimmedGenerateInput);
          if (cancelled) {
            return;
          }
          setGeneratePreview(nextPreview);
          setGenerateError("");
        } catch (error) {
          if (cancelled) {
            return;
          }
          setGeneratePreview("");
          setGenerateError(error instanceof Error ? error.message : "二维码生成失败");
        }
      })();
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedGenerateInput]);

  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) {
      return;
    }

    let unlisten: (() => void) | undefined;

    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setIsWindowDragActive(true);
          return;
        }

        if (event.payload.type === "leave") {
          setIsWindowDragActive(false);
          return;
        }

        setIsWindowDragActive(false);
        const [firstPath] = event.payload.paths;
        if (firstPath && mode === "recognize") {
          void handleRecognizePath(firstPath);
        }
      })
      .then((dispose) => {
        unlisten = dispose;
      })
      .catch(() => {
        setIsWindowDragActive(false);
      });

    return () => {
      unlisten?.();
    };
  }, [mode]);

  function showFeedback(nextFeedback: FeedbackState) {
    setFeedback(nextFeedback);
  }

  async function handleCopyValue(value: string, successText: string) {
    await copyText(value);
    showFeedback({
      severity: "success",
      text: successText,
    });
  }

  async function rememberHistory(kind: PanelMode, content: string) {
    const nextHistory = await pushHistory(kind, content);
    setHistory(nextHistory);
    setSelectedHistoryId(nextHistory[0]?.id ?? "");
  }

  async function applyRecognizeResult(nextResult: DecodeResult, sourceLabel: string) {
    setRecognizeResult(nextResult);
    setRecognizeMeta(sourceLabel);
    await rememberHistory("recognize", nextResult.content);
    showFeedback({
      severity: "success",
      text: "识别成功，已加入历史记录。",
    });
  }

  async function handleRecognizeFile(file: File, sourceLabel: string) {
    try {
      setBusyLabel("正在识别二维码");
      setRecognizeError("");
      const nextResult = await decodeQrFromFile(file);
      await applyRecognizeResult(nextResult, sourceLabel);
    } catch (error) {
      setRecognizeResult(null);
      setRecognizeMeta("");
      const message = error instanceof Error ? error.message : "二维码识别失败";
      setRecognizeError(message);
      showFeedback({
        severity: "error",
        text: message,
      });
    } finally {
      setBusyLabel("");
    }
  }

  async function handleRecognizePath(filePath: string) {
    try {
      setBusyLabel("正在识别二维码");
      setRecognizeError("");
      const nextResult = await decodeQrFromPath(filePath);
      const fileName = await basename(filePath);
      await applyRecognizeResult(nextResult, `来自 ${fileName}`);
    } catch (error) {
      setRecognizeResult(null);
      setRecognizeMeta("");
      const message = error instanceof Error ? error.message : "二维码识别失败";
      setRecognizeError(message);
      showFeedback({
        severity: "error",
        text: message,
      });
    } finally {
      setBusyLabel("");
    }
  }

  async function handleChooseImage() {
    const selectedPath = await open({
      title: "选择二维码图片",
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Images",
          extensions: IMAGE_EXTENSIONS,
        },
      ],
    });

    if (!selectedPath || Array.isArray(selectedPath)) {
      return;
    }

    await handleRecognizePath(selectedPath);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await handleRecognizeFile(file, `来自 ${file.name}`);
    event.target.value = "";
  }

  async function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    const pastedFile = Array.from(event.clipboardData.files).find((file) =>
      file.type.startsWith("image/"),
    );

    if (!pastedFile) {
      return;
    }

    event.preventDefault();
    await handleRecognizeFile(pastedFile, "来自粘贴图片");
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsSurfaceDragActive(false);
    const droppedFile = Array.from(event.dataTransfer.files).find((file) =>
      file.type.startsWith("image/"),
    );

    if (!droppedFile) {
      setRecognizeError("只支持拖入图片文件");
      return;
    }

    await handleRecognizeFile(droppedFile, `来自 ${droppedFile.name}`);
  }

  function selectHistoryItem(item: HistoryItem) {
    setSelectedHistoryId(item.id);

    if (item.kind === "generate") {
      setMode("generate");
      setGenerateInput(item.content);
      showFeedback({
        severity: "info",
        text: "",
      });
      return;
    }

    setMode("recognize");
    setRecognizeError("");
    setRecognizeMeta("来自历史记录");
    setRecognizeResult({
      content: item.content,
      normalizedUrl: item.normalizedUrl,
    });
  }

  async function handleRememberGenerate() {
    if (!trimmedGenerateInput) {
      setGenerateError("请输入要生成二维码的内容");
      return;
    }

    await rememberHistory("generate", trimmedGenerateInput);
    showFeedback({
      severity: "success",
      text: "当前内容已加入历史记录。",
    });
  }

  async function handleDeleteHistory(id: string) {
    const nextHistory = await deleteHistoryItem(id);
    setHistory(nextHistory);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(nextHistory[0]?.id ?? "");
    }
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
    setSelectedHistoryId("");
    showFeedback({
      severity: "success",
      text: "已清空最近记录。",
    });
  }

  async function handleDownloadPreview() {
    if (!generatePreview) {
      return;
    }

    try {
      setBusyLabel("正在导出 PNG");
      const defaultPath = await join(await downloadDir(), `rqrcode-${Date.now()}.png`);
      const targetPath = await save({
        title: "导出二维码",
        defaultPath,
        filters: [
          {
            name: "PNG",
            extensions: ["png"],
          },
        ],
      });

      if (!targetPath) {
        return;
      }

      const response = await fetch(generatePreview);
      const bytes = new Uint8Array(await response.arrayBuffer());
      await writeFile(targetPath, bytes);
      const fileName = await basename(targetPath);
      showFeedback({
        severity: "success",
        text: `已导出 ${fileName}`,
      });
    } catch (error) {
      showFeedback({
        severity: "error",
        text: error instanceof Error ? error.message : "导出 PNG 失败",
      });
    } finally {
      setBusyLabel("");
    }
  }

  async function handleOpenRecognizedUrl() {
    if (!recognizeResult?.normalizedUrl) {
      return;
    }

    try {
      await openExternalUrl(recognizeResult.normalizedUrl);
    } catch (error) {
      showFeedback({
        severity: "error",
        text: error instanceof Error ? error.message : "打开网站失败",
      });
    }
  }

  return (
    <ThemeProvider theme={rqrcodeTheme}>
      <CssBaseline />
      <main className="app-shell">
        <Card className="topbar-card">
          <CardContent className="topbar-content">
            <AppTopbar mode={mode} statusLabel={topbarStatus} onModeChange={setMode} />
          </CardContent>
        </Card>

        <div className="workspace-grid">
          <section className="workspace-main">
            <Card className="workspace-card">
              <CardContent className="workspace-card-content">
                <div className="panel-header">
                  <div className="panel-title-block">
                    <h1 className="panel-title">{workspaceTitle}</h1>
                  </div>
                </div>

                {mode === "generate" ? (
                  <GeneratePanel
                    inputValue={generateInput}
                    charCount={generateCharCount}
                    previewSrc={generatePreview}
                    previewCaption={generatePreviewCaption}
                    errorText={generateError}
                    isBusy={isBusy}
                    onChangeInput={setGenerateInput}
                    onRemember={() => void handleRememberGenerate()}
                    onCopy={() => void handleCopyValue(trimmedGenerateInput, "内容已复制。")}
                    onDownload={() => void handleDownloadPreview()}
                  />
                ) : (
                  <RecognizePanel
                    dragActive={dragActive}
                    isBusy={isBusy}
                    result={recognizeResult}
                    meta={recognizeMeta}
                    errorText={recognizeError}
                    fileInputRef={fileInputRef}
                    onChooseImage={() => void handleChooseImage()}
                    onPaste={(event) => void handlePaste(event)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsSurfaceDragActive(true);
                    }}
                    onDragLeave={() => setIsSurfaceDragActive(false)}
                    onDrop={(event) => void handleDrop(event)}
                    onFileChange={(event) => void handleFileChange(event)}
                    onCopyResult={() =>
                      void handleCopyValue(recognizeResult?.content ?? "", "内容已复制。")
                    }
                    onOpenUrl={() => void handleOpenRecognizedUrl()}
                  />
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="history-sidebar">
            <HistorySidebar
              mode={mode}
              items={activeHistory}
              selectedId={selectedHistoryId}
              statusText={statusText}
              feedbackSeverity={feedback.severity}
              isBusy={isBusy}
              onSelectItem={selectHistoryItem}
              onDeleteItem={(id) => void handleDeleteHistory(id)}
              onClearAll={() => void handleClearHistory()}
            />
          </aside>
        </div>
      </main>
    </ThemeProvider>
  );
}

export default App;
