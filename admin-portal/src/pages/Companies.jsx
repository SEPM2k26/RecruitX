import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ExternalLink, X } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const INDUSTRIES = ['IT Services', 'Fintech', 'Healthcare', 'Manufacturing', 'E-commerce', 'Consulting', 'Banking', 'Telecom'];

const emptyForm = { name: '', industry: '', website: '', description: '', contactEmail: '', contactPhone: '', location: '' };

export default function Companies() {
  const { success, error } = useNotification();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', company: null });
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    try {
      const { data } = await api.get('/admin/companies');
      setCompanies(data.data);
    } catch { error('Failed to load companies'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, mode: 'create', company: null }); };
  const openEdit = (c) => { setForm(c); setModal({ open: true, mode: 'edit', company: c }); };
  const closeModal = () => setModal({ open: false, mode: 'create', company: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal.mode === 'create') {
        await api.post('/admin/companies', form);
        success('Company created successfully');
      } else {
        await api.put(`/admin/companies/${modal.company.id}`, form);
        success('Company updated successfully');
      }
      closeModal();
      loadCompanies();
    } catch (err) {
      error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      await api.delete(`/admin/companies/${id}`);
      success('Company deleted');
      loadCompanies();
    } catch { error('Failed to delete company'); }
  };

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">{companies.length} companies registered</p>
        </div>
        <button id="add-company-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Company
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            id="company-search"
            className="search-input"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading...</span></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <p>No companies found</p>
            </div>
          ) : filtered.map((c) => (
            <div key={c.id} className="card" style={{ transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 18, color: 'white',
                  }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</h3>
                    <span className="badge badge-primary" style={{ marginTop: 4 }}>{c.industry}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit">
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                {c.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                {c.location && <span style={{ color: 'var(--text-secondary)' }}>📍 {c.location}</span>}
                {c.contactEmail && <span style={{ color: 'var(--text-secondary)' }}>✉ {c.contactEmail}</span>}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ExternalLink size={12} /> Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modal.mode === 'create' ? 'Add Company' : 'Edit Company'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input id="company-name" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry *</label>
                  <select id="company-industry" className="form-select" required value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}>
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input id="company-email" type="email" className="form-input" required value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input id="company-phone" className="form-input" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input id="company-website" type="url" className="form-input" placeholder="https://" value={form.website} onChange={e => setForm({...form, website: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input id="company-location" className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="company-description" className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button id="company-submit" type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : modal.mode === 'create' ? 'Add Company' : 'Update Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
