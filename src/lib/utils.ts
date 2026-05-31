import { openUrl } from "@tauri-apps/plugin-opener";

export function trimContent(value: string): string {
  return value.trim();
}

export function formatTimestamp(value: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function shorten(value: string, maxLength = 72): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

export function normalizeUrl(value: string): string | null {
  const candidate = value.trim();
  if (!candidate) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : /^www\./i.test(candidate)
      ? `https://${candidate}`
      : null;
  const nextValue = withProtocol ?? candidate;

  try {
    const parsed = new URL(nextValue);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export async function openExternalUrl(url: string): Promise<void> {
  await openUrl(url);
}
