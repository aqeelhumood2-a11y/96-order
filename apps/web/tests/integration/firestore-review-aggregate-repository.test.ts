import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { averageRating } from "@/core/reviews/aggregate";
import { FirestoreReviewAggregateRepository } from "@/infrastructure/firebase/repositories/firestore-review-aggregate-repository";

const repo = new FirestoreReviewAggregateRepository();

describe("FirestoreReviewAggregateRepository (emulator)", () => {
  it("findByProduct() returns null before any rating has ever been applied", async () => {
    expect(await repo.findByProduct(`product-${randomUUID()}`)).toBeNull();
  });

  it("applyRatingChange() creates the aggregate on the first call and accumulates on later ones", async () => {
    const productId = `product-${randomUUID()}`;

    await repo.applyRatingChange(productId, 5, 1);
    let aggregate = await repo.findByProduct(productId);
    expect(aggregate).toMatchObject({ sum: 5, count: 1 });
    expect(averageRating(aggregate)).toBe(5);

    await repo.applyRatingChange(productId, 3, 1);
    aggregate = await repo.findByProduct(productId);
    expect(aggregate).toMatchObject({ sum: 8, count: 2 });
    expect(averageRating(aggregate)).toBe(4);
  });

  it("applyRatingChange() with a negative delta reverses a rating (a review moving away from approved)", async () => {
    const productId = `product-${randomUUID()}`;
    await repo.applyRatingChange(productId, 5, 1);
    await repo.applyRatingChange(productId, 3, 1);

    await repo.applyRatingChange(productId, -5, -1);
    const aggregate = await repo.findByProduct(productId);
    expect(aggregate).toMatchObject({ sum: 3, count: 1 });
  });

  it("never lets count go negative even if deltas are applied out of order", async () => {
    const productId = `product-${randomUUID()}`;
    await repo.applyRatingChange(productId, -5, -1);

    const aggregate = await repo.findByProduct(productId);
    expect(aggregate?.count).toBe(0);
  });
});
