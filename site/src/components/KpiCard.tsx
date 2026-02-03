import Card from "./Card";

type KpiCardProps = {
  label: string;
  value: string;
  helper?: string;
  trend?: string;
  accent?: "amber" | "sky" | "emerald" | "rose";
};

const accentClassName: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  amber: "border-amber-300/70",
  sky: "border-sky-300/70",
  emerald: "border-emerald-300/70",
  rose: "border-rose-300/70",
};

export default function KpiCard({
  label,
  value,
  helper,
  trend,
  accent = "amber",
}: KpiCardProps) {
  return (
    <Card className={`border-t-2 ${accentClassName[accent]}`}>
      <div className="text-xs uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      {helper ? <div className="mt-2 text-xs text-slate-500">{helper}</div> : null}
      {trend ? <div className="mt-2 text-xs text-emerald-300">{trend}</div> : null}
    </Card>
  );
}
