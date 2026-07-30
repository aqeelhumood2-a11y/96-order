import "server-only";
import type { CurrencyCode, Money } from "@/core/money/money";

/** Firestore doesn't need a richer representation than `Money` already is — this only exists so every repository storing a `Money` field does it with the same two field names. */
export interface MoneyDoc {
  amount: number;
  currency: CurrencyCode;
}

export function moneyToDoc(value: Money): MoneyDoc {
  return { amount: value.amount, currency: value.currency };
}

export function moneyFromDoc(doc: MoneyDoc): Money {
  return { amount: doc.amount, currency: doc.currency };
}
