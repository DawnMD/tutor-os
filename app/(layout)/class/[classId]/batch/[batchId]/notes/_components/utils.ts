import { FileText, ImageIcon, type LucideIcon } from "lucide-react";

/** Human-readable file size (e.g. "2.4 MB") from a byte count. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
}

/** Pick an icon by mime type: image thumbnail glyph vs. document glyph. */
export function noteIcon(fileType: string): LucideIcon {
  return fileType.startsWith("image/") ? ImageIcon : FileText;
}
