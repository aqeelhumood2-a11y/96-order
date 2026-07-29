import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";

const limiter = new FirestoreRateLimiter();

describe("FirestoreRateLimiter (emulator)", () => {
  it("allows requests up to the limit, then denies with a retryAfterSeconds", async () => {
    const key = `test:${randomUUID()}`;

    const first = await limiter.consume(key, 2, 60);
    const second = await limiter.consume(key, 2, 60);
    const third = await limiter.consume(key, 2, 60);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the count once the window has elapsed", async () => {
    const key = `test:${randomUUID()}`;

    const first = await limiter.consume(key, 1, 1);
    expect(first.allowed).toBe(true);

    const withinWindow = await limiter.consume(key, 1, 1);
    expect(withinWindow.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const afterWindow = await limiter.consume(key, 1, 1);
    expect(afterWindow.allowed).toBe(true);
  });

  it("tracks independent keys independently", async () => {
    const keyA = `test:${randomUUID()}`;
    const keyB = `test:${randomUUID()}`;

    await limiter.consume(keyA, 1, 60);
    const resultA = await limiter.consume(keyA, 1, 60);
    const resultB = await limiter.consume(keyB, 1, 60);

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });
});
