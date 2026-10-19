import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays, Check, Clock3, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { asList, driveApi } from '../api/student.js';
import { errorMessage } from '../api/client.js';
import { EmptyState, ErrorNotice, Loading } from '../components/Feedback.jsx';
import { Eligibility, PageHeading, Pill } from '../components/UI.jsx';

export default function DrivesPage() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [checks, setChecks] = useState({});
  const [busy, setBusy] = useState({});
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await driveApi.list({ status: 'active' });
      setDrives(asList(data));
    } catch (err) {
      setError(errorMessage(err, 'Could not load drives.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => drives.filter((d) => {
    const text = `${d.jobRole || d.title || ''} ${d.company?.name || d.companyName || ''} ${d.location || ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesBranch = !branch || !Array.isArray(d.eligibleBranches) || d.eligibleBranches.includes(branch);
    const matchesType = !typeFilter || (d.driveType || 'placement') === typeFilter;
    return matchesSearch && matchesBranch && matchesType;
  }), [drives, search, branch, typeFilter]);

  const check = async (id) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setMessage('');
    try {
      const result = await driveApi.eligibility(id);
      setChecks((c) => ({ ...c, [id]: result }));
    } catch (err) {
      setMessage(errorMessage(err, 'Could not check eligibility.'));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const apply = async (id) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setMessage('');
    try {
      await driveApi.apply(id);
      setMessage('Application submitted. You can track it in My applications.');
      setChecks((c) => ({ ...c, [id]: { ...c[id], applied: true } }));
    } catch (err) {
      setMessage(errorMessage(err, 'Could not submit your application.'));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  return (
    <div>
      <PageHeading
        eyebrow="Find your fit"
        title="Campus Drives & Internships"
        description="Explore open placements and internship roles. Keep your profile 100% complete to stay eligible."
        action={<div className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-bold text-brand">{drives.length} open {drives.length === 1 ? 'drive' : 'drives'}</div>}
      />
      {message && <div role="status" className="mb-5 rounded-xl bg-[#edf5ee] p-3 text-sm text-brand-dark">{message}</div>}
      {error && <div className="mb-5"><ErrorNotice message={error} onRetry={load} /></div>}

      <div className="mb-5 space-y-3">
        {/* Drive type filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Opportunities', val: '' },
            { label: '🎯 Placements', val: 'placement' },
            { label: '💼 Internships', val: 'internship' },
          ].map((t) => (
            <button
              key={t.val || 'all'}
              type="button"
              onClick={() => setTypeFilter(t.val)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                typeFilter === t.val
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-paper text-muted hover:bg-brand-soft hover:text-brand'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_210px]">
          <label className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field pl-10"
              placeholder="Search role, company, or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="field" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All eligible branches</option>
            {['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil'].map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <Loading label="Finding open drives…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || branch || typeFilter ? 'No matching drives' : 'No open drives right now'}
          detail={search || branch || typeFilter ? 'Try another keyword or filter.' : 'New opportunities will appear here when they open.'}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((drive) => (
            <DriveCard
              key={drive.id}
              drive={drive}
              result={checks[drive.id]}
              busy={Boolean(busy[drive.id])}
              onCheck={() => check(drive.id)}
              onApply={() => apply(drive.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DriveCard({ drive, result, busy, onCheck, onApply }) {
  const company = drive.company?.name || drive.companyName || 'Company';
  const deadline = drive.applicationDeadline || drive.deadline;
  const isInternship = drive.driveType === 'internship';
  const eligible = result?.eligible === true;
  const failed = result?.checks
    ? Object.entries(result.checks)
        .filter(([, passed]) => !passed)
        .map(([key]) => ({
          profileCompletion: `Profile is only ${result.profileCompletion || 0}% complete. Complete all fields and upload resume to reach 100%.`,
          cgpa: 'Your CGPA is below the minimum',
          backlogs: 'Your backlog count is above the limit',
          branch: 'Your branch is not listed',
          graduationYear: 'Graduation year does not match',
        }[key] || `${key} requirement not met`))
    : [];

  return (
    <article className="card p-5 transition hover:-translate-y-0.5 hover:shadow-card md:p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Building2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="truncate text-base font-extrabold">{drive.jobRole || drive.title || 'Placement role'}</h2>
            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${isInternship ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-800'}`}>
              {isInternship ? 'Internship' : 'Placement'}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{company}</p>
        </div>
        <Pill tone="green">{drive.package || drive.salary || 'Opportunity'}</Pill>
      </div>

      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-[#66736b]">
        {drive.description || `Explore this ${drive.jobRole || 'role'} opportunity at ${company}.`}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-line py-3 text-[11px] font-semibold text-muted">
        <span className="inline-flex items-center gap-1"><MapPin size={13} />{drive.location || 'Location not listed'}</span>
        <span className="inline-flex items-center gap-1"><CalendarDays size={13} />Graduating {drive.graduationYear || 'any year'}</span>
        {deadline && <span className="inline-flex items-center gap-1"><Clock3 size={13} />Apply by {new Date(deadline).toLocaleDateString()}</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(drive.eligibleBranches || []).map((item) => (
          <span key={item} className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold text-muted">{item}</span>
        ))}
        {drive.minCGPA !== undefined && (
          <span className="rounded-md bg-paper px-2 py-1 text-[10px] font-bold text-muted">Min CGPA {drive.minCGPA}</span>
        )}
      </div>

      {result && (
        <div className={`mt-4 rounded-xl p-3 text-xs ${eligible ? 'bg-[#edf5ee] text-brand-dark' : 'bg-[#fbf2e8] text-[#936727]'}`}>
          <div className="flex items-center gap-1.5 font-bold">
            <Eligibility result={result} />
          </div>
          {failed.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-0.5">
              {failed.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {!eligible && result?.checks?.profileCompletion === false && (
            <div className="mt-2 pt-2 border-t border-[#e2d5c3]">
              <Link to="/profile" className="font-bold underline text-brand">Complete your profile now →</Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        <Link className="inline-flex items-center gap-1 text-xs font-bold text-brand" to={`/drives/${drive.id}`}>
          View details <ArrowUpRight size={14} />
        </Link>
        <div className="flex gap-2">
          <button className="btn btn-secondary py-2 text-xs" disabled={busy} onClick={onCheck}>
            {busy ? 'Checking…' : 'Check eligibility'}
          </button>
          <button
            className="btn btn-primary py-2 text-xs"
            disabled={busy || result?.applied || result?.eligible === false}
            onClick={onApply}
          >
            {result?.applied ? <><Check size={14} />Applied</> : busy ? 'Please wait' : 'Apply now'}
          </button>
        </div>
      </div>
    </article>
  );
}
