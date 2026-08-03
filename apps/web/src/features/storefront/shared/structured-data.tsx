export interface StructuredDataProps {
  data: Record<string, unknown>;
}

/**
 * `JSON.stringify` never escapes `<`, so a field that ends up in `data`
 * containing a literal `</script>` (a product name/description, however
 * unlikely — this is admin-authored, not shopper-authored, but "admin
 * input" is still not "trusted to contain executable markup") would
 * otherwise close this tag early and let whatever follows execute as a
 * real `<script>` for every visitor of that page. Escaping `<`/`>`/`&` to
 * their `\u00XX` forms is a no-op for JSON-LD parsers (which decode the
 * escape before reading the JSON) and closes that gap entirely.
 */
function toSafeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

/** Renders a JSON-LD `<script>` tag. `data` must come from server-generated SEO helpers only — never raw, unescaped user input. */
export function StructuredData({ data }: StructuredDataProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toSafeJsonLd(data) }} />;
}
