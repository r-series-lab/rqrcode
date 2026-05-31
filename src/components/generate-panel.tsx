import {
  ContentCopyRounded,
  DownloadRounded,
  HistoryRounded,
  QrCode2Rounded,
} from "@mui/icons-material";
import { Button, TextField } from "@mui/material";

type GeneratePanelProps = {
  inputValue: string;
  charCount: number;
  previewSrc: string;
  previewCaption: string;
  errorText: string;
  isBusy: boolean;
  onChangeInput: (value: string) => void;
  onRemember: () => void;
  onCopy: () => void;
  onDownload: () => void;
};

export function GeneratePanel({
  inputValue,
  charCount,
  previewSrc,
  previewCaption,
  errorText,
  isBusy,
  onChangeInput,
  onRemember,
  onCopy,
  onDownload,
}: GeneratePanelProps) {
  return (
    <div className="tool-layout generate-layout">
      <div className="tool-dock">
        <section className="surface-card dock-card editor-card">
          <div className="surface-head">
            <div>
              <strong>输入内容</strong>
              <span className="surface-copy">网址或文本</span>
            </div>
          </div>

          <TextField
            multiline
            minRows={7}
            maxRows={11}
            value={inputValue}
            placeholder="https://example.com"
            onChange={(event) => onChangeInput(event.currentTarget.value)}
          />

          <div className="inline-actions">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<HistoryRounded />}
              onClick={onRemember}
              disabled={!inputValue.trim()}
              fullWidth
            >
              保存
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ContentCopyRounded />}
              onClick={onCopy}
              disabled={!inputValue.trim()}
              fullWidth
            >
              复制
            </Button>
          </div>

          {errorText ? <p className="error-text">{errorText}</p> : null}
        </section>
      </div>

      <section className="surface-card tool-stage preview-card">
        <div className="surface-head stage-head">
          <div>
            <strong>二维码预览</strong>
            <span className="surface-copy">{charCount > 0 ? `${charCount} 字` : "等待输入"}</span>
          </div>
          <div className="stage-actions">
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadRounded />}
              onClick={onDownload}
              disabled={!previewSrc || isBusy}
            >
              导出 PNG
            </Button>
          </div>
        </div>

        <div className="qr-stage qr-stage-large">
          {previewSrc ? (
            <img src={previewSrc} alt="二维码预览" className="qr-image" />
          ) : (
            <div className="empty-state">
              <QrCode2Rounded fontSize="small" />
              <span>输入后即时生成二维码。</span>
            </div>
          )}
        </div>

        <div className="preview-meta">
          <span className="preview-caption">{previewCaption}</span>
        </div>
      </section>
    </div>
  );
}
