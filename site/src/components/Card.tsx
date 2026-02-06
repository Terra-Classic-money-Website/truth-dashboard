import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-xl backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}
