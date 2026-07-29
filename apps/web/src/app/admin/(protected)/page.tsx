import { requireSession } from "@/services/auth/session";

/**
 * Minimal protected dashboard shell — no widgets or business screens
 * (those come with the modules behind each permission namespace in a later
 * phase). This only proves the protected-route pattern end to end.
 */
export default async function AdminDashboardPage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Dashboard</h1>
      <p className="text-sm text-foreground/70">Signed in as {session.email}.</p>
    </div>
  );
}
