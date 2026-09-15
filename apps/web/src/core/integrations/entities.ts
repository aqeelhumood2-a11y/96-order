/**
 * Credentials for pushing data to the store's own POS system (e.g. an
 * "Info System"-style till) — kept in a dedicated singleton document, never
 * folded into `SiteSettings`, because `SiteSettings` is read wholesale by
 * `getPublicSiteSettings()` for the storefront header/footer; a secret
 * living there would ship straight to every shopper's browser. Only
 * admin-only code paths (gated on `integrations:manage`) may read or write
 * this document.
 *
 * Storing the URL/key here is deliberately the full scope of this pass —
 * no outbound call is wired up yet. The actual request this app should
 * send (on which order event, in what shape, with what auth header) needs
 * the POS vendor's real API contract first; guessing one would ship an
 * integration that silently doesn't work.
 */
export interface PosIntegrationSettings {
  webhookUrl: string;
  apiKey: string;
  updatedAt: Date;
  updatedBy: string;
}

export function defaultPosIntegrationSettings(): Omit<PosIntegrationSettings, "updatedAt" | "updatedBy"> {
  return { webhookUrl: "", apiKey: "" };
}
