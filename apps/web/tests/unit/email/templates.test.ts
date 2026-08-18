import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import {
  renderDeliveryConfirmationEmail,
  renderEmailTemplate,
  renderOrderConfirmationEmail,
  renderPaymentConfirmationEmail,
  renderPaymentFailureEmail,
  renderPickupConfirmationEmail,
} from "@/core/email/templates";

describe("renderOrderConfirmationEmail", () => {
  it("includes the order number, line items, and totals", () => {
    const email = renderOrderConfirmationEmail({
      orderNumber: "ORD-260130-7K3PXQ",
      customerName: "Fatima",
      lines: [{ name: "Ethiopia Yirgacheffe", quantity: 2, lineTotal: money(3798) }],
      subtotal: money(3798),
      shippingFee: money(2000),
      grandTotal: money(5798),
      fulfillmentMethod: "delivery",
    });

    expect(email.subject).toContain("ORD-260130-7K3PXQ");
    expect(email.text).toContain("Fatima");
    expect(email.text).toContain("Ethiopia Yirgacheffe x2");
    expect(email.text).toContain("3.798 BHD");
    expect(email.text).toContain("5.798 BHD");
    expect(email.text).toContain("out for delivery");
  });

  it("mentions pickup instead of delivery when the fulfillment method is pickup", () => {
    const email = renderOrderConfirmationEmail({
      orderNumber: "ORD-260130-7K3PXQ",
      customerName: "Fatima",
      lines: [],
      subtotal: money(0),
      shippingFee: money(0),
      grandTotal: money(0),
      fulfillmentMethod: "pickup",
    });
    expect(email.text).toContain("ready for pickup");
  });
});

describe("renderPaymentConfirmationEmail", () => {
  it("includes the amount and order number", () => {
    const email = renderPaymentConfirmationEmail({ orderNumber: "ORD-1", amount: money(1899) });
    expect(email.subject).toContain("ORD-1");
    expect(email.text).toContain("1.899 BHD");
  });
});

describe("renderPaymentFailureEmail", () => {
  it("mentions no charge was completed", () => {
    const email = renderPaymentFailureEmail({ orderNumber: "ORD-1" });
    expect(email.text).toContain("No charge was completed");
  });
});

describe("renderPickupConfirmationEmail", () => {
  it("includes the location and schedule", () => {
    const email = renderPickupConfirmationEmail({
      orderNumber: "ORD-1",
      locationName: "Ninety Six Degrees Cafe — Seef",
      locationAddress: "Seef District, Manama",
      scheduleDate: "2026-02-01",
      scheduleTimeWindow: "10:00-12:00",
    });
    expect(email.text).toContain("Ninety Six Degrees Cafe — Seef");
    expect(email.text).toContain("10:00-12:00");
  });
});

describe("renderDeliveryConfirmationEmail", () => {
  it("mentions the scheduled window", () => {
    const email = renderDeliveryConfirmationEmail({ orderNumber: "ORD-1", scheduleDate: "2026-02-01", scheduleTimeWindow: "10:00-12:00" });
    expect(email.text).toContain("2026-02-01");
    expect(email.text).toContain("10:00-12:00");
  });
});

describe("renderEmailTemplate", () => {
  it("dispatches to the right renderer for each template", () => {
    expect(renderEmailTemplate("payment_failure", { orderNumber: "ORD-1" }).subject).toContain("ORD-1");
    expect(
      renderEmailTemplate("delivery_confirmation", { orderNumber: "ORD-1", scheduleDate: "2026-02-01", scheduleTimeWindow: "10:00-12:00" }).subject,
    ).toContain("ORD-1");
  });
});
