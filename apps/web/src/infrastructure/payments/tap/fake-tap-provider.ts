import { randomUUID } from "node:crypto";
import type {
  CreateChargeInput,
  CreateChargeResult,
  NormalizedPaymentStatus,
  NormalizedWebhookEvent,
  PaymentProviderPort,
} from "@/core/interfaces/payment-provider-port";

interface FakeCharge {
  id: string;
  status: NormalizedPaymentStatus;
  orderId: string;
}

/**
 * An in-memory, no-network stand-in for `TapPaymentProvider` — selected
 * automatically (see `services/payments/dependencies.ts`) whenever
 * `TAP_SECRET_KEY` isn't configured, which is always true in this
 * repository's CI/emulator/local-dev runs since no real Tap credentials
 * are committed. It never claims a payment succeeded on its own: a test
 * calls `advanceCharge`/`buildWebhookBody` to simulate what a *real* Tap
 * webhook delivery would say, and that fake body still flows through the
 * exact same `services/payments/handle-tap-webhook.ts` code path a real
 * webhook would — this class only fakes the transport, never the
 * business logic under test.
 */
export class FakeTapProvider implements PaymentProviderPort {
  private readonly charges = new Map<string, FakeCharge>();

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const id = `chg_fake_${randomUUID()}`;
    this.charges.set(id, { id, status: "pending", orderId: input.orderId });
    return { providerReference: id, redirectUrl: `https://fake-tap.test/pay/${id}` };
  }

  verifyWebhookSignature(_rawBody: string, _signatureHeader: string | null): boolean {
    // No real signature to check over the fake transport — every
    // delivery this class produces is inherently "from" this same test
    // process.
    return true;
  }

  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent {
    const parsed = JSON.parse(rawBody) as { id: string; status: NormalizedPaymentStatus };
    return {
      eventId: `${parsed.id}:${parsed.status}`,
      eventType: `charge.${parsed.status}`,
      providerReference: parsed.id,
      status: parsed.status,
    };
  }

  async retrieveCharge(providerReference: string): Promise<{ status: NormalizedPaymentStatus }> {
    const charge = this.charges.get(providerReference);
    if (!charge) throw new Error(`Unknown fake charge ${providerReference}`);
    return { status: charge.status };
  }

  /** Test-only: builds the exact raw webhook body a test POSTs to the webhook route, and records the new status against this fake's own charge state (so a later `retrieveCharge` reconciliation check agrees with it). */
  buildWebhookBody(providerReference: string, status: NormalizedPaymentStatus): string {
    const charge = this.charges.get(providerReference);
    if (!charge) throw new Error(`Unknown fake charge ${providerReference}`);
    charge.status = status;
    return JSON.stringify({ id: providerReference, status });
  }
}
