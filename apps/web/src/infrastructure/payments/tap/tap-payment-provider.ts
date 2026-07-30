import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateChargeInput,
  CreateChargeResult,
  NormalizedPaymentStatus,
  NormalizedWebhookEvent,
  PaymentProviderPort,
} from "@/core/interfaces/payment-provider-port";
import { getTapEnv } from "./env";

const TAP_API_BASE_URL = "https://api.tap.company/v2";
const MINOR_UNITS_PER_MAJOR = 1000;

interface TapChargePayload {
  id: string;
  status: string;
  amount?: number;
  currency?: string;
}

// Tap's charge statuses -> this app's normalized statuses. Reconfirm the
// exact status strings against https://developers.tap.company before
// going live — this was implemented without a real Tap sandbox account to
// verify end-to-end (see this file's class doc comment and
// `FakeTapProvider` for how tests exercise the contract without one).
const TAP_STATUS_MAP: Record<string, NormalizedPaymentStatus> = {
  INITIATED: "pending",
  IN_PROGRESS: "pending",
  ABANDONED: "cancelled",
  CANCELLED: "cancelled",
  FAILED: "failed",
  DECLINED: "failed",
  RESTRICTED: "failed",
  CAPTURED: "paid",
  AUTHORIZED: "authorized",
  VOID: "cancelled",
  TIMEDOUT: "failed",
};

function normalizeTapStatus(status: string): NormalizedPaymentStatus {
  return TAP_STATUS_MAP[status.toUpperCase()] ?? "pending";
}

/**
 * Talks to Tap Payments' hosted-checkout Charges API directly over HTTPS
 * — no Tap SDK dependency, just `fetch` and the documented REST contract.
 * Card data never touches this app: the browser is redirected to Tap's
 * own hosted payment page (the charge's `transaction.url`), and this
 * adapter only ever sees a charge id and a status back.
 *
 * The exact field names/status strings below reflect Tap's v2 Charges API
 * as documented publicly; **reconfirm against
 * https://developers.tap.company before processing a real live payment**
 * — this was implemented without access to a real Tap sandbox account to
 * verify end-to-end. See README's Tap configuration section and
 * `FakeTapProvider` for how this whole contract is exercised in tests
 * without needing live credentials.
 */
export class TapPaymentProvider implements PaymentProviderPort {
  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const { secretKey } = getTapEnv();

    const response = await fetch(`${TAP_API_BASE_URL}/charges`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: input.amount.amount / MINOR_UNITS_PER_MAJOR,
        currency: input.amount.currency,
        customer: { first_name: input.customerName, email: input.customerEmail },
        source: { id: "src_all" },
        redirect: { url: input.returnUrl },
        reference: { order: input.orderId, label: input.orderNumber },
        description: `Order ${input.orderNumber}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tap charge creation failed with status ${response.status}`);
    }

    const body = (await response.json()) as { id?: string; transaction?: { url?: string } };
    if (!body.id || !body.transaction?.url) {
      throw new Error("Tap charge creation response was missing a charge id or redirect URL.");
    }

    return { providerReference: body.id, redirectUrl: body.transaction.url };
  }

  /**
   * Tap signs a webhook by HMAC-SHA256-ing a fixed, ordered concatenation
   * of specific charge fields with the secret key — never the raw body
   * itself, since JSON key order isn't guaranteed to survive redelivery.
   * `signatureHeader` is the hex digest Tap sends; a length mismatch or a
   * non-hex header fails closed (returns `false`) rather than throwing,
   * so a malformed request is simply treated as unverified.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader) return false;

    let charge: TapChargePayload;
    try {
      charge = JSON.parse(rawBody) as TapChargePayload;
    } catch {
      return false;
    }
    if (!charge.id) return false;

    const { secretKey } = getTapEnv();
    const toSign = `x_id${charge.id}x_amount${charge.amount}x_currency${charge.currency}x_status${charge.status}`;
    const expectedHex = createHmac("sha256", secretKey).update(toSign).digest("hex");

    try {
      const expectedBuffer = Buffer.from(expectedHex, "hex");
      const providedBuffer = Buffer.from(signatureHeader, "hex");
      if (expectedBuffer.length !== providedBuffer.length) return false;
      return timingSafeEqual(expectedBuffer, providedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Tap doesn't send a distinct "event id" the way some providers do for
   * a charge-status webhook — `${charge.id}:${charge.status}` is used as
   * the idempotency key instead (see `PaymentWebhookEventRepository`),
   * which correctly treats a *redelivery* of the same status as a
   * duplicate while still letting a genuine progression (e.g.
   * `AUTHORIZED` -> `CAPTURED`) through as a new event.
   */
  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent {
    const charge = JSON.parse(rawBody) as TapChargePayload;
    return {
      eventId: `${charge.id}:${charge.status}`,
      eventType: `charge.${charge.status.toLowerCase()}`,
      providerReference: charge.id,
      status: normalizeTapStatus(charge.status),
    };
  }

  async retrieveCharge(providerReference: string): Promise<{ status: NormalizedPaymentStatus }> {
    const { secretKey } = getTapEnv();
    const response = await fetch(`${TAP_API_BASE_URL}/charges/${providerReference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to retrieve Tap charge ${providerReference}: status ${response.status}`);
    }
    const body = (await response.json()) as { status: string };
    return { status: normalizeTapStatus(body.status) };
  }
}
