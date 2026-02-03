type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  status: string;
};

export default function PageHeader({
  title,
  subtitle,
  eyebrow = "Terra Classic Dashboard",
  status,
}: PageHeaderProps) {
  return (
    <header className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-amber-200">
        {eyebrow}
      </p>
      <div>
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
          {subtitle}
        </p>
      </div>
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {status}
      </p>
    </header>
  );
}
