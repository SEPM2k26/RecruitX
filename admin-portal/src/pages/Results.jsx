import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#ff4d4d', '#2d5da1', '#10b981', '#f59e0b', '#8b5cf6', '#2d2d2d'];
const FINAL = ['Selected', 'Rejected', 'Waitlisted'];

export default function Results() {
  const { success, error } = useNotification();
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      const [resultsRes, summaryRes] = await Promise.all([
        api.get('/admin/results', { params: statusFilter ? { status: statusFilter } : {} }),
        api.get('/admin/results/summary'),
      ]);
      setResults(resultsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch { error('Failed to load results'); }
    finally { setLoading(false); }
  };

  const setFinalResult = async (applicationId, status) => {
    try {
      await api.patch(`/admin/results/${applicationId}`, { status });
      success(`Marked as ${status}`);
      loadData();
    } catch { error('Update failed'); }
  };

  const statusBadge = {
    Applied: 'badge-muted', Shortlisted: 'badge-info', Aptitude: 'badge-warning',
    'Technical Interview': 'badge-primary', 'HR Interview': 'badge-info',
    Selected: 'badge-success', Rejected: 'badge-error', Waitlisted: 'badge-warning',
  };

  const byStatusData = summary?.byStatus ? Object.entries(summary.byStatus).map(([name, value]) => ({ name, value })) : [];
  const branchData = summary?.selectedByBranch ? Object.entries(summary.selectedByBranch).map(([name, value]) => ({ name, value })) : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Results & Analytics</h1>
        <p className="page-subtitle">Placement outcome tracking</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ '--stat-color': '#6366f1' }}>
            <div className="stat-icon" style={{ background: '#6366f122' }}><Users size={22} color="#6366f1" /></div>
            <div className="stat-info">
              <div className="stat-value">{summary.totalApplications}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--stat-color': '#10b981' }}>
            <div className="stat-icon" style={{ background: '#10b98122' }}><Trophy size={22} color="#10b981" /></div>
            <div className="stat-info">
              <div className="stat-value">{summary.byStatus?.Selected || 0}</div>
              <div className="stat-label">Students Selected</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--stat-color': '#f59e0b' }}>
            <div className="stat-icon" style={{ background: '#f59e0b22' }}><TrendingUp size={22} color="#f59e0b" /></div>
            <div className="stat-info">
              <div className="stat-value">{summary.selectionRate}</div>
              <div className="stat-label">Selection Rate</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--stat-color': '#ef4444' }}>
            <div className="stat-icon" style={{ background: '#ef444422' }}><Users size={22} color="#ef4444" /></div>
            <div className="stat-info">
              <div className="stat-value">{summary.byStatus?.Rejected || 0}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Applications by Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Selected by Branch</div>
          {branchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={branchData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                  {branchData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '30px 0' }}><p>No selections yet</p></div>}
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>All Results ({results.length})</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'Selected', 'Rejected', 'Waitlisted', 'Shortlisted'].map(s => (
              <button
                key={s || 'all'}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Student</th><th>Drive</th><th>Package</th><th>Status</th><th>Interviews</th><th>Final Decision</th></tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><p>No results found</p></div></td></tr>
                ) : results.map((r) => (
                  <tr key={r.applicationId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar">{r.student?.name?.charAt(0)}</div>
                        <div>
                          <p style={{ fontWeight: 500, fontSize: 13 }}>{r.student?.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.student?.branch} • CGPA {r.student?.cgpa}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.drive?.jobRole}</td>
                    <td><span className="badge badge-success">{r.drive?.package}</span></td>
                    <td><span className={`badge ${statusBadge[r.status] || 'badge-muted'}`}>{r.status}</span></td>
                    <td>
                      <span className="badge badge-muted">{r.interviews?.length || 0} rounds</span>
                    </td>
                    <td>
                      {['Selected', 'Rejected', 'Waitlisted'].includes(r.status) ? (
                        <span className={`badge ${statusBadge[r.status]}`}>{r.status}</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => setFinalResult(r.applicationId, 'Selected')}>Select</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setFinalResult(r.applicationId, 'Waitlisted')}>Waitlist</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setFinalResult(r.applicationId, 'Rejected')}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
