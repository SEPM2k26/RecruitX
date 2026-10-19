import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, GraduationCap, Award, Code, FileText, Calendar } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [stuRes, appsRes, intvRes] = await Promise.all([
        api.get(`/admin/students/${id}`),
        api.get('/admin/applications', { params: { studentId: id } }),
        api.get('/admin/interviews', { params: { studentId: id } }),
      ]);
      setStudent(stuRes.data.data);
      setApplications(appsRes.data.data);
      setInterviews(intvRes.data.data);
    } catch {
      error('Failed to load student details');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (s) => {
    const map = { Applied: 'badge-muted', Shortlisted: 'badge-info', Selected: 'badge-success', Rejected: 'badge-error', Aptitude: 'badge-warning', 'Technical Interview': 'badge-primary', 'HR Interview': 'badge-info' };
    return map[s] || 'badge-muted';
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;
  if (!student) return null;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate('/students')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">{student.name}</h1>
          <p className="page-subtitle">Student Profile & Activity</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{student.name.charAt(0)}</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{student.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{student.branch} • {student.graduationYear}</p>
            </div>
            <span className={`badge ${student.isActive ? 'badge-success' : 'badge-error'}`} style={{ marginLeft: 'auto' }}>
              {student.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: Mail, label: 'Email', value: student.email },
              { icon: Phone, label: 'Phone', value: student.phone || 'Not provided' },
              { icon: GraduationCap, label: 'Branch', value: student.branch },
              { icon: Award, label: 'CGPA', value: student.cgpa, color: student.cgpa >= 8 ? 'var(--success)' : student.cgpa >= 6 ? 'var(--warning)' : 'var(--error)' },
              { icon: FileText, label: 'Backlogs', value: student.backlogs, color: student.backlogs === 0 ? 'var(--success)' : 'var(--error)' },
              { icon: Calendar, label: 'Graduation Year', value: student.graduationYear },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={16} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)', fontSize: 13, width: 120 }}>{label}:</span>
                <span style={{ fontWeight: 500, color: color || 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="divider" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Code size={14} /> Skills
            </p>
            <div className="chip-list">
              {student.skills?.map(sk => <span key={sk} className="chip">{sk}</span>) || <span style={{ color: 'var(--text-muted)' }}>No skills added</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Total Applications', value: applications.length, color: '#6366f1' },
            { label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, color: '#06b6d4' },
            { label: 'Interviews', value: interviews.length, color: '#8b5cf6' },
            { label: 'Selected', value: applications.filter(a => a.status === 'Selected').length, color: '#10b981' },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applications */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Applications ({applications.length})</div>
        {applications.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}><p>No applications yet</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Drive</th><th>Company</th><th>Package</th><th>Status</th><th>Applied</th></tr></thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr key={app.id || app.applicationId || idx}>
                    <td style={{ fontWeight: 500 }}>{app.drive?.jobRole}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{app.drive?.companyId}</td>
                    <td><span className="badge badge-success">{app.drive?.package}</span></td>
                    <td><span className={`badge ${getStatusBadge(app.status)}`}>{app.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(app.appliedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interviews */}
      <div className="card">
        <div className="card-title">Interviews ({interviews.length})</div>
        {interviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}><p>No interviews scheduled</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Round</th><th>Drive</th><th>Scheduled</th><th>Mode</th><th>Result</th></tr></thead>
              <tbody>
                {interviews.map(i => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 500 }}>{i.round}</td>
                    <td>{i.drive?.jobRole}</td>
                    <td style={{ fontSize: 13 }}>{new Date(i.scheduledAt).toLocaleString()}</td>
                    <td><span className={`badge ${i.mode === 'online' ? 'badge-info' : 'badge-warning'}`}>{i.mode}</span></td>
                    <td>
                      {i.result ? (
                        <span className={`badge ${i.result === 'passed' ? 'badge-success' : 'badge-error'}`}>{i.result}</span>
                      ) : (
                        <span className="badge badge-muted">Pending</span>
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
