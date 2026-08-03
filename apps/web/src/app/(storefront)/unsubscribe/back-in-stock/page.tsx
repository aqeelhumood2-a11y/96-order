import { Container } from "@/ui/layout/container";
import { unsubscribeFromBackInStockByToken } from "@/services/back-in-stock/unsubscribe";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ id?: string; token?: string }>;
}

/**
 * Server Component running a mutation during render — the same deliberate,
 * justified exception `account/verify-email/page.tsx` documents: this link
 * only ever arrives via an emailed, single-purpose URL, the action is
 * idempotent (cancelling an already-cancelled subscription is a no-op),
 * and it's always user-initiated by clicking the link, never a GET a
 * browser/crawler could trigger unexpectedly with a real effect.
 */
export default async function BackInStockUnsubscribePage({ searchParams }: PageProps) {
  const { id, token } = await searchParams;

  let message = "This unsubscribe link is invalid.";
  if (id && token) {
    try {
      await unsubscribeFromBackInStockByToken(id, token);
      message = "You've been unsubscribed from this back-in-stock alert.";
    } catch {
      message = "This unsubscribe link is invalid or has already been used.";
    }
  }

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Back-in-stock alerts</h1>
      <p className="mt-4 text-sm text-foreground/70">{message}</p>
    </Container>
  );
}
