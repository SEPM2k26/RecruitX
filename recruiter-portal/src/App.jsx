import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Drives from './pages/Drives';
import DriveDetail from './pages/DriveDetail';
import Company from './pages/Company';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('recruitx_recruiter_user'));
  } catch {
    return null;
  }
};

function ProtectedLayout({ user, onLogout }) {
  const navClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-wobbly-sm border-3 font-heading font-bold transition-all ${
      isActive
        ? 'bg-postit border-pencil shadow-hand'
        : 'border-transparent hover:border-pencil hover:shadow-hand-sm'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-3 border-pencil bg-paper-light sticky top-0 z-10 shadow-hand-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-bold">✎ RecruitX</span>
            <span className="badge-hand bg-highlighter-yellow">Recruiter</span>
          </div>
          <nav className="flex items-center gap-2 flex-wrap">
            <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
            <NavLink to="/drives" className={navClass}>Drives</NavLink>
            <NavLink to="/company" className={navClass}>Company</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-pencil-light hidden sm:inline">{user?.name}</span>
            <button onClick={onLogout} className="btn-hand bg-marker-red text-white">Logout</button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t-3 border-pencil py-2 text-center text-pencil-faint text-sm">
        RecruitX Recruiter Portal
      </footer>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(readUser);

  const handleLogin = (u) => {
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('recruitx_recruiter_token');
    localStorage.removeItem('recruitx_recruiter_user');
    setUser(null);
    window.location.pathname = '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            user ? (
              <ProtectedLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drives" element={<Drives />} />
          <Route path="drives/:id" element={<DriveDetail />} />
          <Route path="company" element={<Company />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
