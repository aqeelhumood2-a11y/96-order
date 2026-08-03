"use client";

import { useId, useState } from "react";
import type { ProductQuestion } from "@/core/questions/entities";
import { askQuestionAction } from "@/features/questions/actions";
import { Button, Textarea } from "@/ui/primitives";

export interface QuestionsSectionProps {
  productId: string;
  productSlug: string;
  questions: ProductQuestion[];
  signedIn: boolean;
}

export function QuestionsSection({ productId, productSlug, questions, signedIn }: QuestionsSectionProps) {
  const questionId = useId();
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);
    const result = await askQuestionAction(productSlug, productId, question);
    if (!result.ok) {
      setStatus("error");
      setError(result.message);
      return;
    }
    setStatus("success");
    setQuestion("");
  }

  return (
    <section className="mt-16 flex flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight text-brand-950">Questions &amp; answers</h2>

      {signedIn ? (
        showForm ? (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
            <label htmlFor={questionId} className="text-sm font-medium text-brand-950">
              Ask a question
            </label>
            <Textarea id={questionId} value={question} onChange={(event) => setQuestion(event.target.value)} disabled={status === "submitting"} required maxLength={1000} rows={3} />
            {error && (
              <p role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
            {status === "success" && (
              <p role="status" className="text-sm text-brand-700">
                Thanks — we&apos;ll post an answer soon.
              </p>
            )}
            <Button type="submit" size="sm" className="w-fit" disabled={status === "submitting"}>
              {status === "submitting" ? "Submitting…" : "Submit question"}
            </Button>
          </form>
        ) : (
          <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowForm(true)}>
            Ask a question
          </Button>
        )
      ) : (
        <p className="text-sm text-foreground/60">Sign in to ask a question.</p>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-foreground/60">No questions yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {questions.map((item) => (
            <li key={item.id} className="border-t border-brand-100 pt-4">
              <p className="font-medium text-brand-950">Q: {item.question}</p>
              <p className="mt-1 text-sm text-foreground/80">A: {item.answer}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
