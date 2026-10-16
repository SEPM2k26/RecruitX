import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, X, BookOpen } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const emptyForm = { title: '', description: '', instructor: '', startDate: '', endDate: '', duration: '', mode: 'online', maxStudents: 30, status: 'upcoming' };

export default function Trainings() {
  const { success, error } = useNotification();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', training: null });
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTrainings(); }, []);

  const loadTrainings = async () => {
    try {
      const { data } = await api.get('/admin/trainings');
      setTrainings(data.data);
    } catch { error('Failed to load trainings'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, mode: 'create', training: null }); };
  const openEdit = (t) => { setForm(t); setModal({ open: true, mode: 'edit', training: t }); };
  const closeModal = () => setModal({ open: false, mode: 'create', training: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal.mode === 'create') {
        await api.post('/admin/trainings', form);
        success('Training created');
      } else {
        await api.put(`/admin/trainings/${modal.training.id}`, form);
        success('Training updated');
      }
      closeModal();
      loadTrainings();
    } catch (err) {
      error(err.response?.data?.message || 'Operation failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this training?')) return;
    try {
      await api.delete(`/admin/trainings/${id}`);
      success('Training deleted');
      loadTrainings();
    } catch { error('Delete failed'); }
  };

  const statusColor = { upcoming: 'badge-warning', active: 'badge-success', completed: 'badge-muted', cancelled: 'badge-error' };
  const modeIcon = { online: '🌐', offline: '🏢', hybrid: '🔄' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Training Programs</h1>
          <p className="page-subtitle">{trainings.length} programs available</p>
        </div>
        <button id="add-training-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create Training
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {trainings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <p>No training programs yet</p>
            </div>
          ) : trainings.map((t) => (
            <div key={t.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 24 }}>{modeIcon[t.mode] || '📘'}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {t.instructor}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(t)}><Edit size={14} /></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                {t.description || 'No description.'}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className={`badge ${statusColor[t.status] || 'badge-muted'}`}>{t.status}</span>
                <span className="badge badge-info">{t.mode}</span>
                {t.duration && <span className="badge badge-muted">{t.duration}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>📅 {t.startDate} → {t.endDate}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={13} /> {t.enrolledStudents?.length || 0}/{t.maxStudents}
                </span>
              </div>

              <div className="progress-bar" style={{ marginTop: 10 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(((t.enrolledStudents?.length || 0) / t.maxStudents) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modal.mode === 'create' ? 'Create Training' : 'Edit Training'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input id="training-title" className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="training-desc" className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Instructor *</label>
                  <input id="training-instructor" className="form-input" required value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input id="training-duration" className="form-input" placeholder="e.g. 8 weeks" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input id="training-start" type="date" className="form-input" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input id="training-end" type="date" className="form-input" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mode *</label>
                  <select id="training-mode" className="form-select" value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Students *</label>
                  <input id="training-max" type="number" min="1" className="form-input" required value={form.maxStudents} onChange={e => setForm({...form, maxStudents: e.target.value})} />
                </div>
              </div>
              {modal.mode === 'edit' && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select id="training-status" className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button id="training-submit" type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : modal.mode === 'create' ? 'Create Training' : 'Update Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
