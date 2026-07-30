export interface StructuredDataProps {
  data: Record<string, unknown>;
}

/** Renders a JSON-LD `<script>` tag. `data` must come from server-generated SEO helpers only — never raw user input. */
export function StructuredData({ data }: StructuredDataProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
