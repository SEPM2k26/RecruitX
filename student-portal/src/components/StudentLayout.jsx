import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, BriefcaseBusiness, ChevronDown, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/profile', label: 'My profile', icon: UserRound },
  { to: '/resume', label: 'Resume', icon: FileText },
  { to: '/drives', label: 'Placement drives', icon: BriefcaseBusiness },
  { to: '/applications', label: 'Applications', icon: BookOpen },
  { to: '/trainings', label: 'Training', icon: GraduationCap },
  { to: '/interviews', label: 'Interviews', icon: Bell },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];
const titles = Object.fromEntries(links.map((link) => [link.to, link.label]));

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const name = user?.name || user?.fullName || 'Student';
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const Sidebar = () => <>
    <div className="flex h-[82px] items-center gap-3 border-b border-line px-6">
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-brand text-lime"><GraduationCap size={22} /></div>
      <div><p className="font-extrabold tracking-tight text-ink">Recruit<span className="text-brand">X</span></p><p className="text-[11px] font-semibold uppercase tracking-[.13em] text-muted">Student space</p></div>
    </div>
    <div className="px-4 pt-7"><p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#a0aaa2]">Workspace</p>
      <nav className="mt-3 space-y-1">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${isActive ? 'bg-brand-soft text-brand' : 'text-[#738078] hover:bg-paper hover:text-ink'}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{to === '/notifications' && <span className="ml-auto h-2 w-2 rounded-full bg-[#dd7b4c]" />}</NavLink>)}</nav>
    </div>
    <div className="mt-auto p-4"><div className="rounded-2xl bg-[#eef4eb] p-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-xs font-extrabold text-brand-dark">✦</div><p className="mt-3 text-sm font-bold">Your next step</p><p className="mt-1 text-xs leading-5 text-muted">A complete profile helps recruiters get to know you.</p><button className="mt-3 text-xs font-bold text-brand" onClick={() => navigate('/profile')}>Review my profile <span aria-hidden>→</span></button></div><button className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-muted hover:bg-paper hover:text-ink" onClick={() => { logout(); navigate('/login'); }}><LogOut size={15}/> Sign out</button><p className="px-1 pt-2 text-[10px] text-[#a0aaa2]">RECRUITX · STUDENT PORTAL</p></div>
  </>;
  return <div className="min-h-screen bg-paper">
    {menuOpen && <div className="fixed inset-0 z-50 bg-black/20 lg:hidden" onClick={() => setMenuOpen(false)}><aside className="flex h-full w-[270px] flex-col bg-white" onClick={(event) => event.stopPropagation()}><div className="flex justify-end p-3"><button aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={20} /></button></div><Sidebar /></aside></div>}
    <aside className="desktop-sidebar fixed inset-y-0 left-0 z-20 flex w-[250px] flex-col border-r border-line bg-white"><Sidebar /></aside>
    <div className="min-h-screen lg:pl-[250px]">
      <header className="sticky top-0 z-10 flex h-[82px] items-center justify-between border-b border-line bg-white/90 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-paper lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><div><p className="text-[11px] font-semibold text-muted">Student portal <span className="px-1 text-[#c5cbc5]">/</span> {titles[location.pathname] || 'Details'}</p><p className="mt-0.5 font-bold text-ink">{titles[location.pathname] || 'Your placement journey'}</p></div></div>
        <div className="flex items-center gap-2 md:gap-4"><button className="hidden rounded-xl border border-line p-2.5 text-muted hover:bg-paper sm:block" aria-label="Search"><Search size={17} /></button><button onClick={() => navigate('/notifications')} className="relative rounded-xl border border-line p-2.5 text-muted hover:bg-paper" aria-label="Notifications"><Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e57a48]" /></button><div className="h-8 w-px bg-line" /><button className="flex items-center gap-2" onClick={() => navigate('/profile')}><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e9f2ec] text-xs font-bold text-brand">{initials}</span><span className="hidden text-left sm:block"><span className="block text-xs font-bold">{name}</span><span className="block text-[10px] text-muted">Student</span></span><ChevronDown size={14} className="hidden text-muted sm:block" /></button><button className="hidden p-2 text-muted hover:text-red-600 md:block" onClick={() => { logout(); navigate('/login'); }} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button></div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-9"><Outlet /></main>
    </div>
  </div>;
}
