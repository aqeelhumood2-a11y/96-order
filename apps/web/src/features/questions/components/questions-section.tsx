"use client";

import { useId, useState } from "react";
import type { ProductQuestion } from "@/core/questions/entities";
import { askQuestionAction } from "@/features/questions/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Textarea } from "@/ui/primitives";

export interface QuestionsSectionProps {
  productId: string;
  productSlug: string;
  questions: ProductQuestion[];
  signedIn: boolean;
  locale?: Locale;
}

export function QuestionsSection({ productId, productSlug, questions, signedIn, locale = DEFAULT_LOCALE }: QuestionsSectionProps) {
  const dict = getDictionary(locale).storefront.questions;
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
      <h2 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h2>

      {signedIn ? (
        showForm ? (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
            <label htmlFor={questionId} className="text-sm font-medium text-brand-950">
              {dict.askAQuestion}
            </label>
            <Textarea id={questionId} value={question} onChange={(event) => setQuestion(event.target.value)} disabled={status === "submitting"} required maxLength={1000} rows={3} />
            {error && (
              <p role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
            {status === "success" && (
              <p role="status" className="text-sm text-brand-700">
                {dict.thanksWeWillAnswer}
              </p>
            )}
            <Button type="submit" size="sm" className="w-fit" disabled={status === "submitting"}>
              {status === "submitting" ? dict.submitting : dict.submitQuestion}
            </Button>
          </form>
        ) : (
          <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowForm(true)}>
            {dict.askAQuestion}
          </Button>
        )
      ) : (
        <p className="text-sm text-foreground/69">{dict.signInToAsk}</p>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-foreground/69">{dict.noQuestions}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {questions.map((item) => (
            <li key={item.id} className="border-t border-brand-100 pt-4">
              <p className="font-medium text-brand-950">
                {dict.questionPrefix} {item.question}
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {dict.answerPrefix} {item.answer}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
