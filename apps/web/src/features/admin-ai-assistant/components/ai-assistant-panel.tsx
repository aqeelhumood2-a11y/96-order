"use client";

import { useId, useState } from "react";
import { askAdminAssistantAction } from "@/features/admin-ai-assistant/actions";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Textarea } from "@/ui/primitives/textarea";

const EXAMPLE_QUESTIONS = ["How much cash is still waiting to be collected?", "How are online payments trending?", "What's our order status breakdown?"];

interface AnsweredQuestion {
  question: string;
  answer: string;
  generatedByAI: boolean;
}

export function AiAssistantPanel() {
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
          Ask about your store
        </label>
        <Textarea
          id={textareaId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={pending}
          rows={2}
          placeholder="e.g. Which orders are still waiting on cash collection?"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((example) => (
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
            {pending ? "Asking…" : "Ask"}
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
              <Badge variant={item.generatedByAI ? "accent" : "neutral"}>{item.generatedByAI ? "AI-generated" : "Store data snapshot"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
