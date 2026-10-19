import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const APP_STATUS = ['Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected', 'Waitlisted'];
const DRIVE_STATUS = ['active', 'closed', 'draft', 'cancelled'];

export default function DriveDetail() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [openingResume, setOpeningResume] = useState({});

  const load = () => {
    api.get(`/recruiter/drives/${id}`)
      .then((r) => setDrive(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Drive not found'));
    api.get(`/recruiter/drives/${id}/applicants`)
      .then((r) => setApps(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load applicants'));
  };
  useEffect(() => { load(); }, [id]);

  const setDriveStatus = async (status) => {
    setMsg('');
    try {
      await api.patch(`/recruiter/drives/${id}/status`, { status });
      setMsg('Drive status updated.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update drive status');
    }
  };

  const setAppStatus = async (appId, status) => {
    setMsg('');
    try {
      await api.patch(`/recruiter/applications/${appId}/status`, { status });
      setMsg('Application status updated.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update application');
    }
  };

  const viewResume = async (studentId, studentName) => {
    setOpeningResume((p) => ({ ...p, [studentId]: true }));
    try {
      const res = await api.get(`/recruiter/students/${studentId}/resume`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert(err.response?.data?.message || `Resume not available for ${studentName || 'this student'}.`);
    } finally {
      setOpeningResume((p) => ({ ...p, [studentId]: false }));
    }
  };

  if (error) return (
    <div>
      <p className="text-marker-red font-bold mb-3">{error}</p>
      <Link to="/drives" className="underline text-pen-blue">← Back to drives</Link>
    </div>
  );
  if (!drive || !apps) return <p className="text-pencil-faint">Loading…</p>;

  const isInternship = drive.driveType === 'internship';

  return (
    <div className="space-y-5">
      <Link to="/drives" className="underline text-pen-blue">← Back to drives</Link>

      <div className="card-hand flex flex-wrap items-center gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="font-heading text-3xl font-bold">{drive.jobRole}</h1>
            <span className={`badge-hand ${isInternship ? 'bg-highlighter-blue text-pencil' : 'bg-highlighter-yellow text-pencil'}`}>
              {isInternship ? '💼 Internship Drive' : '🎯 Placement Drive'}
            </span>
          </div>
          <p className="text-pencil-light">
            {drive.package} · {drive.location} · deadline {drive.applicationDeadline || '—'}
          </p>
          <p className="text-sm text-pencil-faint">
            Min CGPA {Number(drive.minCGPA)} · Max backlogs {drive.maxBacklogs} · Batch {drive.graduationYear || '—'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(drive.eligibleBranches || []).map((b) => (
              <span key={b} className="badge-hand bg-highlighter-yellow">{b}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <label className="block font-bold mb-1" htmlFor="dstatus">Drive status</label>
          <select id="dstatus" className="input-hand" value={drive.status || 'active'} onChange={(e) => setDriveStatus(e.target.value)}>
            {DRIVE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {msg && <p className="text-pen-blue font-bold">{msg}</p>}

      <div className="card-hand">
        <h2 className="font-heading text-xl font-bold mb-3">Applicants ({apps.length})</h2>
        {apps.length === 0 ? (
          <p className="text-pencil-faint">No applications yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-3 border-pencil font-heading">
                <th className="py-2 pr-3">Student</th>
                <th className="py-2 pr-3">Branch</th>
                <th className="py-2 pr-3">CGPA</th>
                <th className="py-2 pr-3">Reg. no</th>
                <th className="py-2 pr-3">Resume</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-erased hover:bg-paper-dark">
                  <td className="py-2 pr-3">
                    <div className="font-bold">{a.student?.name || 'Unknown'}</div>
                    <div className="text-sm text-pencil-faint">{a.student?.email}</div>
                  </td>
                  <td className="py-2 pr-3">{a.student?.branch || '—'}</td>
                  <td className="py-2 pr-3 font-bold">{a.student?.cgpa ?? '—'}</td>
                  <td className="py-2 pr-3">{a.student?.registrationNumber || '—'}</td>
                  <td className="py-2 pr-3">
                    {a.student?.hasResume || a.student?.resumeDownloadUrl || a.student?.resumeUrl ? (
                      <button
                        type="button"
                        onClick={() => viewResume(a.student.id, a.student.name)}
                        disabled={openingResume[a.student.id]}
                        className="btn-hand bg-postit text-xs py-1 px-2.5 inline-flex items-center gap-1 font-bold text-pencil hover:bg-highlighter-yellow shadow-hand-xs"
                      >
                        {openingResume[a.student.id] ? 'Loading…' : '📄 View Resume'}
                      </button>
                    ) : (
                      <span className="text-xs text-pencil-faint italic">No resume</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <select className="input-hand py-1" value={a.status || 'Applied'}
                      onChange={(e) => setAppStatus(a.id, e.target.value)}>
                      {APP_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
