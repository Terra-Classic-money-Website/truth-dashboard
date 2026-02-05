type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  status?: string;
  subtitleClassName?: string;
};

export default function PageHeader({
  title,
  subtitle,
  eyebrow = "Terra Classic Dashboard",
  status,
  subtitleClassName = "",
}: PageHeaderProps) {
  return (
    <header className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-amber-200">
        {eyebrow}
      </p>
      <div>
        <h1 className="text-2xl font-semibold text-white md:text-3xl">
          {title}
        </h1>
        <p
          className={`mt-2 max-w-2xl text-sm text-slate-300 md:text-base ${subtitleClassName}`}
        >
          {subtitle}
        </p>
      </div>
      {status ? (
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {status}
        </p>
      ) : null}
    </header>
  );
}
