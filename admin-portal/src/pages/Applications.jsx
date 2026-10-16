import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const STATUSES = ['Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected'];

export default function Applications() {
  const { success, error } = useNotification();
  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', driveId: '' });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      const [appsRes, drivesRes] = await Promise.all([
        api.get('/admin/applications', { params: filters }),
        api.get('/admin/drives'),
      ]);
      setApplications(appsRes.data.data);
      setDrives(drivesRes.data.data);
    } catch { error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (appId, status) => {
    try {
      await api.patch(`/admin/applications/${appId}/status`, { status });
      success(`Status updated to ${status}`);
      loadData();
    } catch { error('Update failed'); }
  };

  const statusBadge = {
    Applied: 'badge-muted', Shortlisted: 'badge-info', Aptitude: 'badge-warning',
    'Technical Interview': 'badge-primary', 'HR Interview': 'badge-info',
    Selected: 'badge-success', Rejected: 'badge-error',
  };

  const nextStatus = {
    Applied: 'Shortlisted',
    Shortlisted: 'Aptitude',
    Aptitude: 'Technical Interview',
    'Technical Interview': 'HR Interview',
    'HR Interview': 'Selected',
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Applications</h1>
        <p className="page-subtitle">{applications.length} total applications</p>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <select
          id="app-status-filter"
          className="form-select"
          style={{ width: 180 }}
          value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          id="app-drive-filter"
          className="form-select"
          style={{ width: 220 }}
          value={filters.driveId}
          onChange={e => setFilters({...filters, driveId: e.target.value})}
        >
          <option value="">All Drives</option>
          {drives.map(d => <option key={d.id} value={d.id}>{d.jobRole} — {d.company?.name}</option>)}
        </select>
        {(filters.status || filters.driveId) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', driveId: '' })}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Pipeline summary */}
      <div className="pipeline" style={{ marginBottom: 24 }}>
        {STATUSES.slice(0, -1).map((s, i, arr) => (
          <div key={s} className="pipeline-step">
            <div
              className={`pipeline-node ${filters.status === s ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilters(f => ({...f, status: f.status === s ? '' : s}))}
            >
              {s} ({applications.filter(a => a.status === s).length})
            </div>
            {i < arr.length - 1 && <span className="pipeline-arrow">→</span>}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th><th>Drive</th><th>Company</th><th>Branch</th>
                <th>CGPA</th><th>Status</th><th>Applied</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state"><p>No applications found</p></div>
                </td></tr>
              ) : applications.map((app) => (
                <tr key={app.applicationId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar">{app.student?.name?.charAt(0)}</div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 13 }}>{app.student?.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.student?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{app.drive?.jobRole}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{app.drive?.companyId}</td>
                  <td><span className="badge badge-primary">{app.student?.branch}</span></td>
                  <td style={{ fontWeight: 600, color: (app.student?.cgpa || 0) >= 8 ? 'var(--success)' : 'var(--warning)' }}>
                    {app.student?.cgpa}
                  </td>
                  <td><span className={`badge ${statusBadge[app.status] || 'badge-muted'}`}>{app.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {nextStatus[app.status] && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateStatus(app.applicationId, nextStatus[app.status])}
                        >
                          → {nextStatus[app.status]}
                        </button>
                      )}
                      {!['Rejected', 'Selected'].includes(app.status) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => updateStatus(app.applicationId, 'Rejected')}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
