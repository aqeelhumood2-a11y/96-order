import { ForbiddenError } from "@/core/errors";
import { AiAssistantPanel } from "@/features/admin-ai-assistant/components/ai-assistant-panel";
import { requirePermission, requireSession } from "@/services/auth/session";

export default async function AiAssistantPage() {
  const session = await requireSession();

  try {
    requirePermission(session, "reports:view");
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">AI Admin Assistant</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Ask questions about orders, payments, and cash collection. Answers are read-only and based only on your store&apos;s own report data.
        </p>
      </div>
      <AiAssistantPanel />
    </div>
  );
}
