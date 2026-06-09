import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, History, ShoppingCart, Pill, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getSales, getSalesStats } from '../api/sales';
import { getMedications } from '../api/medications';
import { DoubleBezel, cn } from '../components/UI';
import PharmacyLogo3D from '../components/PharmacyLogo3D';
import useAuthStore from '../store/useAuthStore';
import { formatCurrency, formatPercent } from '../utils/format';

const StatCard = ({ label, value, trend, trendType, icon: Icon, accent }) => (
  <div className="glass-card stat-card-accent p-6 flex flex-col justify-between min-h-[158px] group hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300">
    <div className="flex justify-between items-start">
      <div className={cn('p-3 rounded-2xl transition-all duration-300',
        accent === 'indigo' && 'bg-pharmacy-50 text-pharmacy-500',
        accent === 'violet' && 'bg-medical-50 text-medical-500',
        accent === 'amber' && 'bg-amber-50 text-amber-500',
        accent === 'slate' && 'bg-slate-100 text-slate-500')}>
        <Icon size={22} />
      </div>
      {trend != null && (
        <div className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
          trendType === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600')}>
          {trendType === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {trend}
        </div>
      )}
    </div>
    <div className="mt-5">
      <p className="text-slate-500 text-xs font-semibold">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 tabular-nums">{value}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: statsRes } = useQuery({ queryKey: ['sales-stats'], queryFn: getSalesStats });
  const { data: salesData } = useQuery({ queryKey: ['dashboard-sales'], queryFn: () => getSales({ status: 'COMPLETED', ordering: '-created_at' }) });
  const { data: medsData } = useQuery({ queryKey: ['dashboard-meds'], queryFn: () => getMedications({ low_stock: true }) });

  const stats = statsRes?.data || {};
  const completedSales = salesData?.data?.results || [];
  const lowStockMeds = medsData?.data?.results || [];
  const totalMeds = medsData?.data?.count ?? lowStockMeds.length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const revenueTrend = stats.revenue_change_percent;
  const salesTrend = stats.sales_change;

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-white via-white to-pharmacy-50/30">
        <div className="flex items-center gap-5">
          <PharmacyLogo3D size="md" />
          <div>
            <p className="text-sm font-semibold text-pharmacy-600">{greeting()}, {user?.first_name || user?.username}</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">Tableau de bord</h2>
            <p className="text-slate-600 text-sm mt-1">Activité de votre pharmacie en temps réel.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-pharmacy-50 px-5 py-3 rounded-2xl border border-pharmacy-100 text-sm font-semibold text-pharmacy-800">
          <div className="w-2 h-2 bg-pharmacy-500 rounded-full animate-pulse" />
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="CA semaine" value={formatCurrency(stats.week_revenue)}
          trend={revenueTrend != null ? formatPercent(revenueTrend) : null}
          trendType={revenueTrend >= 0 ? 'up' : 'down'} icon={TrendingUp} accent="indigo" />
        <StatCard label="Ventes semaine" value={stats.week_sales_count ?? 0}
          trend={salesTrend != null ? `${salesTrend >= 0 ? '+' : ''}${salesTrend}` : null}
          trendType={salesTrend >= 0 ? 'up' : 'down'} icon={ShoppingCart} accent="violet" />
        <StatCard label="En attente caisse" value={stats.pending_count ?? 0} icon={Pill} accent="slate" />
        <StatCard label="Alertes stock" value={lowStockMeds.length}
          trend={lowStockMeds.length > 0 ? 'Action requise' : null}
          trendType="down" icon={AlertTriangle} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
            <History size={20} className="text-pharmacy-500" /> Transactions récentes
          </h3>
          <DoubleBezel className="p-0 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {completedSales.slice(0, 8).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-5 hover:bg-pharmacy-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-pharmacy-50 rounded-xl flex items-center justify-center text-pharmacy-500">
                      <ShoppingCart size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{sale.invoice_number}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Par {sale.cashier_name} · {new Date(sale.updated_at).toLocaleTimeString('fr-FR')}</p>
                    </div>
                  </div>
                  <p className="font-black text-slate-900 tabular-nums text-sm">{formatCurrency(sale.total_amount)}</p>
                </div>
              ))}
              {completedSales.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-sm">Aucune vente enregistrée.</div>
              )}
            </div>
          </DoubleBezel>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
            <AlertTriangle size={20} className="text-amber-500" /> Stock faible
          </h3>
          <div className="space-y-3">
            {lowStockMeds.slice(0, 5).map((med) => (
              <div key={med.id} className="glass-card p-4 flex items-center justify-between bg-amber-50/40 border-amber-100/80">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.category_name}</p>
                </div>
                <p className="text-xl font-black text-amber-600 tabular-nums">{med.stock_quantity}</p>
              </div>
            ))}
            {lowStockMeds.length === 0 && (
              <div className="glass-card p-8 text-center text-slate-400 text-sm">Tous les stocks sont au niveau.</div>
            )}
          </div>
          <button onClick={() => navigate('/inventory')}
            className="w-full py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-pharmacy-50 transition-all">
            Gérer le stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
