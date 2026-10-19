import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, Check, Clock3, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { driveApi } from '../api/student.js';
import { errorMessage } from '../api/client.js';
import { Loading, ErrorNotice } from '../components/Feedback.jsx';
import { Eligibility, PageHeading, Pill } from '../components/UI.jsx';

export default function DriveDetailPage() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await driveApi.get(id);
      setDrive(data?.drive || data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load this drive.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const check = async () => {
    setBusy(true);
    setNotice('');
    try {
      setEligibility(await driveApi.eligibility(id));
    } catch (err) {
      setNotice(errorMessage(err, 'Could not check eligibility.'));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    setNotice('');
    try {
      await driveApi.apply(id);
      setNotice('Application submitted. Track your progress in My applications.');
    } catch (err) {
      setNotice(errorMessage(err, 'Could not apply.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading label="Loading opportunity…" />;
  if (error) return (
    <div>
      <Link to="/drives" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brand">
        <ArrowLeft size={16} /> All drives
      </Link>
      <ErrorNotice message={error} onRetry={load} />
    </div>
  );
  if (!drive) return null;

  const company = drive.company?.name || drive.companyName || 'Company';
  const isInternship = drive.driveType === 'internship';

  const checkLabels = {
    profileCompletion: `Profile 100% complete (${eligibility?.profileCompletion ?? 0}%)`,
    cgpa: 'Minimum CGPA met',
    backlogs: 'Backlog limit met',
    branch: 'Branch eligible',
    graduationYear: 'Graduation year matched',
  };

  return (
    <div>
      <Link to="/drives" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-brand">
        <ArrowLeft size={15} /> Back to drives
      </Link>

      <PageHeading
        eyebrow={isInternship ? 'Internship Opportunity' : 'Placement Opportunity'}
        title={drive.jobRole || drive.title || 'Role'}
        description={company}
        action={
          <div className="flex gap-2">
            <Pill tone={isInternship ? 'blue' : 'green'}>{isInternship ? 'Internship' : 'Placement'}</Pill>
            <Pill tone="green">{drive.status || 'Open'}</Pill>
          </div>
        }
      />

      {notice && <div role="status" className="mb-5 rounded-xl bg-[#edf5ee] p-3 text-sm text-brand-dark">{notice}</div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="card p-5 md:p-7">
          <div className="flex flex-wrap gap-3">
            {[
              [Building2, company],
              [MapPin, drive.location || 'Location not listed'],
              [CalendarDays, drive.package || drive.salary || 'Compensation details pending'],
            ].map(([Icon, value]) => (
              <span key={value} className="inline-flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-xs font-semibold text-muted">
                <Icon size={14} />{value}
              </span>
            ))}
          </div>

          <h2 className="mt-8 font-extrabold">About this opportunity</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#66736b]">
            {drive.description || 'The company has not added a role description yet.'}
          </p>

          <div className="mt-8 border-t border-line pt-6">
            <h2 className="font-extrabold">Eligibility criteria</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Type', isInternship ? 'Internship' : 'Full-Time Placement'],
                ['Eligible branches', (drive.eligibleBranches || []).join(', ') || 'Not specified'],
                ['Minimum CGPA', drive.minCGPA ?? 'Not specified'],
                ['Maximum backlogs', drive.maxBacklogs ?? 'Not specified'],
                ['Graduation year', drive.graduationYear ?? 'Not specified'],
                ['Profile Requirement', '100% completed profile (with uploaded resume)'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-paper p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
                  <p className="mt-1 text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="font-extrabold">Your application</h2>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted">
              <Clock3 size={14} />Deadline: {drive.applicationDeadline ? new Date(drive.applicationDeadline).toLocaleDateString() : 'Not specified'}
            </p>

            {eligibility && (
              <div className="mt-4 rounded-xl bg-paper p-3">
                <Eligibility result={eligibility} />
                {eligibility.checks && (
                  <ul className="mt-2 space-y-1 text-[11px] text-muted">
                    {Object.entries(eligibility.checks).map(([key, passed]) => (
                      <li key={key} className="flex items-center gap-1.5">
                        <span className={passed ? 'text-brand' : 'text-[#b56a4e]'}>{passed ? '✓' : '×'}</span>
                        <span>{checkLabels[key] || key}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {eligibility.checks?.profileCompletion === false && (
                  <div className="mt-3 pt-2 border-t border-line">
                    <p className="text-xs text-[#b56a4e] font-semibold">Your profile must be 100% complete before applying.</p>
                    <Link to="/profile" className="mt-1 inline-block text-xs font-bold text-brand underline">Complete profile & resume →</Link>
                  </div>
                )}
              </div>
            )}

            <button className="btn btn-secondary mt-4 w-full" disabled={busy} onClick={check}>
              {busy ? 'Checking…' : 'Check my eligibility'}
            </button>
            <button
              className="btn btn-primary mt-2 w-full"
              disabled={busy || eligibility?.eligible === false}
              onClick={apply}
            >
              {eligibility?.eligible === true && <Check size={15} />}Apply for this drive
            </button>
            <p className="mt-3 text-center text-[10px] leading-4 text-muted">Your eligibility and 100% profile completion are verified upon submission.</p>
          </section>

          <div className="rounded-2xl bg-[#eaf3eb] p-5">
            <p className="text-sm font-bold text-brand-dark">Need to update your profile?</p>
            <p className="mt-1 text-xs leading-5 text-brand-dark/70">Eligibility requires 100% completion including resume and academic details.</p>
            <Link className="mt-3 inline-block text-xs font-bold text-brand" to="/profile">Review profile →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
