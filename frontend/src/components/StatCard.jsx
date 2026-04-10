import { Card } from "./Card";

export function StatCard({ label, value, hint }) {
  return (
    <Card className="bg-sand/95">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
    </Card>
  );
}
