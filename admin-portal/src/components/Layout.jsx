import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Building2, BookOpen, Briefcase,
  FileText, Calendar, Trophy, Bell, LogOut, ChevronRight, ChevronLeft,
  Sparkles,
} from 'lucide-react';
import Tape from './hand-drawn/Tape';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tag: 'Overview' },
  { to: '/students', icon: Users, label: 'Students', tag: 'Profiles' },
  { to: '/companies', icon: Building2, label: 'Companies', tag: 'Partners' },
  { to: '/trainings', icon: BookOpen, label: 'Trainings', tag: 'Programs' },
  { to: '/drives', icon: Briefcase, label: 'Placement Drives', tag: 'Active' },
  { to: '/applications', icon: FileText, label: 'Applications', tag: 'Pipeline' },
  { to: '/interviews', icon: Calendar, label: 'Interviews', tag: 'Rounds' },
  { to: '/results', icon: Trophy, label: 'Results', tag: 'Analytics' },
  { to: '/notifications', icon: Bell, label: 'Notifications', tag: 'Broadcast' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar - Notebook Binder */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-logo">
              <span className="logo-icon">R</span>
              <div>
                <span className="logo-text">RecruitX</span>
                <span className="logo-badge ml-2">TPO Desk</span>
              </div>
            </div>
          )}
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} strokeWidth={2.5} className="nav-icon" />
              {!collapsed && (
                <span className="nav-label font-heading text-[15px] font-semibold">{label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-info">
              <div className="user-avatar">{user?.name?.charAt(0) || 'A'}</div>
              <div className="user-details">
                <p className="user-name">{user?.name || 'Super Admin'}</p>
                <p className="user-role font-hand text-xs text-pencil-light">TPO Officer</p>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} strokeWidth={2.5} />
            {!collapsed && <span className="font-heading font-bold text-xs">Exit</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="main-content">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
