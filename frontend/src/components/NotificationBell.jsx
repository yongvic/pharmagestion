import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  Package,
  Info,
  Banknote,
  Loader2,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';
import { cn } from './UI';

const TYPE_CONFIG = {
  SALE_PENDING: { icon: ShoppingCart, color: 'text-amber-600 bg-amber-50' },
  SALE_COMPLETED: { icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
  LOW_STOCK: { icon: Package, color: 'text-orange-600 bg-orange-50' },
  INFO: { icon: Info, color: 'text-pharmacy-600 bg-pharmacy-50' },
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: getUnreadCount,
    refetchInterval: 10000,
  });

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: open,
    refetchInterval: open ? 10000 : false,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const unreadCount = countData?.data?.count || 0;
  const notifications = notifData?.data?.results || notifData?.data || [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all",
          open
            ? "text-pharmacy-600 bg-pharmacy-50"
            : "text-slate-500 hover:text-pharmacy-600 hover:bg-pharmacy-50"
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-premium border border-slate-200/80 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold text-pharmacy-600 hover:text-pharmacy-700 transition-colors disabled:opacity-50"
              >
                <CheckCheck size={14} />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-pharmacy-500" size={24} />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.INFO;
                const Icon = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-5 py-4 border-b border-slate-50 transition-colors hover:bg-pharmacy-50/40",
                      !notif.is_read && "bg-pharmacy-50/20"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl shrink-0", config.color)}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          notif.is_read ? "font-medium text-slate-700" : "font-bold text-slate-900"
                        )}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-pharmacy-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{formatTime(notif.created_at)}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <Bell size={32} className="text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">Aucune notification</p>
                <p className="text-xs text-slate-400 mt-1">Vos alertes personnelles apparaîtront ici.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
