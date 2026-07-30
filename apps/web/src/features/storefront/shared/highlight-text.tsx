function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface HighlightTextProps {
  text: string;
  query?: string;
}

/** Wraps whole-word matches of `query`'s words in `<mark>` — best-effort highlighting, not a substitute for the underlying search matching logic. */
export function HighlightText({ text, query }: HighlightTextProps) {
  const words = (query ?? "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        words.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
          <mark key={index} className="rounded-sm bg-accent-200 text-inherit">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
