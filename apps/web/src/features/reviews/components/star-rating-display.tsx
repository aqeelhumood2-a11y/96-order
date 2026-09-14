import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

/** Read-only stars — a single `role="img"` with a text `aria-label` (e.g. "4.3 out of 5 stars") rather than five separately-announced icons, so screen readers get one clear number instead of noise. */
export function StarRatingDisplay({ rating, size = "md", locale = DEFAULT_LOCALE }: { rating: number; size?: "sm" | "md"; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.reviews;
  const rounded = Math.round(rating * 2) / 2;
  const dimension = size === "sm" ? "14" : "18";

  return (
    <span role="img" aria-label={dict.starsAriaLabel.replace("{rating}", String(rating))} className="inline-flex items-center gap-0.5 text-warning-500">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index + 1 <= rounded;
        const half = !filled && index + 0.5 === rounded;
        return (
          <svg key={index} width={dimension} height={dimension} viewBox="0 0 20 20" aria-hidden="true">
            <defs>
              <linearGradient id={`star-half-${index}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.7l-5.2 2.9 1-5.8L1.6 7.7l5.8-.8Z"
              fill={filled ? "currentColor" : half ? `url(#star-half-${index})` : "none"}
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        );
      })}
    </span>
  );
}
