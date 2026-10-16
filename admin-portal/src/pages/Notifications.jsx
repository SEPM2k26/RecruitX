import { useState, useEffect } from 'react';
import { Bell, Plus, Send, Megaphone, X, Check } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const TYPES = ['general', 'drive_announcement', 'interview_scheduled', 'application_status', 'shortlisted', 'rejected', 'interview_result'];
const BRANCHES = ['', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

export default function Notifications() {
  const { success, error } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'single' });
  const [form, setForm] = useState({ userId: '', message: '', type: 'general' });
  const [broadcastForm, setBroadcastForm] = useState({ message: '', type: 'drive_announcement', branch: '', graduationYear: '' });
  const [students, setStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => { loadData(); }, [typeFilter]);

  const loadData = async () => {
    try {
      const [notifRes, stuRes] = await Promise.all([
        api.get('/admin/notifications', { params: typeFilter ? { type: typeFilter } : {} }),
        api.get('/admin/students'),
      ]);
      setNotifications(notifRes.data.data);
      setStudents(stuRes.data.data);
    } catch { error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/notifications', form);
      success('Notification sent');
      setModal({ open: false, mode: 'single' });
      setForm({ userId: '', message: '', type: 'general' });
      loadData();
    } catch (err) { error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/admin/notifications/broadcast', broadcastForm);
      success(data.message);
      setModal({ open: false, mode: 'single' });
      setBroadcastForm({ message: '', type: 'drive_announcement', branch: '', graduationYear: '' });
      loadData();
    } catch (err) { error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const typeColor = {
    general: 'badge-muted', drive_announcement: 'badge-primary',
    interview_scheduled: 'badge-warning', application_status: 'badge-info',
    shortlisted: 'badge-success', rejected: 'badge-error', interview_result: 'badge-primary',
  };

  const typeIcon = {
    general: '📢', drive_announcement: '🏢', interview_scheduled: '📅',
    application_status: '📋', shortlisted: '⭐', rejected: '❌', interview_result: '🎯',
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{notifications.length} total • <span style={{ color: 'var(--warning)' }}>{unread} unread</span></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button id="send-notification-btn" className="btn btn-secondary" onClick={() => setModal({ open: true, mode: 'single' })}>
            <Send size={16} /> Send to Student
          </button>
          <button id="broadcast-btn" className="btn btn-primary" onClick={() => setModal({ open: true, mode: 'broadcast' })}>
            <Megaphone size={16} /> Broadcast
          </button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="search-bar" style={{ flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter('')}>All</button>
        {TYPES.map(t => (
          <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter(t)}>
            {typeIcon[t]} {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <p>No notifications found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n) => {
            const student = students.find(s => s.id === n.userId);
            return (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  opacity: n.read ? 0.7 : 1,
                  borderLeft: !n.read ? '3px solid var(--primary)' : '3px solid transparent',
                }}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>{typeIcon[n.type] || '📬'}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{n.message}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center' }}>
                    {student && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>To: {student.name}</span>}
                    <span className={`badge ${typeColor[n.type] || 'badge-muted'}`} style={{ fontSize: 10 }}>{n.type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {n.read
                  ? <Check size={16} color="var(--success)" />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                }
              </div>
            );
          })}
        </div>
      )}

      {/* Single Notification Modal */}
      {modal.open && modal.mode === 'single' && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, mode: 'single' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Send Notification</h2>
              <button className="modal-close" onClick={() => setModal({ open: false, mode: 'single' })}><X size={16} /></button>
            </div>
            <form onSubmit={handleSend}>
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select id="notif-student" className="form-select" required value={form.userId} onChange={e => setForm({...form, userId: e.target.value})}>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select id="notif-type" className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea id="notif-message" className="form-textarea" required placeholder="Type your message..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'single' })}>Cancel</button>
                <button id="notif-send" type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sending...' : <><Send size={14} /> Send</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {modal.open && modal.mode === 'broadcast' && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, mode: 'single' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Broadcast Notification</h2>
              <button className="modal-close" onClick={() => setModal({ open: false, mode: 'single' })}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Send a notification to all students, optionally filtered by branch or graduation year.
            </p>
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select id="bc-type" className="form-select" value={broadcastForm.type} onChange={e => setBroadcastForm({...broadcastForm, type: e.target.value})}>
                  {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Filter by Branch</label>
                  <select id="bc-branch" className="form-select" value={broadcastForm.branch} onChange={e => setBroadcastForm({...broadcastForm, branch: e.target.value})}>
                    <option value="">All Branches</option>
                    {['CSE','IT','ECE','EEE','MECH','CIVIL'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Filter by Grad Year</label>
                  <input id="bc-year" type="number" className="form-input" placeholder="e.g. 2025" value={broadcastForm.graduationYear} onChange={e => setBroadcastForm({...broadcastForm, graduationYear: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea id="bc-message" className="form-textarea" required placeholder="Broadcast message..." value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'single' })}>Cancel</button>
                <button id="bc-send" type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Broadcasting...' : <><Megaphone size={14} /> Broadcast</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
