// Shared batch color palette. Importable from both server and client code.
//
// Colors are stored as palette *tokens* (e.g. "emerald") on `Batch.color`, never
// as raw hex. Each token maps to complete, literal Tailwind class strings so the
// Tailwind v4 JIT compiler can see them — never construct class names dynamically
// (e.g. `bg-${token}-500`), or the styles will be purged from the build.

export type BatchColor = {
  id: string;
  label: string;
  /** Solid fill swatch for the picker, e.g. `bg-rose-500`. */
  swatch: string;
  /** Tinted chip (border + bg + text) for calendar events, light + dark. */
  chip: string;
  /** Small solid dot for legends / nav, light + dark. */
  dot: string;
};

export const BATCH_COLORS = [
  {
    id: "rose",
    label: "Rose",
    swatch: "bg-rose-500",
    chip: "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
    dot: "bg-rose-500 dark:bg-rose-400",
  },
  {
    id: "orange",
    label: "Orange",
    swatch: "bg-orange-500",
    chip: "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
    dot: "bg-orange-500 dark:bg-orange-400",
  },
  {
    id: "amber",
    label: "Amber",
    swatch: "bg-amber-500",
    chip: "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  {
    id: "emerald",
    label: "Emerald",
    swatch: "bg-emerald-500",
    chip: "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
  {
    id: "teal",
    label: "Teal",
    swatch: "bg-teal-500",
    chip: "border-teal-300 bg-teal-100 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200",
    dot: "bg-teal-500 dark:bg-teal-400",
  },
  {
    id: "sky",
    label: "Sky",
    swatch: "bg-sky-500",
    chip: "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    dot: "bg-sky-500 dark:bg-sky-400",
  },
  {
    id: "blue",
    label: "Blue",
    swatch: "bg-blue-500",
    chip: "border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  {
    id: "violet",
    label: "Violet",
    swatch: "bg-violet-500",
    chip: "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
    dot: "bg-violet-500 dark:bg-violet-400",
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    swatch: "bg-fuchsia-500",
    chip: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200",
    dot: "bg-fuchsia-500 dark:bg-fuchsia-400",
  },
  {
    id: "pink",
    label: "Pink",
    swatch: "bg-pink-500",
    chip: "border-pink-300 bg-pink-100 text-pink-900 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-200",
    dot: "bg-pink-500 dark:bg-pink-400",
  },
] as const satisfies readonly BatchColor[];

export const BATCH_COLOR_IDS = BATCH_COLORS.map((c) => c.id) as [
  string,
  ...string[],
];

export type BatchColorId = (typeof BATCH_COLORS)[number]["id"];

/**
 * Resolve a stored color token to its palette entry. When no (or an unknown)
 * token is stored — e.g. batches created before the color column existed — fall
 * back to a deterministic entry derived from the batch id, so the same batch
 * always renders the same color across reloads.
 */
export function resolveBatchColor(
  color: string | null | undefined,
  batchId: string,
): BatchColor {
  if (color) {
    const match = BATCH_COLORS.find((c) => c.id === color);
    if (match) return match;
  }

  let hash = 0;
  for (let i = 0; i < batchId.length; i++) {
    hash = hash * 31 + batchId.charCodeAt(i);
    // Keep hash within a safe integer range.
    hash |= 0;
  }

  const index = Math.abs(hash) % BATCH_COLORS.length;
  return BATCH_COLORS[index];
}
