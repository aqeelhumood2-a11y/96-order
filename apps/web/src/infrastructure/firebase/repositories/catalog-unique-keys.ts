import "server-only";
import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import { ConflictError } from "@/core/errors";

const COLLECTION = "catalogUniqueKeys";

export interface UniqueKeyClaim {
  /** e.g. `"product-slug"`, `"category-slug"`, `"brand-slug"`, `"sku"`, `"barcode"` — see README's unique-key strategy section for the full namespace list. */
  type: string;
  /** Already normalized by the caller (trimmed, case-folded as appropriate for that type). */
  value: string;
}

function keyDocId(claim: UniqueKeyClaim): string {
  return `${claim.type}:${claim.value}`;
}

function describeClaim(claim: UniqueKeyClaim): string {
  return `This ${claim.type.replace(/-/g, " ")} is already in use: "${claim.value}".`;
}

/**
 * Transactionally claims `claims` for `ownerId`/`ownerKind` and releases
 * `releases` (keys this same owner previously held but no longer needs,
 * e.g. a changed slug) — both within `transaction`, so this participates
 * atomically in the caller's larger product/category/brand write. Throws
 * `ConflictError` if any claimed key is already held by a *different*
 * owner.
 *
 * Firestore transactions require every read before any write; this
 * function's own reads (checking existing key docs) happen first, then its
 * writes — so it's safe to call in the middle of a larger transaction
 * callback as long as the caller hasn't written anything yet (reads may
 * still follow, but nothing before this call may already be a write).
 *
 * This collection (`catalogUniqueKeys`) is the Phase 3 mechanism for
 * cross-document uniqueness that Firestore itself has no native
 * constraint for — see the README's "Unique-key strategy" section for why
 * this shape was chosen over alternatives (e.g. querying for existing
 * values, which cannot be done atomically with the writing transaction).
 */
export async function reconcileUniqueKeys(
  db: Firestore,
  transaction: Transaction,
  ownerId: string,
  ownerKind: string,
  claims: readonly UniqueKeyClaim[],
  releases: readonly UniqueKeyClaim[] = [],
): Promise<void> {
  const collection = db.collection(COLLECTION);

  const claimRefs = claims.map((claim) => collection.doc(keyDocId(claim)));
  const claimSnaps = await Promise.all(claimRefs.map((ref) => transaction.get(ref)));

  claimSnaps.forEach((snap, index) => {
    const data = snap.data() as { ownerId?: string } | undefined;
    if (snap.exists && data?.ownerId !== ownerId) {
      throw new ConflictError(describeClaim(claims[index]!));
    }
  });

  claimRefs.forEach((ref, index) => {
    const claim = claims[index]!;
    transaction.set(ref, {
      type: claim.type,
      value: claim.value,
      ownerId,
      ownerKind,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  for (const release of releases) {
    transaction.delete(collection.doc(keyDocId(release)));
  }
}

/** Keys a set of claims by `type:value` for cheap before/after diffing (which to release, which are genuinely new). */
export function diffUniqueKeyClaims(
  previous: readonly UniqueKeyClaim[],
  next: readonly UniqueKeyClaim[],
): { toClaim: UniqueKeyClaim[]; toRelease: UniqueKeyClaim[] } {
  const previousIds = new Set(previous.map(keyDocId));
  const nextIds = new Set(next.map(keyDocId));

  return {
    toClaim: next.filter((claim) => !previousIds.has(keyDocId(claim))),
    toRelease: previous.filter((claim) => !nextIds.has(keyDocId(claim))),
  };
}
