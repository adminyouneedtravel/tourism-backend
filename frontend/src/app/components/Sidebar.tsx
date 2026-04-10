// frontend/src/app/components/Sidebar.tsx
import {
  LayoutDashboard, Calendar, Building2, Users, Package,
  MapPin, Hotel, Briefcase, DollarSign, BarChart3, Settings,
  Globe, LogOut, ChevronRight, Menu, X
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../auth/apiFetch';
import type { AuthUser } from '../auth/authService';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: AuthUser | null;
  onLogout?: () => void;
}

const ADMIN_MENU = [
  { id: 'dashboard',    label: 'لوحة التحكم',      icon: LayoutDashboard },
  { id: 'bookings',     label: 'إدارة الحجوزات',    icon: Calendar },
  { id: 'packages',     label: 'الباقات السياحية',  icon: Package },
  { id: 'destinations', label: 'الوجهات السياحية',  icon: MapPin },
  { id: 'hotels',       label: 'الفنادق',            icon: Hotel },
  { id: 'extranet',     label: 'Extranet أسعار',     icon: Hotel },
  { id: 'services',     label: 'الخدمات',            icon: Briefcase },
  { id: 'agencies',     label: 'الوكالات الشريكة',  icon: Building2 },
  { id: 'customers',    label: 'المستخدمون',         icon: Users },
  { id: 'financial',    label: 'التقارير المالية',   icon: DollarSign },
  { id: 'analytics',    label: 'التحليلات',          icon: BarChart3 },
  { id: 'settings',     label: 'الإعدادات',          icon: Settings },
];

const AGENCY_MENU = [
  { id: 'dashboard',  label: 'لوحة التحكم',       icon: LayoutDashboard },
  { id: 'bookings',   label: 'حجوزاتي',            icon: Calendar },
  { id: 'packages',   label: 'الباقات المتاحة',    icon: Package },
  { id: 'customers',  label: 'عملائي',             icon: Users },
  { id: 'financial',  label: 'عمولاتي',            icon: DollarSign },
  { id: 'settings',   label: 'الإعدادات',          icon: Settings },
];

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'مدير عام',     color: 'bg-purple-500' },
  admin:       { label: 'مشرف',         color: 'bg-blue-500'   },
  agency:      { label: 'وكالة شريكة', color: 'bg-emerald-500' },
  tourist:     { label: 'سائح',         color: 'bg-gray-500'   },
};

export function Sidebar({ activeTab, setActiveTab, user, onLogout }: SidebarProps) {
  const [siteLogo, setSiteLogo]     = useState<string | null>(null);
  const [siteName, setSiteName]     = useState<string>('You Need Travel');
  const [hovered, setHovered]       = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch('/api/v1/site-settings/')
      .then(r => r.json())
      .then(d => {
        if (d.site_logo_url) setSiteLogo(d.site_logo_url);
        if (d.site_name)     setSiteName(d.site_name);
      })
      .catch(() => {});
  }, []);

  // إغلاق الموبايل عند تغيير التبويب
  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const isAdmin   = user?.role === 'super_admin' || user?.role === 'admin';
  const menuItems = isAdmin ? ADMIN_MENU : AGENCY_MENU;
  const roleConf  = user ? (ROLE_CONFIG[user.role] ?? ROLE_CONFIG.tourist) : null;
  const fullName  = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '';
  const initials  = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const expanded = hovered || mobileOpen;

  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setHovered(false), 150);
  };

  // ── Sidebar Content (shared between desktop & mobile) ──────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`border-b border-sidebar-border transition-all duration-300 ${expanded ? 'p-4' : 'p-3'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo Icon */}
          <div className="shrink-0">
            {!isAdmin && user?.agency_logo ? (
              <img
                src={user.agency_logo}
                alt={user.agency_name || 'logo'}
                className="w-9 h-9 rounded-xl object-cover border border-sidebar-border"
              />
            ) : isAdmin && siteLogo ? (
              <img
                src={siteLogo}
                alt={siteName}
                className="w-9 h-9 rounded-xl object-cover border border-sidebar-border"
              />
            ) : (
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Logo Text */}
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'w-36 opacity-100' : 'w-0 opacity-0'}`}>
            <h1 className="text-sidebar-foreground text-sm font-bold leading-none truncate whitespace-nowrap">
              {!isAdmin && user?.agency_name ? user.agency_name : siteName}
            </h1>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5 whitespace-nowrap">
              {isAdmin ? 'لوحة الإدارة' : 'بوابة الوكالة'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {menuItems.map(item => {
          const Icon     = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              title={!expanded ? item.label : undefined}
              className={`w-full flex items-center transition-all duration-200 text-sm
                ${expanded ? 'gap-3 px-4 py-2.5' : 'justify-center px-0 py-2.5'}
                ${isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
            >
              <Icon className={`shrink-0 transition-all duration-200 ${isActive ? 'w-[18px] h-[18px]' : 'w-4 h-4'}`} />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                {item.label}
              </span>
              {isActive && expanded && (
                <ChevronRight className="w-3.5 h-3.5 mr-auto shrink-0 text-sidebar-accent-foreground/60" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      
    </div>
  );

  return (
    <>
      {/* ── Mobile Toggle Button ── */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white border border-gray-200 rounded-xl shadow-lg"
      >
        {mobileOpen
          ? <X className="w-5 h-5 text-gray-700" />
          : <Menu className="w-5 h-5 text-gray-700" />
        }
      </button>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar (full width drawer) ── */}
      <div className={`
        lg:hidden fixed top-0 right-0 h-full z-50 bg-sidebar border-l border-sidebar-border shadow-2xl
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        w-64
      `}>
        <SidebarContent />
      </div>

      {/* ── Desktop Sidebar (hover to expand) ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          hidden lg:flex flex-col
          bg-sidebar border-l border-sidebar-border h-full
          transition-all duration-300 ease-in-out
          overflow-hidden shrink-0
          ${hovered ? 'w-64' : 'w-[60px]'}
        `}
      >
        <SidebarContent />
      </div>
    </>
  );
}
