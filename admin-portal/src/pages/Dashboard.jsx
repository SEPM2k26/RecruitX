import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, BookOpen, Briefcase, FileText,
  Calendar, Trophy, TrendingUp, ChevronRight, ArrowRight,
  Pin, Sparkles, Award
} from 'lucide-react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import Tape from '../components/hand-drawn/Tape';
import Thumbtack from '../components/hand-drawn/Thumbtack';
import HandCard from '../components/hand-drawn/HandCard';

const HAND_COLORS = ['#ff4d4d', '#2d5da1', '#10b981', '#f59e0b', '#8b5cf6', '#2d2d2d'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, companiesRes, drivesRes, appsRes, interviewsRes, resultsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/companies'),
        api.get('/admin/drives'),
        api.get('/admin/applications'),
        api.get('/admin/interviews'),
        api.get('/admin/results/summary'),
      ]);

      setStats({
        students: studentsRes.data.total,
        companies: companiesRes.data.total,
        drives: drivesRes.data.total,
        applications: appsRes.data.total,
        interviews: interviewsRes.data.total,
        selected: appsRes.data.data.filter(a => a.status === 'Selected').length,
        summary: resultsRes.data.data,
      });

      setRecentApps(appsRes.data.data.slice(0, 5));
      setDrives(drivesRes.data.data.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="w-10 h-10 border-4 border-pencil border-t-marker-red rounded-full animate-spin" />
      <span className="font-heading font-bold text-xl text-pencil">Flipping through the placement book...</span>
    </div>
  );

  const statCards = [
    { label: 'Total Students', value: stats?.students || 0, icon: Users, color: '#2d5da1', path: '/students', postit: true, rot: -1.5 },
    { label: 'Companies', value: stats?.companies || 0, icon: Building2, color: '#ff4d4d', path: '/companies', postit: false, rot: 1 },
    { label: 'Active Drives', value: stats?.drives || 0, icon: Briefcase, color: '#10b981', path: '/drives', postit: true, rot: -0.5 },
    { label: 'Applications', value: stats?.applications || 0, icon: FileText, color: '#f59e0b', path: '/applications', postit: false, rot: 1.2 },
    { label: 'Interviews', value: stats?.interviews || 0, icon: Calendar, color: '#8b5cf6', path: '/interviews', postit: true, rot: -1 },
    { label: 'Selected Students', value: stats?.selected || 0, icon: Trophy, color: '#ff4d4d', path: '/results', postit: false, rot: 0.8 },
  ];

  const byStatusData = stats?.summary?.byStatus
    ? Object.entries(stats.summary.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  const branchData = stats?.summary?.selectedByBranch
    ? Object.entries(stats.summary.selectedByBranch).map(([name, value]) => ({ name, value }))
    : [];

  const getStatusBadge = (status) => {
    const map = {
      Applied: 'badge-muted', Shortlisted: 'badge-info', Aptitude: 'badge-warning',
      'Technical Interview': 'badge-primary', 'HR Interview': 'badge-info',
      Selected: 'badge-success', Rejected: 'badge-error',
    };
    return map[status] || 'badge-muted';
  };

  return (
    <div className="space-y-8">
      {/* Page Header with Hand-Drawn notes */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Placement Control Desk</h1>
          <p className="page-subtitle">Overview of student profiles, company drives, and hiring pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/drives')}
            className="btn btn-primary"
          >
            <Sparkles size={16} /> New Placement Drive
          </button>
        </div>
      </div>

      {/* Stat Cards - Sketched Post-its & Notes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, idx) => (
          <div
            key={s.label}
            onClick={() => navigate(s.path)}
            style={{ transform: `rotate(${s.rot}deg)` }}
            className={`p-4 border-[2.5px] border-pencil rounded-wobbly shadow-hand hover:shadow-hand-hover hover:scale-105 transition-all cursor-pointer relative ${
              s.postit ? 'bg-postit' : 'bg-paper-white'
            }`}
          >
            {idx % 2 === 0 ? <Tape /> : <Thumbtack />}
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-pencil flex items-center justify-center bg-paper-white shadow-hand-xs"
              >
                <s.icon size={16} strokeWidth={2.5} color={s.color} />
              </div>
              <ChevronRight size={14} className="text-pencil-light" />
            </div>
            <div className="font-heading font-bold text-3xl text-pencil">{s.value}</div>
            <div className="font-hand text-sm text-pencil-light font-medium mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Placement Pipeline Stage - Hand-Drawn Flow Diagram */}
      <HandCard decoration="tape" className="p-6">
        <div className="flex items-center justify-between mb-4 border-b-2 border-dashed border-pencil pb-3">
          <div className="flex items-center gap-2">
            <Award className="text-marker-red" size={22} strokeWidth={2.5} />
            <h2 className="font-heading font-bold text-2xl text-pencil">Placement Pipeline Stages</h2>
          </div>
          <div className="flex items-center gap-2 bg-highlighter-green px-3 py-1 border-2 border-pencil rounded-wobbly-sm shadow-hand-xs">
            <TrendingUp size={16} className="text-pencil" />
            <span className="font-hand font-bold text-sm text-pencil">
              Overall Rate: <strong className="font-heading text-marker-red">{stats?.summary?.selectionRate || '0%'}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {['Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`px-4 py-2 border-2 border-pencil rounded-wobbly shadow-hand-xs font-hand text-base transition-transform hover:-rotate-1 ${
                  step === 'Selected'
                    ? 'bg-highlighter-green font-bold text-pencil'
                    : 'bg-paper-white text-pencil'
                }`}
              >
                <span className="font-heading font-bold text-sm mr-1">{i + 1}.</span> {step}
                <span className="ml-1.5 font-heading font-bold text-marker-red">
                  ({stats?.summary?.byStatus?.[step] || 0})
                </span>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={18} strokeWidth={3} className="text-pencil hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </HandCard>

      {/* Analytics Charts - Hand-Drawn Notebook Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HandCard decoration="tack" className="p-6">
          <h2 className="font-heading font-bold text-xl mb-4 border-b-2 border-pencil pb-2 flex items-center justify-between">
            <span>Applications by Stage</span>
            <span className="text-xs font-hand text-pencil-light">Bar tally</span>
          </h2>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="name" tick={{ fill: '#2d2d2d', fontSize: 13, fontFamily: 'Patrick Hand' }} />
                <YAxis tick={{ fill: '#2d2d2d', fontSize: 13, fontFamily: 'Patrick Hand' }} />
                <Tooltip
                  contentStyle={{
                    background: '#fdfbf7',
                    border: '2px solid #2d2d2d',
                    borderRadius: '8px',
                    fontFamily: 'Patrick Hand',
                    boxShadow: '4px 4px 0px 0px #2d2d2d',
                    color: '#2d2d2d',
                  }}
                />
                <Bar dataKey="value" fill="#ff4d4d" radius={[6, 6, 0, 0]} stroke="#2d2d2d" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HandCard>

        <HandCard decoration="tape" className="p-6">
          <h2 className="font-heading font-bold text-xl mb-4 border-b-2 border-pencil pb-2 flex items-center justify-between">
            <span>Selections by Department / Branch</span>
            <span className="text-xs font-hand text-pencil-light">Distribution</span>
          </h2>
          <div className="h-[240px] w-full flex items-center justify-center">
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    stroke="#2d2d2d"
                    strokeWidth={2}
                  >
                    {branchData.map((_, i) => (
                      <Cell key={i} fill={HAND_COLORS[i % HAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fdfbf7',
                      border: '2px solid #2d2d2d',
                      borderRadius: '8px',
                      fontFamily: 'Patrick Hand',
                      boxShadow: '4px 4px 0px 0px #2d2d2d',
                    }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Patrick Hand', fontSize: '15px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center font-hand text-pencil-light py-8">
                <p className="text-lg">No branch selections logged yet.</p>
                <p className="text-sm">Advance students through interview stages to populate this chart.</p>
              </div>
            )}
          </div>
        </HandCard>
      </div>

      {/* Bottom Grid: Recent Applications & Active Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications Notebook */}
        <HandCard decoration="tack" className="p-6">
          <div className="flex items-center justify-between border-b-2 border-pencil pb-3 mb-4">
            <h2 className="font-heading font-bold text-xl text-pencil">Recent Candidate Submissions</h2>
            <button
              onClick={() => navigate('/applications')}
              className="font-hand font-bold text-sm text-pen-blue hover:underline flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {recentApps.length > 0 ? (
            <div className="space-y-3">
              {recentApps.map((app, idx) => (
                <div
                  key={app.id || app.applicationId || idx}
                  className="p-3 border-2 border-pencil rounded-wobbly-sm bg-paper-white shadow-hand-xs flex items-center justify-between gap-3 hover:-rotate-0.5 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border-2 border-pencil bg-postit flex items-center justify-center font-heading font-bold text-pencil">
                      {app.student?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-base text-pencil leading-tight">{app.student?.name}</p>
                      <p className="font-hand text-xs text-pencil-light">{app.drive?.jobRole} • {app.student?.branch || 'General'}</p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadge(app.status)}`}>{app.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-hand text-pencil-light text-center py-6">No applications received yet.</p>
          )}
        </HandCard>

        {/* Active Placement Drives */}
        <HandCard decoration="tape" className="p-6">
          <div className="flex items-center justify-between border-b-2 border-pencil pb-3 mb-4">
            <h2 className="font-heading font-bold text-xl text-pencil">Active Placement Bulletins</h2>
            <button
              onClick={() => navigate('/drives')}
              className="font-hand font-bold text-sm text-pen-blue hover:underline flex items-center gap-1"
            >
              Browse Drives <ChevronRight size={14} />
            </button>
          </div>

          {drives.length > 0 ? (
            <div className="space-y-3">
              {drives.map((drive) => (
                <div
                  key={drive.id}
                  onClick={() => navigate(`/drives/${drive.id}`)}
                  className="p-3.5 border-2 border-pencil rounded-wobbly bg-paper-white hover:bg-postit/40 shadow-hand-xs cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-heading font-bold text-base text-pencil leading-tight">{drive.jobRole}</p>
                      <p className="font-hand text-sm text-pencil-light">{drive.company?.name} • {drive.location}</p>
                    </div>
                    <span className="badge badge-success font-heading font-bold">{drive.package}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {drive.eligibleBranches?.map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 border border-pencil rounded-wobbly-sm bg-highlighter-yellow text-xs font-hand font-bold text-pencil"
                      >
                        {b}
                      </span>
                    ))}
                    <span className="text-xs font-hand text-pencil-light ml-auto self-center">
                      Min CGPA: {drive.minCGPA}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-hand text-pencil-light text-center py-6">No active drives posted.</p>
          )}
        </HandCard>
      </div>
    </div>
  );
}
