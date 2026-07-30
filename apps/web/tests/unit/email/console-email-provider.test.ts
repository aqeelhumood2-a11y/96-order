import { describe, expect, it } from "vitest";
import { ConsoleEmailProvider } from "@/infrastructure/email/console-email-provider";
import { money } from "@/core/money/money";

describe("ConsoleEmailProvider", () => {
  it("reports success for a well-formed message", async () => {
    const provider = new ConsoleEmailProvider();
    const result = await provider.send({
      to: "shopper@example.com",
      template: "payment_confirmation",
      data: { orderNumber: "ORD-1", amount: money(1899) },
    });
    expect(result).toEqual({ sent: true });
  });

  it("never throws — reports { sent: false, error } for malformed template data instead", async () => {
    const provider = new ConsoleEmailProvider();
    const result = await provider.send({
      to: "shopper@example.com",
      template: "payment_confirmation",
      // Missing `amount` entirely — formatMoney would throw reading `.amount` off undefined.
      data: { orderNumber: "ORD-1" },
    });
    expect(result.sent).toBe(false);
    expect(result.error).toBeDefined();
  });
});
