import Image from "next/image";
import { cn } from "@/lib/cn";

const WORDMARK_ASPECT = 960 / 903;
const MARK_ASPECT = 512 / 700;

const WORDMARK_SRC = {
  purple: "/brand/logo-wordmark-purple.png",
  white: "/brand/logo-wordmark-white.png",
  charcoal: "/brand/logo-wordmark-charcoal.png",
} as const;

const MARK_SRC = {
  purple: "/brand/logo-mark-purple.png",
  white: "/brand/logo-mark-white.png",
  charcoal: "/brand/logo-mark-charcoal.png",
} as const;

export type LogoColor = keyof typeof WORDMARK_SRC;
export type LogoVariant = "wordmark" | "mark";

export interface LogoProps {
  /** `wordmark` is the full "NINETY SIX DEGREES CAFE" lockup; `mark` is the standalone leaf icon for compact spaces. */
  variant?: LogoVariant;
  /** `purple` for light/white backgrounds, `white` for dark or brand-purple backgrounds, `charcoal` for a low-contrast/print context. */
  color?: LogoColor;
  /** Rendered height in pixels — width is derived from the asset's fixed aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
}

/** The official "Ninety Six Degrees Cafe" logo, in both lockup variants and all three brand colorways. Presentational only — see `Header`'s doc comment for why `ui/` components take no data dependencies. */
export function Logo({ variant = "wordmark", color = "purple", height = 32, className, priority }: LogoProps) {
  const src = variant === "wordmark" ? WORDMARK_SRC[color] : MARK_SRC[color];
  const aspect = variant === "wordmark" ? WORDMARK_ASPECT : MARK_ASPECT;

  return (
    <Image
      src={src}
      alt="Ninety Six Degrees Cafe"
      width={Math.round(height * aspect)}
      height={height}
      priority={priority}
      className={cn("w-auto object-contain", className)}
      style={{ height }}
    />
  );
}
