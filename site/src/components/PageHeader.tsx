type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Giga Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            {title}
          </h2>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-wider text-slate-400">
          Static Preview
        </span>
      </div>
      <p className="max-w-2xl text-sm text-slate-300 md:text-base">
        {subtitle}
      </p>
      <div className="h-px w-full bg-gradient-to-r from-slate-800 via-slate-700 to-transparent" />
    </section>
  );
}
