/** Informational only — Phase 7 doesn't gate storefront access behind maintenance mode, just surfaces the admin-configured message. See README's Known limitations. */
export function MaintenanceBanner({ message }: { message: string }) {
  return (
    <div role="status" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      {message || "This site is currently undergoing maintenance."}
    </div>
  );
}
