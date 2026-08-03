import { formatMoney, type Money } from "@/core/money/money";
import type { FulfillmentMethod } from "@/core/delivery/entities";
import type { EmailTemplate } from "@/core/interfaces/email-port";

export interface RenderedEmail {
  subject: string;
  text: string;
}

export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  lines: { name: string; quantity: number; lineTotal: Money }[];
  subtotal: Money;
  shippingFee: Money;
  grandTotal: Money;
  fulfillmentMethod: FulfillmentMethod;
}

export function renderOrderConfirmationEmail(data: OrderConfirmationEmailData): RenderedEmail {
  const lineItems = data.lines.map((line) => `  - ${line.name} x${line.quantity}: ${formatMoney(line.lineTotal)}`).join("\n");
  const fulfillmentLine =
    data.fulfillmentMethod === "delivery" ? "We'll notify you once your order is out for delivery." : "We'll notify you once your order is ready for pickup.";

  return {
    subject: `Order ${data.orderNumber} confirmed`,
    text: [
      `Hi ${data.customerName},`,
      "",
      "Thanks for your order! Here's a summary:",
      "",
      lineItems,
      "",
      `Subtotal: ${formatMoney(data.subtotal)}`,
      `Shipping: ${formatMoney(data.shippingFee)}`,
      `Total: ${formatMoney(data.grandTotal)}`,
      "",
      fulfillmentLine,
      "",
      "— Ninety Six Degrees Cafe",
    ].join("\n"),
  };
}

export interface PaymentConfirmationEmailData {
  orderNumber: string;
  amount: Money;
}

export function renderPaymentConfirmationEmail(data: PaymentConfirmationEmailData): RenderedEmail {
  return {
    subject: `Payment received for order ${data.orderNumber}`,
    text: `We've received your payment of ${formatMoney(data.amount)} for order ${data.orderNumber}. Thank you!\n\n— Ninety Six Degrees Cafe`,
  };
}

export interface PaymentFailureEmailData {
  orderNumber: string;
}

export function renderPaymentFailureEmail(data: PaymentFailureEmailData): RenderedEmail {
  return {
    subject: `Payment issue with order ${data.orderNumber}`,
    text: `We weren't able to process payment for order ${data.orderNumber}. No charge was completed. Please try again or choose a different payment method.\n\n— Ninety Six Degrees Cafe`,
  };
}

export interface PickupConfirmationEmailData {
  orderNumber: string;
  locationName: string;
  locationAddress: string;
  scheduleDate: string;
  scheduleTimeWindow: string;
}

export function renderPickupConfirmationEmail(data: PickupConfirmationEmailData): RenderedEmail {
  return {
    subject: `Your order ${data.orderNumber} will be ready for pickup`,
    text: [
      `Your order ${data.orderNumber} will be ready for pickup at:`,
      "",
      data.locationName,
      data.locationAddress,
      "",
      `Pickup window: ${data.scheduleDate}, ${data.scheduleTimeWindow}`,
      "",
      "— Ninety Six Degrees Cafe",
    ].join("\n"),
  };
}

export interface DeliveryConfirmationEmailData {
  orderNumber: string;
  scheduleDate: string;
  scheduleTimeWindow: string;
}

/**
 * Deliberately the thinnest of the five templates — Phase 5 has no
 * courier/tracking integration yet, so this only acknowledges the
 * scheduled delivery window rather than promising real-time tracking. See
 * README's Known limitations for the future courier-integration seam.
 */
export function renderDeliveryConfirmationEmail(data: DeliveryConfirmationEmailData): RenderedEmail {
  return {
    subject: `Your order ${data.orderNumber} is scheduled for delivery`,
    text: `Your order ${data.orderNumber} is scheduled for delivery on ${data.scheduleDate}, ${data.scheduleTimeWindow}.\n\n— Ninety Six Degrees Cafe`,
  };
}

export interface CustomerEmailVerificationEmailData {
  verifyUrl: string;
}

export function renderCustomerEmailVerificationEmail(data: CustomerEmailVerificationEmailData): RenderedEmail {
  return {
    subject: "Verify your email address",
    text: [
      "Thanks for creating an account with Ninety Six Degrees Cafe.",
      "",
      `Please verify your email address by visiting: ${data.verifyUrl}`,
      "",
      "This link expires in 24 hours. If you didn't create this account, you can ignore this email.",
      "",
      "— Ninety Six Degrees Cafe",
    ].join("\n"),
  };
}

export interface BackInStockEmailData {
  productName: string;
  productUrl: string;
  unsubscribeUrl: string;
}

export function renderBackInStockEmail(data: BackInStockEmailData): RenderedEmail {
  return {
    subject: `${data.productName} is back in stock`,
    text: [`Good news — ${data.productName} is back in stock.`, "", `Shop now: ${data.productUrl}`, "", `Don't want these alerts? Unsubscribe: ${data.unsubscribeUrl}`, "", "— Ninety Six Degrees Cafe"].join("\n"),
  };
}

export interface ProductQuestionAnsweredEmailData {
  productName: string;
  question: string;
  answer: string;
  productUrl: string;
}

export function renderProductQuestionAnsweredEmail(data: ProductQuestionAnsweredEmailData): RenderedEmail {
  return {
    subject: `Your question about ${data.productName} was answered`,
    text: [
      `Your question about ${data.productName} has been answered:`,
      "",
      `Q: ${data.question}`,
      `A: ${data.answer}`,
      "",
      `View it here: ${data.productUrl}`,
      "",
      "— Ninety Six Degrees Cafe",
    ].join("\n"),
  };
}

export interface ReviewStatusChangedEmailData {
  productName: string;
  status: string;
}

export function renderReviewStatusChangedEmail(data: ReviewStatusChangedEmailData): RenderedEmail {
  return {
    subject: `Your review of ${data.productName} was ${data.status}`,
    text: `Your review of ${data.productName} has been ${data.status}.\n\n— Ninety Six Degrees Cafe`,
  };
}

/**
 * Runtime dispatch from `EmailTemplate` to its render function — the one
 * place `infrastructure/email/console-email-provider.ts` (and any future
 * real ESP adapter) needs to know about, so adding a sixth template later
 * means adding one case here, not touching every email adapter.
 */
export function renderEmailTemplate(template: EmailTemplate, data: Record<string, unknown>): RenderedEmail {
  switch (template) {
    case "order_confirmation":
      return renderOrderConfirmationEmail(data as unknown as OrderConfirmationEmailData);
    case "payment_confirmation":
      return renderPaymentConfirmationEmail(data as unknown as PaymentConfirmationEmailData);
    case "payment_failure":
      return renderPaymentFailureEmail(data as unknown as PaymentFailureEmailData);
    case "pickup_confirmation":
      return renderPickupConfirmationEmail(data as unknown as PickupConfirmationEmailData);
    case "delivery_confirmation":
      return renderDeliveryConfirmationEmail(data as unknown as DeliveryConfirmationEmailData);
    case "customer_email_verification":
      return renderCustomerEmailVerificationEmail(data as unknown as CustomerEmailVerificationEmailData);
    case "back_in_stock":
      return renderBackInStockEmail(data as unknown as BackInStockEmailData);
    case "product_question_answered":
      return renderProductQuestionAnsweredEmail(data as unknown as ProductQuestionAnsweredEmailData);
    case "review_status_changed":
      return renderReviewStatusChangedEmail(data as unknown as ReviewStatusChangedEmailData);
  }
}
