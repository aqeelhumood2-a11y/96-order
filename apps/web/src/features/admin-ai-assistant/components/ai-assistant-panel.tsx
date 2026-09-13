"use client";

import { useId, useState } from "react";
import { askAdminAssistantAction } from "@/features/admin-ai-assistant/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Textarea } from "@/ui/primitives/textarea";

interface AnsweredQuestion {
  question: string;
  answer: string;
  generatedByAI: boolean;
}

export function AiAssistantPanel({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  const dict = getDictionary(locale).admin.aiAssistantPage;
  const textareaId = useId();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<AnsweredQuestion[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setPending(true);
    setError(null);
    const result = await askAdminAssistantAction(trimmed);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setHistory((current) => [{ question: trimmed, answer: result.data.answer, generatedByAI: result.data.generatedByAI }, ...current]);
    setQuestion("");
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor={textareaId} className="text-sm font-medium text-brand-950">
          {dict.askLabel}
        </label>
        <Textarea
          id={textareaId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={pending}
          rows={2}
          placeholder={dict.askPlaceholder}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {dict.exampleQuestions.map((example) => (
              <button
                key={example}
                type="button"
                disabled={pending}
                onClick={() => void ask(example)}
                className="rounded-full border border-surface-border px-3 py-1 text-xs text-foreground/70 hover:bg-surface-sunken disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
          <Button type="submit" size="sm" disabled={pending || !question.trim()}>
            {pending ? dict.asking : dict.ask}
          </Button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {history.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-md border border-surface-border p-4">
            <p className="text-sm font-medium text-brand-950">{item.question}</p>
            <p className="whitespace-pre-line text-sm text-foreground/80">{item.answer}</p>
            <div>
              <Badge variant={item.generatedByAI ? "accent" : "neutral"}>{item.generatedByAI ? dict.aiGenerated : dict.storeDataSnapshot}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
