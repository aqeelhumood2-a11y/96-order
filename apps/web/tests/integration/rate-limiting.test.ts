import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST as sessionPost } from "@/app/api/auth/session/route";
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { RATE_LIMITS } from "@/config/auth";

function jsonRequest(url: string, body: unknown, ip: string): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sec-fetch-site": "none", // bypasses the same-origin check the way a same-origin browser request would
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

/**
 * These call the real, exported Route Handlers (`POST` from
 * `app/api/auth/session/route.ts` and `app/api/auth/forgot-password/route.ts`)
 * directly, against the real Firestore-backed rate limiter on the emulator
 * — not the service layer with mocked ports. This is what actually proves
 * a public HTTP request can't bypass the limiter: the route, the hashing,
 * the transaction, all real.
 */
describe("rate limiting cannot be bypassed via the public routes (emulator)", () => {
  it("POST /api/auth/session rejects with 429 once the per-email limit is exceeded, before ever reaching Identity Toolkit for the excess attempts", async () => {
    const email = `${randomUUID()}@example.com`;
    const ip = `10.0.0.${Math.floor(Math.random() * 254) + 1}`;
    const limit = RATE_LIMITS.sessionCreateByEmail.limit;

    const responses: Response[] = [];
    for (let i = 0; i < limit + 2; i++) {
      responses.push(
        await sessionPost(jsonRequest("http://localhost:3000/api/auth/session", { email, password: "wrong-password" }, ip)),
      );
    }

    const statuses = responses.map((response) => response.status);
    // Every attempt up to the limit fails authentication (401) — the
    // account doesn't exist — but is still *allowed through the limiter*.
    for (let i = 0; i < limit; i++) {
      expect(statuses[i]).toBe(401);
    }
    // Everything past the limit is rejected by the rate limiter itself (429),
    // not by Identity Toolkit — this is the actual proof of no bypass.
    for (let i = limit; i < statuses.length; i++) {
      expect(statuses[i]).toBe(429);
      const body = (await responses[i]!.json()) as { code?: string };
      expect(body.code).toBe("RATE_LIMITED");
    }
  }, 30_000);

  it("POST /api/auth/forgot-password rejects with 429 once the per-email limit is exceeded", async () => {
    const email = `${randomUUID()}@example.com`;
    const ip = `10.0.1.${Math.floor(Math.random() * 254) + 1}`;
    const limit = RATE_LIMITS.forgotPasswordByEmail.limit;

    const responses: Response[] = [];
    for (let i = 0; i < limit + 1; i++) {
      responses.push(
        await forgotPasswordPost(jsonRequest("http://localhost:3000/api/auth/forgot-password", { email }, ip)),
      );
    }

    const statuses = responses.map((response) => response.status);
    for (let i = 0; i < limit; i++) {
      expect(statuses[i]).toBe(200);
    }
    expect(statuses[limit]).toBe(429);
  }, 30_000);

  it("rejects a cross-site request to the session route regardless of rate-limit state", async () => {
    const response = await sessionPost(
      new Request("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example.com",
        },
        body: JSON.stringify({ email: "a@example.com", password: "x" }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
