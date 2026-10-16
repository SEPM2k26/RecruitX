import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, X, MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const emptyForm = {
  companyId: '', jobRole: '', package: '', location: '', applicationDeadline: '',
  eligibleBranches: [], minCGPA: 6.0, maxBacklogs: 0, graduationYear: 2025, description: '',
};

export default function PlacementDrives() {
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, drive: null });
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      const [drivesRes, companiesRes] = await Promise.all([
        api.get('/admin/drives', { params: statusFilter ? { status: statusFilter } : {} }),
        api.get('/admin/companies'),
      ]);
      setDrives(drivesRes.data.data);
      setCompanies(companiesRes.data.data);
    } catch { error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, drive: null }); };
  const closeModal = () => setModal({ open: false, drive: null });

  const toggleBranch = (b) => {
    setForm(f => ({
      ...f,
      eligibleBranches: f.eligibleBranches.includes(b)
        ? f.eligibleBranches.filter(x => x !== b)
        : [...f.eligibleBranches, b],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.eligibleBranches.length === 0) { error('Select at least one eligible branch'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/drives', form);
      success('Placement drive created');
      closeModal();
      loadData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create drive');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this drive?')) return;
    try {
      await api.delete(`/admin/drives/${id}`);
      success('Drive deleted');
      loadData();
    } catch { error('Delete failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/admin/drives/${id}`, { status });
      success(`Drive ${status}`);
      loadData();
    } catch { error('Update failed'); }
  };

  const statusColor = { active: 'badge-success', closed: 'badge-muted', cancelled: 'badge-error' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Placement Drives</h1>
          <p className="page-subtitle">{drives.length} drives listed</p>
        </div>
        <button id="add-drive-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create Drive
        </button>
      </div>

      <div className="search-bar">
        {['', 'active', 'closed', 'cancelled'].map(s => (
          <button
            key={s || 'all'}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      ) : drives.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <p>No placement drives found</p>
          <span>Create a drive to get started</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {drives.map((d) => (
            <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Company Logo - Hand-Drawn Emblem */}
              <div
                style={{
                  width: 54, height: 54, flexShrink: 0,
                  border: '2.5px solid var(--color-pencil)',
                  borderRadius: 'var(--wobbly-radius-sm)',
                  boxShadow: 'var(--hard-shadow-sm)',
                  background: 'var(--color-postit)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 24,
                  color: 'var(--color-pencil)', transform: 'rotate(-2deg)'
                }}
              >
                {d.company?.name?.charAt(0) || '?'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: 'var(--color-pencil)' }}>{d.jobRole}</h3>
                  <span className={`badge ${statusColor[d.status] || 'badge-muted'}`}>{d.status}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{d.company?.name}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <DollarSign size={13} />{d.package}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} />{d.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} />Deadline: {d.applicationDeadline}
                  </span>
                  <span>Min CGPA: <strong>{d.minCGPA}</strong></span>
                  <span>Backlogs ≤ <strong>{d.maxBacklogs}</strong></span>
                </div>
                <div className="chip-list" style={{ marginTop: 8 }}>
                  {d.eligibleBranches?.map(b => <span key={b} className="chip">{b}</span>)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/drives/${d.id}`)}>
                  <Eye size={14} /> View
                </button>
                {d.status === 'active' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(d.id, 'closed')}>
                    Close
                  </button>
                )}
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(d.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Drive Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Placement Drive</h2>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <select id="drive-company" className="form-select" required value={form.companyId} onChange={e => setForm({...form, companyId: e.target.value})}>
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Role *</label>
                  <input id="drive-role" className="form-input" required value={form.jobRole} onChange={e => setForm({...form, jobRole: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Package *</label>
                  <input id="drive-package" className="form-input" placeholder="e.g. 8 LPA" required value={form.package} onChange={e => setForm({...form, package: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input id="drive-location" className="form-input" required value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Application Deadline *</label>
                  <input id="drive-deadline" type="date" className="form-input" required value={form.applicationDeadline} onChange={e => setForm({...form, applicationDeadline: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Graduation Year *</label>
                  <input id="drive-year" type="number" className="form-input" required value={form.graduationYear} onChange={e => setForm({...form, graduationYear: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min CGPA *</label>
                  <input id="drive-cgpa" type="number" step="0.1" min="0" max="10" className="form-input" required value={form.minCGPA} onChange={e => setForm({...form, minCGPA: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Backlogs</label>
                  <input id="drive-backlogs" type="number" min="0" className="form-input" value={form.maxBacklogs} onChange={e => setForm({...form, maxBacklogs: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Eligible Branches * (select multiple)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {BRANCHES.map(b => (
                    <button
                      key={b}
                      type="button"
                      className={`btn btn-sm ${form.eligibleBranches.includes(b) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleBranch(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="drive-desc" className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button id="drive-submit" type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
