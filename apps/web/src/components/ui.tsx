import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-premium backdrop-blur ${className}`}>{children}</div>;
}

export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`min-h-11 rounded-2xl px-4 py-3 font-medium transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props}>{children}</button>;
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-base outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:text-sm ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-base outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:text-sm ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`min-h-11 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-base outline-none transition focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:text-sm ${className}`} {...props} />;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 ${className}`}>{children}</span>;
}

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-sky-300">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
      {subtitle ? <p className="max-w-3xl text-sm text-slate-300 sm:text-base">{subtitle}</p> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <SectionTitle eyebrow={eyebrow} title={title} subtitle={subtitle} />
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
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

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <Card className="p-6 text-center"><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{description}</p>{action ? <div className="mt-5 flex justify-center">{action}</div> : null}</Card>;
}

export function ErrorMessage({ id, children }: { id?: string; children: ReactNode }) {
  return <p id={id} role="alert" className="text-sm font-medium text-rose-300">{children}</p>;
}

export function FormField({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">{label}</label>
      {hint ? <p id={`${id}-hint`} className="text-xs text-slate-400">{hint}</p> : null}
      {children}
      {error ? <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage> : null}
    </div>
  );
}

export function AccessibleCardAction({ to, children, className = "", ...props }: LinkProps & { children: ReactNode; className?: string }) {
  return <Link to={to} className={`block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${className}`} {...props}>{children}</Link>;
}

export function LoadingRegion({ text = "Loading..." }: { text?: string }) {
  return <div role="status" aria-live="polite" className="flex min-h-[220px] items-center justify-center text-slate-400">{text}</div>;
}

export function ErrorState({
  title,
  description,
  actionLabel = 'Try again',
  onAction
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 text-lg text-rose-200" aria-hidden="true">
        !
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      {onAction ? <Button className="mt-5 bg-sky-400 text-slate-950" onClick={onAction}>{actionLabel}</Button> : null}
    </Card>
  );
}

export function Loader({ text = "Loading..." }: { text?: string }) {
  return <LoadingRegion text={text} />;
}
