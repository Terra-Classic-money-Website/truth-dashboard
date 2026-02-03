type SectionTitleProps = {
  title: string;
  subtitle?: string;
  meta?: string;
};

export default function SectionTitle({ title, subtitle, meta }: SectionTitleProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {meta ? (
        <span className="text-xs uppercase tracking-wider text-slate-500">
          {meta}
        </span>
      ) : null}
    </div>
  );
}
