import type { HistoryItem, HistoryKind } from "./types";
import { normalizeUrl } from "./utils";

const HISTORY_KEY = "rqrcode-history";
const HISTORY_LIMIT = 10;

function readHistoryBag(): HistoryItem[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function readHistory(): Promise<HistoryItem[]> {
  return readHistoryBag();
}

export async function writeHistory(items: HistoryItem[]): Promise<void> {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
}

export async function pushHistory(kind: HistoryKind, content: string): Promise<HistoryItem[]> {
  const current = await readHistory();
  const nextItem: HistoryItem = {
    id: crypto.randomUUID(),
    kind,
    content,
    createdAt: new Date().toISOString(),
    normalizedUrl: normalizeUrl(content),
  };

  const deduped = current.filter((item) => !(item.kind === kind && item.content === content));
  const nextHistory = [nextItem, ...deduped].slice(0, HISTORY_LIMIT);
  await writeHistory(nextHistory);
  return nextHistory;
}

export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  const nextHistory = (await readHistory()).filter((item) => item.id !== id);
  await writeHistory(nextHistory);
  return nextHistory;
}

export async function clearHistory(): Promise<void> {
  await writeHistory([]);
}
