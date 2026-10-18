import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const StatCard = ({ label, value, accent }) => (
  <div className={`card-hand text-center ${accent || ''}`}>
    <div className="font-heading text-4xl font-bold">{value}</div>
    <div className="text-pencil-light">{label}</div>
  </div>
);

export default function Dashboard() {
  const [dash, setDash] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/recruiter/dashboard'), api.get('/recruiter/analytics')])
      .then(([d, a]) => {
        setDash(d.data.data);
        setAnalytics(a.data.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <p className="text-marker-red font-bold">{error}</p>;
  if (!dash) return <p className="text-pencil-faint">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total drives" value={dash.drives.total} />
        <StatCard label="Active drives" value={dash.drives.active} accent="bg-highlighter-green" />
        <StatCard label="Applications" value={dash.applications.total} accent="bg-highlighter-yellow" />
        <StatCard label="Eligible students" value={analytics?.totals.eligibleStudents ?? '—'} accent="bg-highlighter-purple" />
      </div>

      <div className="card-hand">
        <h2 className="font-heading text-xl font-bold mb-3">Applications by status</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(dash.applications.byStatus).map(([status, count]) => (
            <span key={status} className="badge-hand bg-postit">{status}: {count}</span>
          ))}
          {Object.keys(dash.applications.byStatus).length === 0 && (
            <span className="text-pencil-faint">No applications yet.</span>
          )}
        </div>
      </div>

      <div className="card-hand">
        <h2 className="font-heading text-xl font-bold mb-3">Your drives — applicant counts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-3 border-pencil font-heading">
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Applicants</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.drives || []).map((d) => (
                <tr key={d.id} className="border-b border-erased">
                  <td className="py-2 pr-4">
                    <Link className="underline text-pen-blue" to={`/drives/${d.id}`}>{d.jobRole}</Link>
                  </td>
                  <td className="py-2 pr-4"><span className="badge-hand bg-highlighter-green">{d.status}</span></td>
                  <td className="py-2 pr-4 font-bold">{d.applicants}</td>
                </tr>
              ))}
              {(analytics?.drives || []).length === 0 && (
                <tr><td colSpan={3} className="py-3 text-pencil-faint">No drives yet — create one from the Drives page.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-hand">
        <h2 className="font-heading text-xl font-bold mb-3">Recent applications</h2>
        <ul className="space-y-2">
          {dash.recentApplications.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 border-2 border-erased rounded-wobbly-sm px-3 py-2">
              <span className="font-bold">{a.student?.name || 'Unknown student'}</span>
              <span className="text-pencil-faint">→ {a.drive?.jobRole}</span>
              <span className="badge-hand bg-postit ml-auto">{a.status}</span>
            </li>
          ))}
          {dash.recentApplications.length === 0 && (
            <li className="text-pencil-faint">No applications yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
