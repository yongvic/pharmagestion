import React, { useState } from 'react';
import { NavLink, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Pill, Package, Users, ShieldCheck, Settings, LogOut, Search, Banknote, ShoppingCart } from 'lucide-react';
import { cn } from '../components/UI';
import PharmacyLogo3D from '../components/PharmacyLogo3D';
import NotificationBell from '../components/NotificationBell';
import useAuthStore from '../store/useAuthStore';

const SidebarLink = ({ to, icon: Icon, children }) => (
  <NavLink to={to} end={to === '/'}
    className={({ isActive }) => cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
      isActive ? 'bg-white/15 text-white shadow-lg' : 'text-indigo-200/60 hover:bg-white/10 hover:text-white'
    )}>
    <Icon size={20} className="shrink-0" />
    <span className="font-medium text-sm">{children}</span>
  </NavLink>
);

const DashboardLayout = ({ children }) => {
  const { logout, user, isAuthenticated, isPharmacist } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/medications?search=${encodeURIComponent(search.trim())}`);
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de Bord', roles: ['ADMIN'] },
    { to: '/medications', icon: Pill, label: 'Médicaments', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    { to: '/inventory', icon: Package, label: 'Stock', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    { to: '/pos', icon: ShoppingCart, label: isPharmacist() ? 'Préparation' : 'Vente (POS)', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    { to: '/cashier', icon: Banknote, label: 'Caisse', roles: ['ADMIN', 'CASHIER'] },
    { to: '/insurance', icon: ShieldCheck, label: 'Assurances', roles: ['ADMIN'] },
    { to: '/users', icon: Users, label: 'Utilisateurs', roles: ['ADMIN'] },
    { to: '/settings', icon: Settings, label: 'Paramètres', roles: ['ADMIN'] },
  ];

  const roleLabels = { ADMIN: 'Administrateur', PHARMACIST: 'Pharmacien', CASHIER: 'Caissier' };

  return (
    <div className="flex min-h-screen bg-slate-50/90">
      <aside className="w-[17rem] sidebar-gradient flex flex-col p-4 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 px-2 py-5 mb-3">
          <PharmacyLogo3D size="sm" showGlow={false} />
          <div>
            <span className="font-bold text-lg text-white block">PharmaGestion</span>
            <span className="text-[10px] text-indigo-300/50 font-semibold">Pro Desktop</span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {navItems.filter((i) => i.roles.includes(user?.role)).map((item) => (
            <SidebarLink key={item.to} to={item.to} icon={item.icon}>{item.label}</SidebarLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-white/10">
          <button onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-200/70 hover:bg-rose-500/15">
            <LogOut size={20} /><span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-[4.5rem] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un médicament..."
              className="w-full bg-slate-100/70 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-pharmacy-500/20 focus:bg-white" />
          </form>
          <div className="flex items-center gap-4 ml-6">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user?.first_name || user?.username}</p>
                <p className="text-xs text-slate-500">{roleLabels[user?.role]}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-pharmacy-500 to-medical-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="p-6 lg:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
