"use client";

import { useId, useState } from "react";
import type { Review } from "@/core/reviews/entities";
import { createReviewAction, deleteMyReviewAction, updateMyReviewAction } from "@/features/reviews/actions";
import { StarRatingInput } from "@/features/reviews/components/star-rating-input";
import { Button, Input, Label, Textarea } from "@/ui/primitives";

export interface ReviewFormProps {
  productId: string;
  productSlug: string;
  /** When set, the form edits this existing (always `"pending"`) review instead of creating a new one. */
  existing?: Review;
  onDone?: () => void;
}

export function ReviewForm({ productId, productSlug, existing, onDone }: ReviewFormProps) {
  const titleId = useId();
  const bodyId = useId();
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [status, setStatus] = useState<"idle" | "submitting" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    const result = existing
      ? await updateMyReviewAction(productSlug, existing.id, { rating, title, body })
      : await createReviewAction(productSlug, { productId, rating, title, body });
    setStatus("idle");
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onDone?.();
  }

  async function handleDelete() {
    if (!existing) return;
    setStatus("deleting");
    const result = await deleteMyReviewAction(productSlug, existing.id);
    setStatus("idle");
    if (result.ok) onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 rounded-md border border-brand-100 p-4">
      <StarRatingInput value={rating} onChange={setRating} disabled={status !== "idle"} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={titleId}>Title</Label>
        <Input id={titleId} value={title} onChange={(event) => setTitle(event.target.value)} disabled={status !== "idle"} required maxLength={150} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={bodyId}>Review</Label>
        <Textarea id={bodyId} value={body} onChange={(event) => setBody(event.target.value)} disabled={status !== "idle"} required maxLength={5000} rows={4} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={status !== "idle"}>
          {status === "submitting" ? "Saving…" : existing ? "Save changes" : "Submit review"}
        </Button>
        {existing && (
          <Button type="button" size="sm" variant="destructive" disabled={status !== "idle"} onClick={handleDelete}>
            {status === "deleting" ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}
