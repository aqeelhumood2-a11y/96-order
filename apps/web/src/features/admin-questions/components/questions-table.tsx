"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductQuestion } from "@/core/questions/entities";
import { answerQuestionAction, rejectQuestionAction } from "@/features/questions/actions";
import { Badge } from "@/ui/primitives/badge";
import { Button, Textarea } from "@/ui/primitives";

function AnswerRow({ question, onDone }: { question: ProductQuestion; onDone: () => void }) {
  const answerId = useId();
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAnswer() {
    setBusy(true);
    try {
      await answerQuestionAction(question.id, answer);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectQuestionAction(question.id);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={answerId} className="sr-only">
        Answer
      </label>
      <Textarea id={answerId} value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={busy} rows={2} maxLength={2000} />
      <div className="flex gap-2">
        <Button size="sm" disabled={busy || answer.trim().length === 0} onClick={handleAnswer}>
          Answer
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={handleReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}

export function AdminQuestionsTable({ questions }: { questions: ProductQuestion[] }) {
  const router = useRouter();

  if (questions.length === 0) {
    return <p className="text-sm text-foreground/69">No questions yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {questions.map((question) => (
        <li key={question.id} className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-brand-950">{question.question}</p>
            <Badge variant={question.status === "approved" ? "success" : question.status === "rejected" ? "danger" : "warning"}>{question.status}</Badge>
          </div>
          <p className="text-xs text-foreground/65">
            {question.customerName} · product {question.productId} · {question.createdAt.toLocaleDateString()}
          </p>
          {question.status === "approved" ? (
            <p className="text-sm text-foreground/80">A: {question.answer}</p>
          ) : question.status === "pending" ? (
            <AnswerRow question={question} onDone={() => router.refresh()} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
