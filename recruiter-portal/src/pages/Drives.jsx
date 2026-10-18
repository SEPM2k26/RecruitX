import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const emptyForm = {
  jobRole: '', package: '', location: '', applicationDeadline: '',
  eligibleBranches: 'CSE,ECE,IT', minCGPA: '6.5', maxBacklogs: '0', graduationYear: '2027',
};

export default function Drives() {
  const [drives, setDrives] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get('/recruiter/drives')
      .then((r) => setDrives(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load drives'));

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/recruiter/drives', {
        ...form,
        eligibleBranches: form.eligibleBranches.split(',').map((s) => s.trim()).filter(Boolean),
        minCGPA: parseFloat(form.minCGPA),
        maxBacklogs: parseInt(form.maxBacklogs, 10),
        graduationYear: parseInt(form.graduationYear, 10),
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create drive');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this drive and its applications?')) return;
    try {
      await api.delete(`/recruiter/drives/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete drive');
    }
  };

  if (!drives && !error) return <p className="text-pencil-faint">Loading drives…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-3xl font-bold">Placement Drives</h1>
        <button className="btn-hand bg-postit" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Drive'}
        </button>
      </div>

      {error && <p className="text-marker-red font-bold">{error}</p>}

      {showForm && (
        <form onSubmit={create} className="card-hand grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block font-bold mb-1">Job role *</label>
            <input className="input-hand" required value={form.jobRole} onChange={set('jobRole')} /></div>
          <div><label className="block font-bold mb-1">Package *</label>
            <input className="input-hand" required placeholder="8 LPA" value={form.package} onChange={set('package')} /></div>
          <div><label className="block font-bold mb-1">Location *</label>
            <input className="input-hand" required value={form.location} onChange={set('location')} /></div>
          <div><label className="block font-bold mb-1">Deadline</label>
            <input className="input-hand" type="date" value={form.applicationDeadline} onChange={set('applicationDeadline')} /></div>
          <div><label className="block font-bold mb-1">Branches (comma-sep) *</label>
            <input className="input-hand" required value={form.eligibleBranches} onChange={set('eligibleBranches')} /></div>
          <div><label className="block font-bold mb-1">Min CGPA</label>
            <input className="input-hand" type="number" step="0.1" min="0" max="10" value={form.minCGPA} onChange={set('minCGPA')} /></div>
          <div><label className="block font-bold mb-1">Max backlogs</label>
            <input className="input-hand" type="number" min="0" value={form.maxBacklogs} onChange={set('maxBacklogs')} /></div>
          <div><label className="block font-bold mb-1">Graduation year</label>
            <input className="input-hand" type="number" min="2020" value={form.graduationYear} onChange={set('graduationYear')} /></div>
          <button type="submit" disabled={busy} className="btn-hand bg-highlighter-green md:col-span-2">
            {busy ? 'Creating…' : 'Create drive'}
          </button>
        </form>
      )}

      <div className="card-hand">
        {(drives || []).length === 0 ? (
          <p className="text-pencil-faint">No drives for your company yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-3 border-pencil font-heading">
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Package</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Applicants</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {drives.map((d) => (
                <tr key={d.id} className="border-b border-erased hover:bg-paper-dark">
                  <td className="py-2 pr-4">
                    <Link className="underline text-pen-blue font-bold" to={`/drives/${d.id}`}>{d.jobRole}</Link>
                  </td>
                  <td className="py-2 pr-4">{d.package}</td>
                  <td className="py-2 pr-4">{d.location}</td>
                  <td className="py-2 pr-4"><span className="badge-hand bg-highlighter-green">{d.status}</span></td>
                  <td className="py-2 pr-4 font-bold">{d._count?.applications ?? 0}</td>
                  <td className="py-2 text-right">
                    <button className="btn-hand bg-marker-red text-white text-sm" onClick={() => remove(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
