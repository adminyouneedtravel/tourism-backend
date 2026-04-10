// frontend/src/app/components/Header.tsx

import { Search, Bell, Mail, LogOut, ChevronDown, User, Shield, Building2, CheckCheck, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiFetch, BASE } from '../auth/apiFetch';
import type { AuthUser } from '../auth/authService';

interface Props {
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigate?: (tab: string) => void;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  super_admin: { label: 'مدير عام',    color: 'bg-purple-100 text-purple-700',   icon: <Shield className="w-3 h-3" /> },
  admin:       { label: 'مشرف',        color: 'bg-blue-100 text-blue-700',       icon: <Shield className="w-3 h-3" /> },
  agency:      { label: 'وكالة شريكة', color: 'bg-emerald-100 text-emerald-700', icon: <Building2 className="w-3 h-3" /> },
  tourist:     { label: 'سائح',        color: 'bg-gray-100 text-gray-700',       icon: <User className="w-3 h-3" /> },
};

const NOTIF_ICONS: Record<string, string> = {
  new_booking:     '📋',
  booking_status:  '🔄',
  new_agency:      '🏢',
  agency_approved: '✅',
  agency_rejected: '❌',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'الآن';
  if (diff < 3600)  return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function Header({ user, onLogout, onNavigate }: Props) {
  const [showMenu, setShowMenu]           = useState(false);
  const [showNotif, setShowNotif]         = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loadingNotif, setLoadingNotif]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const roleConf = user ? (ROLE_CONFIG[user.role] ?? ROLE_CONFIG.tourist) : null;
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '';
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${BASE}${user.avatar}`)
    : null;

  // ── Polling كل 30 ثانية ───────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await apiFetch('/api/v1/notifications/unread-count/');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ── جلب الإشعارات عند فتح الـ Dropdown ───────────────
  const openNotifications = async () => {
    setShowNotif(!showNotif);
    setShowMenu(false);
    if (!showNotif) {
      setLoadingNotif(true);
      try {
        const res = await apiFetch('/api/v1/notifications/');
        if (res.ok) setNotifications(await res.json());
      } catch {}
      finally { setLoadingNotif(false); }
    }
  };

  // ── تعليم إشعار كمقروء ───────────────────────────────
  const markRead = async (id: number) => {
    await apiFetch(`/api/v1/notifications/${id}/mark-read/`, { method: 'POST' });
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(p => Math.max(0, p - 1));
  };

  // ── تعليم الكل كمقروء ────────────────────────────────
  const markAllRead = async () => {
    await apiFetch('/api/v1/notifications/mark-all-read/', { method: 'POST' });
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between relative z-30">

      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* spacer للموبايل (بسبب زر الـ Sidebar) */}
        <div className="w-10 lg:hidden shrink-0" />
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن حجز، عميل، أو وجهة..."
            className="w-full h-10 pr-10 pl-4 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            dir="rtl"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">

        {/* Mail */}
        <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
          <Mail className="w-5 h-5 text-foreground" />
        </button>

        {/* Bell + Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifications}
            className="relative p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-foreground'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotif && (
            <>
              <div className="fixed inset-0" onClick={() => setShowNotif(false)} />
              <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50" dir="rtl">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">الإشعارات</h3>
                    {unreadCount > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} جديد
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> تعليم الكل كمقروء
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotif ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <Bell className="w-10 h-10 mb-2 text-gray-200" />
                      <p className="text-sm">لا توجد إشعارات</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={(e) => { e.stopPropagation(); if (!n.is_read) markRead(n.id); }}
                        className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors
                          ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">
                          {NOTIF_ICONS[n.type] || '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium leading-snug ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t bg-gray-50 text-center">
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      عرض جميع الإشعارات
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        {user && <div className="w-px h-6 bg-border mx-1" />}

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => { setShowMenu(!showMenu); setShowNotif(false); }}
              className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl hover:bg-accent transition-colors"
            >
              {/* Avatar */}
              {avatarSrc ? (
                <img src={avatarSrc} className="w-8 h-8 rounded-full object-cover border-2 border-border shrink-0" alt={fullName} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
              )}

              {/* Name + Role — hidden on small screens */}
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-foreground leading-none mb-0.5">{fullName}</p>
                <div className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${roleConf?.color}`}>
                  {roleConf?.icon}
                  {roleConf?.label}
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform hidden md:block ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                <div className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50" dir="rtl">

                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-border bg-accent/30">
                    <div className="flex items-center gap-3">
                      {avatarSrc ? (
                        <img src={avatarSrc} className="w-10 h-10 rounded-full object-cover border shrink-0" alt={fullName} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email || user.username}</p>
                        {user.agency_name && (
                          <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {user.agency_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Link */}
                  <button
                    onClick={() => { setShowMenu(false); onNavigate?.('settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors border-b border-border"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    الملف الشخصي والإعدادات
                  </button>

                  {/* Settings shortcut (admin only) */}
                  {(user.role === 'super_admin' || user.role === 'admin') && (
                    <button
                      onClick={() => { setShowMenu(false); onNavigate?.('settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors border-b border-border"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      إعدادات النظام
                    </button>
                  )}

                  {/* Logout */}
                  <button
                    onClick={() => { setShowMenu(false); onLogout?.(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
