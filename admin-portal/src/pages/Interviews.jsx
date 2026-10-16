import { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, X, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const ROUNDS = ['Aptitude', 'Technical Interview', 'HR Interview', 'Group Discussion'];

const emptyForm = { studentId: '', driveId: '', round: 'Technical Interview', scheduledAt: '', mode: 'online', meetingLink: '' };

export default function Interviews() {
  const { success, error } = useNotification();
  const [interviews, setInterviews] = useState([]);
  const [students, setStudents] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [resultModal, setResultModal] = useState({ open: false, interview: null });
  const [form, setForm] = useState(emptyForm);
  const [resultForm, setResultForm] = useState({ result: 'passed', feedback: '' });
  const [filters, setFilters] = useState({ round: '', status: '' });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      const [intvRes, stuRes, drvRes] = await Promise.all([
        api.get('/admin/interviews', { params: filters }),
        api.get('/admin/students'),
        api.get('/admin/drives'),
      ]);
      setInterviews(intvRes.data.data);
      setStudents(stuRes.data.data);
      setDrives(drvRes.data.data);
    } catch { error('Failed to load interviews'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/interviews', form);
      success('Interview scheduled');
      setCreateModal(false);
      setForm(emptyForm);
      loadData();
    } catch (err) { error(err.response?.data?.message || 'Failed'); }
  };

  const handleResult = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/interviews/${resultModal.interview.id}/result`, resultForm);
      success('Result updated');
      setResultModal({ open: false, interview: null });
      loadData();
    } catch { error('Failed to update result'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await api.delete(`/admin/interviews/${id}`);
      success('Interview deleted');
      loadData();
    } catch { error('Delete failed'); }
  };

  const statusColor = { scheduled: 'badge-warning', completed: 'badge-success', cancelled: 'badge-error' };
  const resultColor = { passed: 'badge-success', failed: 'badge-error', pending: 'badge-muted' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="page-subtitle">{interviews.length} interviews scheduled</p>
        </div>
        <button id="add-interview-btn" className="btn btn-primary" onClick={() => setCreateModal(true)}>
          <Plus size={16} /> Schedule Interview
        </button>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <select id="int-round-filter" className="form-select" style={{ width: 200 }} value={filters.round} onChange={e => setFilters({...filters, round: e.target.value})}>
          <option value="">All Rounds</option>
          {ROUNDS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select id="int-status-filter" className="form-select" style={{ width: 160 }} value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Student</th><th>Drive</th><th>Round</th><th>Scheduled</th><th>Mode</th><th>Status</th><th>Result</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><p>No interviews found</p></div></td></tr>
              ) : interviews.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar">{i.student?.name?.charAt(0)}</div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 13 }}>{i.student?.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.student?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{i.drive?.jobRole}</td>
                  <td><span className="badge badge-primary">{i.round}</span></td>
                  <td style={{ fontSize: 13 }}>
                    <div>{new Date(i.scheduledAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(i.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td>
                    <span className={`badge ${i.mode === 'online' ? 'badge-info' : 'badge-warning'}`}>{i.mode}</span>
                    {i.meetingLink && (
                      <a href={i.meetingLink} target="_blank" rel="noreferrer" style={{ marginLeft: 6 }}>
                        <ExternalLink size={12} color="var(--primary-light)" />
                      </a>
                    )}
                  </td>
                  <td><span className={`badge ${statusColor[i.status] || 'badge-muted'}`}>{i.status}</span></td>
                  <td>
                    {i.result
                      ? <span className={`badge ${resultColor[i.result] || 'badge-muted'}`}>{i.result}</span>
                      : <span className="badge badge-muted">—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {i.status === 'scheduled' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => { setResultModal({ open: true, interview: i }); setResultForm({ result: 'passed', feedback: '' }); }}
                        >
                          Result
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(i.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Interview Modal */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Schedule Interview</h2>
              <button className="modal-close" onClick={() => setCreateModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select id="int-student" className="form-select" required value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})}>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Drive *</label>
                <select id="int-drive" className="form-select" required value={form.driveId} onChange={e => setForm({...form, driveId: e.target.value})}>
                  <option value="">Select Drive</option>
                  {drives.map(d => <option key={d.id} value={d.id}>{d.jobRole} — {d.company?.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Round *</label>
                <select id="int-round" className="form-select" value={form.round} onChange={e => setForm({...form, round: e.target.value})}>
                  {ROUNDS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time *</label>
                <input id="int-dt" type="datetime-local" className="form-input" required value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Mode *</label>
                <select id="int-mode-create" className="form-select" value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              {form.mode === 'online' && (
                <div className="form-group">
                  <label className="form-label">Meeting Link</label>
                  <input id="int-link-create" type="url" className="form-input" placeholder="https://" value={form.meetingLink} onChange={e => setForm({...form, meetingLink: e.target.value})} />
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
                <button id="int-create-submit" type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal.open && (
        <div className="modal-overlay" onClick={() => setResultModal({ open: false, interview: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Update Interview Result</h2>
              <button className="modal-close" onClick={() => setResultModal({ open: false, interview: null })}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 16, padding: 14, background: 'var(--bg-3)', borderRadius: 8 }}>
              <p><strong>{resultModal.interview?.student?.name}</strong> — {resultModal.interview?.round}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{resultModal.interview?.drive?.jobRole}</p>
            </div>
            <form onSubmit={handleResult}>
              <div className="form-group">
                <label className="form-label">Result *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['passed', 'failed', 'pending'].map(r => (
                    <button
                      key={r}
                      type="button"
                      className={`btn btn-sm ${resultForm.result === r
                        ? r === 'passed' ? 'btn-success' : r === 'failed' ? 'btn-danger' : 'btn-secondary'
                        : 'btn-secondary'
                      }`}
                      onClick={() => setResultForm({...resultForm, result: r})}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Feedback</label>
                <textarea id="int-feedback" className="form-textarea" placeholder="Add feedback notes..." value={resultForm.feedback} onChange={e => setResultForm({...resultForm, feedback: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResultModal({ open: false, interview: null })}>Cancel</button>
                <button id="int-result-submit" type="submit" className="btn btn-primary">Save Result</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
