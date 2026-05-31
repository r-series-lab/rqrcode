export type PanelMode = "generate" | "recognize";
export type HistoryKind = "generate" | "recognize";
export type FeedbackSeverity = "info" | "success" | "error";

export interface FeedbackState {
  severity: FeedbackSeverity;
  text: string;
}

export interface HistoryItem {
  id: string;
  kind: HistoryKind;
  content: string;
  createdAt: string;
  normalizedUrl: string | null;
}

export interface DecodeResult {
  content: string;
  normalizedUrl: string | null;
}
