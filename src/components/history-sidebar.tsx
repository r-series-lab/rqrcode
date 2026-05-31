import { DeleteSweepRounded, HistoryRounded } from "@mui/icons-material";
import { Button, Card, CardContent, Divider, IconButton, Tooltip } from "@mui/material";
import type { FeedbackSeverity, HistoryItem, PanelMode } from "../lib/types";
import { formatTimestamp, shorten } from "../lib/utils";

type HistorySidebarProps = {
  mode: PanelMode;
  items: HistoryItem[];
  selectedId: string;
  statusText: string;
  feedbackSeverity: FeedbackSeverity;
  isBusy: boolean;
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
};

export function HistorySidebar({
  mode,
  items,
  selectedId,
  statusText,
  feedbackSeverity,
  isBusy,
  onSelectItem,
  onDeleteItem,
  onClearAll,
}: HistorySidebarProps) {
  const statusTone = isBusy ? "busy" : feedbackSeverity;

  return (
    <Card className="history-card">
      <CardContent className="history-card-content">
        <div className="history-header">
          <h2 className="history-title">最近记录</h2>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DeleteSweepRounded />}
            onClick={onClearAll}
            disabled={items.length === 0}
          >
            清空
          </Button>
        </div>

        <Divider className="history-divider" />

        {items.length === 0 ? (
          <div className="history-empty">
            <HistoryRounded fontSize="small" />
            <span>{mode === "generate" ? "还没有生成记录。" : "还没有识别记录。"}</span>
          </div>
        ) : (
          <div className="history-list">
            {items.map((item) => (
              <article
                key={item.id}
                className={`history-item ${selectedId === item.id ? "history-item-selected" : ""}`}
                onClick={() => onSelectItem(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectItem(item);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="history-copy">
                  <p className="history-line" title={item.content}>
                    {shorten(item.content, 54)}
                  </p>
                  <time className="history-time">{formatTimestamp(item.createdAt)}</time>
                </div>
                <Tooltip title="删除记录">
                  <span>
                    <IconButton
                      size="small"
                      className="history-delete-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                    >
                      <DeleteSweepRounded fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
              </article>
            ))}
          </div>
        )}

        {statusText ? (
          <>
            <Divider className="history-divider" />
            <div className={`status-pill status-${statusTone}`}>{statusText}</div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
