export const WIN_TAGS = ["Extra mile", "Helped a teammate", "Client win", "Good idea", "Just because"] as const;
export type WinTag = (typeof WIN_TAGS)[number];

// full class strings so Tailwind keeps them
const STYLES: Record<WinTag, { tint: string; dot: string }> = {
  "Extra mile": { tint: "bg-peach text-peach-ink", dot: "bg-peach-vivid" },
  "Helped a teammate": { tint: "bg-mint text-mint-ink", dot: "bg-mint-vivid" },
  "Client win": { tint: "bg-sky text-sky-ink", dot: "bg-sky-vivid" },
  "Good idea": { tint: "bg-butter text-butter-ink", dot: "bg-butter-vivid" },
  "Just because": { tint: "bg-lilac text-lilac-ink", dot: "bg-lilac-vivid" },
};
export const tagStyle = (tag: string) => STYLES[tag as WinTag] ?? STYLES["Just because"];

export const initials = (name?: string | null) =>
  (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join("") || "?";

export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

/** select() for a win with both people's names */
export const WIN_SELECT = "id, tag, message, hidden, created_at, from:profiles!wins_from_user_fkey(full_name), to:profiles!wins_to_user_fkey(full_name)";
export const personName = (p: unknown) => (p as { full_name?: string | null } | null)?.full_name || "Someone";
