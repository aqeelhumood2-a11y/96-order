export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-brand-100 p-4">
      <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
      <p className="text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}
