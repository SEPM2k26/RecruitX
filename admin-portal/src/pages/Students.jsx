import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Trash2, UserX, UserCheck, Plus } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const YEARS = [2024, 2025, 2026, 2027];

export default function Students() {
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', branch: '', graduationYear: '' });

  useEffect(() => { loadStudents(); }, [filters.branch, filters.graduationYear]);

  const loadStudents = async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.branch) params.branch = filters.branch;
      if (filters.graduationYear) params.graduationYear = filters.graduationYear;
      const { data } = await api.get('/admin/students', { params });
      setStudents(data.data);
    } catch (err) {
      error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/students/${id}/status`);
      success(`Student ${currentStatus ? 'disabled' : 'enabled'} successfully`);
      loadStudents();
    } catch {
      error('Failed to update student status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      success('Student deleted');
      loadStudents();
    } catch {
      error('Failed to delete student');
    }
  };

  const getBranchBadge = (b) => {
    const map = { CSE: 'badge-primary', IT: 'badge-info', ECE: 'badge-warning', EEE: 'badge-success' };
    return map[b] || 'badge-muted';
  };

  const filtered = students.filter(s =>
    !filters.search ||
    s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    s.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students registered</p>
        </div>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-input-wrapper" style={{ flex: 2 }}>
          <Search size={16} />
          <input
            id="student-search"
            className="search-input"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          id="student-branch-filter"
          className="form-select"
          style={{ width: 140 }}
          value={filters.branch}
          onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
        >
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b}>{b}</option>)}
        </select>
        <select
          id="student-year-filter"
          className="form-select"
          style={{ width: 150 }}
          value={filters.graduationYear}
          onChange={(e) => setFilters({ ...filters, graduationYear: e.target.value })}
        >
          <option value="">All Years</option>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">
          <Search size={16} /> Search
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="loading"><div className="spinner" /><span>Loading students...</span></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Backlogs</th>
                <th>Grad Year</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <p>No students found</p>
                    <span>Try adjusting your search filters</span>
                  </div>
                </td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{s.name.charAt(0)}</div>
                      <div>
                        <p style={{ fontWeight: 500 }}>{s.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${getBranchBadge(s.branch)}`}>{s.branch}</span></td>
                  <td>
                    <span style={{ fontWeight: 600, color: s.cgpa >= 8 ? 'var(--success)' : s.cgpa >= 6 ? 'var(--warning)' : 'var(--error)' }}>
                      {s.cgpa}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: s.backlogs === 0 ? 'var(--success)' : 'var(--error)' }}>
                      {s.backlogs}
                    </span>
                  </td>
                  <td>{s.graduationYear}</td>
                  <td>
                    <div className="chip-list">
                      {s.skills?.slice(0, 2).map(sk => <span key={sk} className="chip">{sk}</span>)}
                      {s.skills?.length > 2 && <span className="chip">+{s.skills.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-error'}`}>
                      {s.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        title="View"
                        onClick={() => navigate(`/students/${s.id}`)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className={`btn btn-sm btn-icon ${s.isActive ? 'btn-danger' : 'btn-success'}`}
                        title={s.isActive ? 'Disable' : 'Enable'}
                        onClick={() => handleToggleStatus(s.id, s.isActive)}
                      >
                        {s.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        title="Delete"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 size={14} />
                      </button>
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
