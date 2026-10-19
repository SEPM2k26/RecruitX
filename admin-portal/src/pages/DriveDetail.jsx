import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, ChevronRight, Calendar, X } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const STAGES = ['Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected'];

export default function DriveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [drive, setDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [interviewModal, setInterviewModal] = useState({ open: false, studentId: null, appId: null });
  const [intForm, setIntForm] = useState({ round: 'Technical Interview', scheduledAt: '', mode: 'online', meetingLink: '' });

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [driveRes, appsRes] = await Promise.all([
        api.get(`/admin/drives/${id}`),
        api.get('/admin/applications', { params: { driveId: id } }),
      ]);
      setDrive(driveRes.data.data);
      setApplications(appsRes.data.data);
    } catch { error('Failed to load drive'); navigate('/drives'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (appId, status) => {
    try {
      await api.patch(`/admin/applications/${appId}/status`, { status });
      success(`Status updated to ${status}`);
      loadData();
    } catch { error('Update failed'); }
  };

  const scheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/interviews', {
        studentId: interviewModal.studentId,
        driveId: id,
        applicationId: interviewModal.appId,
        ...intForm,
      });
      success('Interview scheduled');
      setInterviewModal({ open: false, studentId: null, appId: null });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to schedule');
    }
  };

  const statusBadge = {
    Applied: 'badge-muted', Shortlisted: 'badge-info', Aptitude: 'badge-warning',
    'Technical Interview': 'badge-primary', 'HR Interview': 'badge-info',
    Selected: 'badge-success', Rejected: 'badge-error',
  };

  const filtered = statusFilter ? applications.filter(a => a.status === statusFilter) : applications;

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;
  if (!drive) return null;

  const statusCounts = STAGES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate('/drives')}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{drive.jobRole}</h1>
            <span className={`badge ${drive.driveType === 'internship' ? 'badge-info' : 'badge-primary'}`}>
              {drive.driveType === 'internship' ? 'Internship Drive' : 'Placement Drive'}
            </span>
          </div>
          <p className="page-subtitle">{drive.company?.name} • {drive.location} • {drive.package}</p>
        </div>
        <span className={`badge ${drive.status === 'active' ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
          {drive.status}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Applied', value: applications.length, color: '#6366f1' },
          { label: 'Shortlisted', value: statusCounts.Shortlisted || 0, color: '#06b6d4' },
          { label: 'In Interview', value: (statusCounts['Technical Interview'] || 0) + (statusCounts['HR Interview'] || 0), color: '#8b5cf6' },
          { label: 'Selected', value: statusCounts.Selected || 0, color: '#10b981' },
          { label: 'Rejected', value: statusCounts.Rejected || 0, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stage Pipeline */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Application Pipeline</div>
        <div className="pipeline">
          {STAGES.slice(0, -1).map((s, i, arr) => (
            <div key={s} className="pipeline-step">
              <div
                className={`pipeline-node ${statusFilter === s ? 'active' : statusCounts[s] > 0 ? 'done' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              >
                {s} <span style={{ opacity: 0.7 }}>({statusCounts[s] || 0})</span>
              </div>
              {i < arr.length - 1 && <span className="pipeline-arrow">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>
            Applicants {statusFilter && `— ${statusFilter}`} ({filtered.length})
          </div>
          {statusFilter && (
            <button className="btn btn-secondary btn-sm" onClick={() => setStatusFilter('')}>
              Clear Filter
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <p>No applicants in this stage</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th><th>Branch</th><th>CGPA</th><th>Status</th>
                  <th>Applied</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, idx) => {
                  const appId = app.id || app.applicationId;
                  return (
                    <tr key={appId || idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">{app.student?.name?.charAt(0)}</div>
                          <div>
                            <p style={{ fontWeight: 500 }}>{app.student?.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{app.student?.branch}</span></td>
                      <td><strong style={{ color: app.student?.cgpa >= 8 ? 'var(--success)' : 'var(--warning)' }}>{app.student?.cgpa}</strong></td>
                      <td><span className={`badge ${statusBadge[app.status] || 'badge-muted'}`}>{app.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {app.status === 'Applied' && (
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(appId, 'Shortlisted')}>
                              Shortlist
                            </button>
                          )}
                          {['Shortlisted', 'Aptitude'].includes(app.status) && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setInterviewModal({ open: true, studentId: app.student?.id, appId })}
                            >
                              <Calendar size={13} /> Schedule
                            </button>
                          )}
                          {!['Rejected', 'Selected'].includes(app.status) && (
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(appId, 'Rejected')}>
                              Reject
                            </button>
                          )}
                          {app.status === 'HR Interview' && (
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(appId, 'Selected')}>
                              Select ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interview Modal */}
      {interviewModal.open && (
        <div className="modal-overlay" onClick={() => setInterviewModal({ open: false, studentId: null, appId: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Schedule Interview</h2>
              <button className="modal-close" onClick={() => setInterviewModal({ open: false, studentId: null, appId: null })}><X size={16} /></button>
            </div>
            <form onSubmit={scheduleInterview}>
              <div className="form-group">
                <label className="form-label">Round *</label>
                <select id="int-round" className="form-select" value={intForm.round} onChange={e => setIntForm({...intForm, round: e.target.value})}>
                  <option>Aptitude</option>
                  <option>Technical Interview</option>
                  <option>HR Interview</option>
                  <option>Group Discussion</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time *</label>
                <input id="int-datetime" type="datetime-local" className="form-input" required value={intForm.scheduledAt} onChange={e => setIntForm({...intForm, scheduledAt: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Mode *</label>
                <select id="int-mode" className="form-select" value={intForm.mode} onChange={e => setIntForm({...intForm, mode: e.target.value})}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              {intForm.mode === 'online' && (
                <div className="form-group">
                  <label className="form-label">Meeting Link</label>
                  <input id="int-link" type="url" className="form-input" placeholder="https://meet.google.com/..." value={intForm.meetingLink} onChange={e => setIntForm({...intForm, meetingLink: e.target.value})} />
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setInterviewModal({ open: false, studentId: null, appId: null })}>Cancel</button>
                <button id="int-submit" type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
