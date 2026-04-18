import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-premium backdrop-blur ${className}`}>{children}</div>;
}

export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-2xl px-4 py-3 font-medium transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props}>{children}</button>;
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${className}`} {...props} />;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 ${className}`}>{children}</span>;
}

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-sky-300">{eyebrow}</p> : null}
      <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
      {subtitle ? <p className="max-w-3xl text-sm text-slate-300 sm:text-base">{subtitle}</p> : null}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <Card className="p-6 text-center"><h3 className="text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm text-slate-400">{description}</p></Card>;
}

export function Loader({ text = "Loading..." }: { text?: string }) {
  return <div className="flex min-h-[220px] items-center justify-center text-slate-400">{text}</div>;
}
