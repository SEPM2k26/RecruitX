import { ArrowRight, Check, CircleHelp } from 'lucide-react';

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-brand">{eyebrow}</p><h1 className="page-title text-2xl font-extrabold text-ink md:text-[30px]">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}</div>{action}</div>;
}
export function Pill({ children, tone = 'gray' }) {
  const style = { green: 'bg-highlighter-green text-[#166534]', yellow: 'bg-postit text-[#854d0e]', red: 'bg-[#fee2e2] text-[#991b1b]', blue: 'bg-[#dbeafe] text-[#2d5da1]', gray: 'bg-erased text-[#525252]' }[tone] || 'bg-erased text-[#525252]';
  return <span className={`stamped-pill inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${style}`}>{children}</span>;
}
export function StatCard({ label, value, hint, icon: Icon, tint = 'green' }) {
  const colors = { green: 'bg-[#eaf3eb] text-brand', yellow: 'bg-[#f9f1da] text-[#a27922]', blue: 'bg-[#eaf0f7] text-[#5c78a0]', coral: 'bg-[#f9eae3] text-[#c46d49]' };
  return <div className="card p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-3 text-[30px] font-extrabold leading-none tracking-tight text-ink">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tint]}`}><Icon size={18} /></span></div>{hint && <p className="mt-3 text-[11px] text-muted">{hint}</p>}</div>;
}
export function PanelTitle({ title, action }) { return <div className="mb-4 flex items-center justify-between"><h2 className="text-[15px] font-extrabold text-ink">{title}</h2>{action}</div>; }
export function LinkButton({ to, children }) { return <a className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark" href={to}>{children}<ArrowRight size={14} /></a>; }
export function Progress({ value = 0 }) { return <div className="h-2 overflow-hidden rounded-full bg-[#edf0ec]"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>; }
export function Eligibility({ result }) {
  if (!result) return <span className="inline-flex items-center gap-1 text-xs text-muted"><CircleHelp size={13} />Check eligibility</span>;
  if (typeof result.eligible === 'boolean') return <Pill tone={result.eligible ? 'green' : 'red'}>{result.eligible ? <><Check size={12} className="mr-1" />Eligible</> : 'Not eligible'}</Pill>;
  return <Pill tone="yellow">Eligibility checked</Pill>;
}
