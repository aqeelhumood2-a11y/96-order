import Image from "next/image";
import { cn } from "@/lib/cn";

export interface LeafAccentProps {
  /** Which corner the mark bleeds off of. */
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Rendered size in pixels (square bounding box — the mark itself is taller than wide). */
  size?: number;
  color?: "white" | "purple";
  className?: string;
}

const CORNER_CLASS: Record<LeafAccentProps["corner"], string> = {
  "top-left": "-top-1/4 -left-1/4 -rotate-12",
  "top-right": "-top-1/4 -right-1/4 rotate-12",
  "bottom-left": "-bottom-1/4 -left-1/4 rotate-12",
  "bottom-right": "-bottom-1/4 -right-1/4 -rotate-12",
};

/**
 * A single oversized, low-opacity leaf mark bleeding off a corner — the
 * brand's one decorative motif, meant for hero/marketing/empty/loading
 * surfaces only (see `globals.css`'s brand doc comment). `aria-hidden`
 * because it's pure decoration, never content. Callers must set
 * `position: relative` and `overflow: hidden` on the containing element.
 */
export function LeafAccent({ corner, size = 420, color = "white", className }: LeafAccentProps) {
  return (
    <Image
      src={color === "white" ? "/brand/logo-mark-white.png" : "/brand/logo-mark-purple.png"}
      alt=""
      aria-hidden="true"
      width={size}
      height={Math.round(size * (700 / 512))}
      className={cn("pointer-events-none absolute opacity-10 select-none", CORNER_CLASS[corner], className)}
    />
  );
}
