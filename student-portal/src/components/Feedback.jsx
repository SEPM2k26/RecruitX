import { AlertCircle, LoaderCircle } from 'lucide-react';

export function Loading({ label = 'Loading…' }) {
  return <div className="flex items-center gap-2 py-12 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" />{label}</div>;
}
export function ErrorNotice({ message, onRetry }) {
  return <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span className="flex items-center gap-2"><AlertCircle size={17} />{message}</span>{onRetry && <button className="font-bold underline" onClick={onRetry}>Try again</button>}</div>;
}
export function EmptyState({ title, detail }) {
  return <div className="rounded-2xl border border-dashed border-line bg-white/70 p-10 text-center"><p className="font-bold text-ink">{title}</p><p className="mt-1 text-sm text-muted">{detail}</p></div>;
}
