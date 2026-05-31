import {
  ContentCopyRounded,
  FolderOpenRounded,
  OpenInNewRounded,
  UploadRounded,
} from "@mui/icons-material";
import { Button } from "@mui/material";
import {
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent,
  type RefObject,
} from "react";
import type { DecodeResult } from "../lib/types";

type RecognizePanelProps = {
  dragActive: boolean;
  isBusy: boolean;
  result: DecodeResult | null;
  meta: string;
  errorText: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onChooseImage: () => void;
  onPaste: (event: ReactClipboardEvent<HTMLDivElement>) => void | Promise<void>;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void | Promise<void>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onCopyResult: () => void;
  onOpenUrl: () => void;
};

export function RecognizePanel({
  dragActive,
  isBusy,
  result,
  meta,
  errorText,
  fileInputRef,
  onChooseImage,
  onPaste,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onCopyResult,
  onOpenUrl,
}: RecognizePanelProps) {
  return (
    <div className="tool-layout recognize-layout">
      <div className="tool-dock">
        <section className={`surface-card dock-card dropzone-card ${dragActive ? "dropzone-active" : ""}`}>
          <div className="surface-head">
            <div>
              <strong>导入图片</strong>
              <span className="surface-copy">拖拽、粘贴或上传</span>
            </div>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FolderOpenRounded />}
              onClick={onChooseImage}
              disabled={isBusy}
            >
              选择图片
            </Button>
          </div>

          <div
            className="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onPaste={onPaste}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
          >
            <div className="dropzone-orb">
              <UploadRounded fontSize="small" />
            </div>
            <strong className="dropzone-title">
              {dragActive ? "松开即可识别" : "拖拽二维码图片到这里"}
            </strong>
            <span className="dropzone-copy">也支持点击上传或直接粘贴</span>
          </div>
        </section>
      </div>

      <section className="surface-card tool-stage result-card">
        <div className="surface-head stage-head">
          <div>
            <strong>识别结果</strong>
            <span className="surface-copy">{meta || "等待识别"}</span>
          </div>
          <div className="stage-actions">
            {result ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ContentCopyRounded />}
                  onClick={onCopyResult}
                >
                  复制内容
                </Button>
                {result.normalizedUrl ? (
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<OpenInNewRounded />}
                    onClick={onOpenUrl}
                  >
                    打开网站
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {result ? (
          <p className="result-content result-content-large">{result.content}</p>
        ) : (
          <div className="empty-result empty-result-large">
            <span>识别结果会显示在这里。</span>
          </div>
        )}

        {errorText ? <p className="error-text">{errorText}</p> : null}
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFileChange}
      />
    </div>
  );
}
