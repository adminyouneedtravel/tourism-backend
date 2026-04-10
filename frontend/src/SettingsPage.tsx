import { useState, useEffect } from 'react';
import {
  User, Lock, Bell, Globe, Shield, Building2,
  Save, Eye, EyeOff, Loader2, CheckCircle2,
  XCircle, AlertTriangle, X, Camera, Download,
  Smartphone, LogOut, Clock, CreditCard, Mail,
  Phone, Palette, FileText, BarChart2, QrCode,
  Percent, Settings, ChevronLeft, Moon, Sun
} from 'lucide-react';
import { apiFetch, BASE } from '../auth/apiFetch';
import { clearAuth } from '../auth/authService';
import type { AuthUser } from '../auth/authService';

// ─── Types ────────────────────────────────────────────────
interface Props { user: AuthUser; onLogout: () => void; onUserUpdate: (u: AuthUser) => void; }
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }
type TabId = 'profile' | 'password' | 'agency' | 'system' | 'notifications' | 'security' | 'export' | 'commission';

// ─── Toast ────────────────────────────────────────────────
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
          ${t.type==='success'?'bg-emerald-500':t.type==='error'?'bg-red-500':'bg-amber-500'}`}>
          {t.type==='success'?<CheckCircle2 className="w-5 h-5 shrink-0"/>
            :t.type==='error'?<XCircle className="w-5 h-5 shrink-0"/>
            :<AlertTriangle className="w-5 h-5 shrink-0"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={()=>remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100"/></button>
        </div>
      ))}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────
function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="font-bold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────
function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6 left-0.5' : 'left-0.5'}`}/>
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export function SettingsPage({ user, onLogout, onUserUpdate }: Props) {
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [saving, setSaving]       = useState(false);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // ─── Profile State ────────────────────────────────────
  const [profile, setProfile] = useState({
    first_name: user.first_name || '',
    last_name:  user.last_name  || '',
    email:      user.email      || '',
    phone:      user.phone      || '',
  });
  const [avatarFile, setAvatarFile]     = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BASE}${user.avatar}`) : null
  );

  // ─── Password State ───────────────────────────────────
  const [pwd, setPwd]         = useState({ old: '', new1: '', new2: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new1: false, new2: false });

  // ─── Agency State ─────────────────────────────────────
  const [agencyData, setAgencyData] = useState<any>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [agencyForm, setAgencyForm] = useState({
    name: '', phone: '', email: '', address: '', currency: 'MYR',
  });
  const [agencyLogo, setAgencyLogo]     = useState<File | null>(null);
  const [agencyLogoPreview, setAgencyLogoPreview] = useState<string | null>(null);

  // ─── System State (Admin) ─────────────────────────────
  const [system, setSystem] = useState({
    default_currency:    'MYR',
    default_commission:  '10.00',
    booking_expiry_hours: '48',
    min_nights:          '1',
    cancellation_fee:    '0',
    company_name:        'You Need Travel',
    company_email:       '',
    company_phone:       '',
    company_address:     '',
  });

  // ─── Notifications State ──────────────────────────────
  const [notif, setNotif] = useState({
    new_booking:       true,
    pending_booking:   true,
    confirmed_booking: false,
    cancelled_booking: true,
    new_agency:        true,
    daily_report:      false,
    whatsapp_notif:    false,
    whatsapp_number:   '',
  });

  // ─── Security State ───────────────────────────────────
  const [sessions] = useState([
    { device: 'MacBook Pro — Chrome', location: 'كوالالمبور', time: 'الآن', current: true },
    { device: 'iPhone 15 — Safari',   location: 'كوالالمبور', time: 'منذ ساعتين', current: false },
  ]);

  // ─── Fetch Agency ─────────────────────────────────────
  useEffect(() => {
    if (user.agency && (activeTab === 'agency' || activeTab === 'commission')) {
      setAgencyLoading(true);
      apiFetch(`/api/v1/accounts/agencies/${user.agency}/`)
        .then(r => r.json())
        .then(d => {
          setAgencyData(d);
          setAgencyForm({
            name:     d.name     || '',
            phone:    d.phone    || '',
            email:    d.email    || '',
            address:  d.address  || '',
            currency: d.currency || 'MYR',
          });
          if (d.logo) setAgencyLogoPreview(d.logo.startsWith('http') ? d.logo : `${BASE}${d.logo}`);
        })
        .finally(() => setAgencyLoading(false));
    }
  }, [activeTab, user.agency]);

  // ─── Save Profile ─────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('first_name', profile.first_name);
      fd.append('last_name',  profile.last_name);
      fd.append('email',      profile.email);
      fd.append('phone',      profile.phone);
      if (avatarFile) fd.append('avatar', avatarFile);

      const res = await apiFetch('/api/v1/accounts/auth/me/', { method: 'PATCH', body: fd });
      if (!res.ok) { addToast('error', 'فشل حفظ الملف الشخصي'); return; }
      const updated = await res.json();
      onUserUpdate({ ...user, ...updated });
      localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
      addToast('success', '✅ تم حفظ الملف الشخصي بنجاح');
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  // ─── Save Password ────────────────────────────────────
  const savePassword = async () => {
    if (!pwd.old || !pwd.new1 || !pwd.new2) { addToast('warning', 'يرجى ملء جميع الحقول'); return; }
    if (pwd.new1 !== pwd.new2) { addToast('warning', 'كلمتا المرور الجديدتان غير متطابقتين'); return; }
    if (pwd.new1.length < 8) { addToast('warning', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    setSaving(true);
    try {
      const res = await apiFetch('/api/v1/accounts/auth/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: pwd.old, new_password: pwd.new1 }),
      });
      if (!res.ok) { addToast('error', 'كلمة المرور الحالية غير صحيحة'); return; }
      setPwd({ old: '', new1: '', new2: '' });
      addToast('success', '✅ تم تغيير كلمة المرور بنجاح');
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  // ─── Save Agency ──────────────────────────────────────
  const saveAgency = async () => {
    if (!user.agency) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(agencyForm).forEach(([k, v]) => fd.append(k, v));
      if (agencyLogo) fd.append('logo', agencyLogo);

      const res = await apiFetch(`/api/v1/accounts/agencies/${user.agency}/`, { method: 'PUT', body: fd });
      if (!res.ok) { addToast('error', 'فشل حفظ بيانات الوكالة'); return; }
      addToast('success', '✅ تم حفظ بيانات الوكالة بنجاح');
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  // ─── Export ───────────────────────────────────────────
  const exportData = async (type: string) => {
    addToast('warning', `⏳ جاري تصدير ${type}...`);
    try {
      const res = await apiFetch(`/api/v1/bookings/?format=json`);
      if (!res.ok) { addToast('error', 'فشل التصدير'); return; }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${type}-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', `✅ تم تصدير ${type} بنجاح`);
    } catch { addToast('error', 'خطأ في التصدير'); }
  };

  // ─── Tabs Config ──────────────────────────────────────
  const ADMIN_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',       label: 'الملف الشخصي',   icon: <User className="w-4 h-4"/> },
    { id: 'password',      label: 'كلمة المرور',     icon: <Lock className="w-4 h-4"/> },
    { id: 'system',        label: 'إعدادات النظام',  icon: <Settings className="w-4 h-4"/> },
    { id: 'notifications', label: 'الإشعارات',       icon: <Bell className="w-4 h-4"/> },
    { id: 'security',      label: 'الأمان',           icon: <Shield className="w-4 h-4"/> },
    { id: 'export',        label: 'تصدير البيانات',  icon: <Download className="w-4 h-4"/> },
  ];

  const AGENCY_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',       label: 'الملف الشخصي',   icon: <User className="w-4 h-4"/> },
    { id: 'password',      label: 'كلمة المرور',     icon: <Lock className="w-4 h-4"/> },
    { id: 'agency',        label: 'بيانات الوكالة',  icon: <Building2 className="w-4 h-4"/> },
    { id: 'commission',    label: 'العمولة والأداء', icon: <Percent className="w-4 h-4"/> },
    { id: 'notifications', label: 'الإشعارات',       icon: <Bell className="w-4 h-4"/> },
    { id: 'security',      label: 'الأمان',           icon: <Shield className="w-4 h-4"/> },
  ];

  const tabs = isAdmin ? ADMIN_TABS : AGENCY_TABS;
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;
  const initials = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const CURRENCIES = ['MYR', 'USD', 'EUR', 'SAR', 'AED', 'DZD'];

  return (
    <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة حسابك وتفضيلاتك</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className="lg:w-64 shrink-0 space-y-3">

          {/* User Card */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              {avatarPreview
                ? <img src={avatarPreview} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow" alt="avatar"/>
                : <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow">{initials}</div>
              }
              <label className="absolute bottom-0 left-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white"/>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] || null;
                    setAvatarFile(f);
                    if (f) { const r = new FileReader(); r.onload = e => setAvatarPreview(e.target?.result as string); r.readAsDataURL(f); }
                  }}/>
              </label>
            </div>
            <p className="font-bold text-gray-900 text-sm">{fullName}</p>
            <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
            {user.agency_name && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center justify-center gap-1">
                <Building2 className="w-3 h-3"/> {user.agency_name}
              </p>
            )}
          </div>

          {/* Nav */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b last:border-0
                  ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'}`}>
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <ChevronLeft className="w-4 h-4 mr-auto"/>}
              </button>
            ))}
          </div>

          {/* Logout */}
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-medium hover:bg-red-100 transition-colors">
            <LogOut className="w-4 h-4"/> تسجيل الخروج
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <>
              <SectionCard title="المعلومات الشخصية" description="اسمك وبريدك الإلكتروني وهاتفك">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="الاسم الأول">
                      <input value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="محمد"/>
                    </Field>
                    <Field label="اسم العائلة">
                      <input value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="أحمد"/>
                    </Field>
                  </div>
                  <Field label="البريد الإلكتروني">
                    <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})}
                      className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                  </Field>
                  <Field label="رقم الهاتف">
                    <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                      className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr" placeholder="+60 12 345 6789"/>
                  </Field>
                  <button onClick={saveProfile} disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    حفظ التغييرات
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="معلومات الحساب" description="بيانات لا يمكن تعديلها">
                <div className="space-y-3">
                  {[
                    { label: 'اسم المستخدم', value: user.username },
                    { label: 'الدور', value: user.role === 'super_admin' ? 'مدير عام' : user.role === 'admin' ? 'مشرف' : 'وكالة شريكة' },
                    { label: 'العملة', value: user.agency_currency || 'MYR' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-medium text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Password ── */}
          {activeTab === 'password' && (
            <SectionCard title="تغيير كلمة المرور" description="يُنصح بتغيير كلمة المرور بانتظام">
              <div className="space-y-4 max-w-md">
                {[
                  { key: 'old',  label: 'كلمة المرور الحالية' },
                  { key: 'new1', label: 'كلمة المرور الجديدة' },
                  { key: 'new2', label: 'تأكيد كلمة المرور الجديدة' },
                ].map(f => (
                  <Field key={f.key} label={f.label}>
                    <div className="relative">
                      <input
                        type={showPwd[f.key as keyof typeof showPwd] ? 'text' : 'password'}
                        value={pwd[f.key as keyof typeof pwd]}
                        onChange={e => setPwd({...pwd, [f.key]: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-4 pl-10"
                        dir="ltr"/>
                      <button onClick={() => setShowPwd({...showPwd, [f.key]: !showPwd[f.key as keyof typeof showPwd]})}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd[f.key as keyof typeof showPwd] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </Field>
                ))}

                {/* Password Strength */}
                {pwd.new1 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">قوة كلمة المرور:</p>
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                          pwd.new1.length >= i * 2
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-blue-400' : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}/>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={savePassword} disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4"/>}
                  تغيير كلمة المرور
                </button>
              </div>
            </SectionCard>
          )}

          {/* ── Agency Data ── */}
          {activeTab === 'agency' && !isAdmin && (
            agencyLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 text-blue-500 animate-spin"/></div>
            ) : (
              <>
                <SectionCard title="معلومات الوكالة" description="البيانات الأساسية لوكالتك">
                  <div className="space-y-4">
                    {/* Logo */}
                    <Field label="شعار الوكالة">
                      <label className="block cursor-pointer">
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0] || null;
                            setAgencyLogo(f);
                            if (f) { const r = new FileReader(); r.onload = e => setAgencyLogoPreview(e.target?.result as string); r.readAsDataURL(f); }
                          }}/>
                        {agencyLogoPreview
                          ? <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-300 hover:opacity-80 transition-opacity">
                              <img src={agencyLogoPreview} className="w-full h-full object-cover" alt="logo"/>
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white"/>
                              </div>
                            </div>
                          : <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                              <Building2 className="w-8 h-8 text-gray-300 mb-1"/>
                              <span className="text-xs text-gray-400">رفع شعار</span>
                            </div>
                        }
                      </label>
                    </Field>
                    <Field label="اسم الوكالة">
                      <input value={agencyForm.name} onChange={e => setAgencyForm({...agencyForm, name: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="الهاتف">
                        <input value={agencyForm.phone} onChange={e => setAgencyForm({...agencyForm, phone: e.target.value})}
                          className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                      </Field>
                      <Field label="البريد الإلكتروني">
                        <input type="email" value={agencyForm.email} onChange={e => setAgencyForm({...agencyForm, email: e.target.value})}
                          className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                      </Field>
                    </div>
                    <Field label="العنوان">
                      <textarea value={agencyForm.address} onChange={e => setAgencyForm({...agencyForm, address: e.target.value})} rows={2}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"/>
                    </Field>
                    <Field label="العملة المفضلة">
                      <select value={agencyForm.currency} onChange={e => setAgencyForm({...agencyForm, currency: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <button onClick={saveAgency} disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                      حفظ بيانات الوكالة
                    </button>
                  </div>
                </SectionCard>

                {/* QR Code */}
                <SectionCard title="بطاقة الوكالة" description="شارك رابط وكالتك مع عملائك">
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center border">
                      <QrCode className="w-16 h-16 text-gray-300"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 mb-1">رابط الوكالة</p>
                      <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2 mb-3">
                        <span className="text-sm text-gray-600 flex-1 truncate" dir="ltr">
                          https://youneedtravel.com/agency/{user.agency}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">امسح QR Code لمشاركة صفحة وكالتك</p>
                    </div>
                  </div>
                </SectionCard>
              </>
            )
          )}

          {/* ── Commission (Agency) ── */}
          {activeTab === 'commission' && !isAdmin && (
            <>
              <SectionCard title="نسبة العمولة" description="نسبة عمولتك المحددة من الإدارة">
                <div className="space-y-4">
                  <div className="bg-gradient-to-l from-amber-500 to-amber-400 rounded-2xl p-6 text-white text-center">
                    <p className="text-5xl font-bold mb-1">{agencyData?.commission_rate || '—'}%</p>
                    <p className="text-amber-100 text-sm">نسبة عمولتك الحالية</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0"/>
                      نسبة العمولة تُحدد من قِبَل الإدارة ولا يمكن تعديلها. للاستفسار تواصل معنا.
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="تقرير الأداء الشهري" description="ملخص نشاطك هذا الشهر">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'إجمالي الحجوزات', value: '—', color: 'bg-blue-50 text-blue-700' },
                    { label: 'الحجوزات المؤكدة', value: '—', color: 'bg-emerald-50 text-emerald-700' },
                    { label: 'العمولة المحققة', value: '—', color: 'bg-amber-50 text-amber-700' },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-2xl p-4 text-center ${s.color}`}>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">سيتم ربط هذه الإحصائيات بالـ API قريباً</p>
              </SectionCard>
            </>
          )}

          {/* ── System (Admin) ── */}
          {activeTab === 'system' && isAdmin && (
            <>
              <SectionCard title="إعدادات الحجوزات" description="ضبط سلوك نظام الحجز">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="العملة الافتراضية">
                      <select value={system.default_currency} onChange={e => setSystem({...system, default_currency: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="انتهاء الحجز المعلق (ساعة)" hint="يُلغى الحجز تلقائياً بعد هذه المدة">
                      <input type="number" value={system.booking_expiry_hours} onChange={e => setSystem({...system, booking_expiry_hours: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                    </Field>
                    <Field label="الحد الأدنى للليالي">
                      <input type="number" value={system.min_nights} onChange={e => setSystem({...system, min_nights: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                    </Field>
                    <Field label="رسوم الإلغاء %" hint="نسبة تُحتجز عند إلغاء الحجز المؤكد">
                      <input type="number" value={system.cancellation_fee} onChange={e => setSystem({...system, cancellation_fee: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                    </Field>
                  </div>
                  <Field label="نسبة العمولة الافتراضية للوكالات الجديدة %" hint="تُطبق على كل وكالة جديدة تنضم للنظام">
                    <input type="number" value={system.default_commission} onChange={e => setSystem({...system, default_commission: e.target.value})}
                      className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-w-xs" dir="ltr"/>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="معلومات الشركة" description="البيانات التي تظهر للعملاء والوكالات">
                <div className="space-y-4">
                  <Field label="اسم الشركة">
                    <input value={system.company_name} onChange={e => setSystem({...system, company_name: e.target.value})}
                      className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="البريد الإلكتروني">
                      <input type="email" value={system.company_email} onChange={e => setSystem({...system, company_email: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                    </Field>
                    <Field label="الهاتف">
                      <input value={system.company_phone} onChange={e => setSystem({...system, company_phone: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr"/>
                    </Field>
                  </div>
                  <Field label="العنوان">
                    <textarea value={system.company_address} onChange={e => setSystem({...system, company_address: e.target.value})} rows={2}
                      className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder="كوالالمبور، ماليزيا"/>
                  </Field>
                  <button onClick={() => addToast('success', '✅ تم حفظ إعدادات النظام')} disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    حفظ الإعدادات
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <>
              <SectionCard title="إشعارات الحجوزات" description="تحكم في الإشعارات التي تصلك">
                <div>
                  <Toggle checked={notif.new_booking}       onChange={v => setNotif({...notif, new_booking: v})}       label="حجز جديد"          description="عند وصول طلب حجز جديد"/>
                  <Toggle checked={notif.pending_booking}   onChange={v => setNotif({...notif, pending_booking: v})}   label="حجز معلق"          description="تذكير بالحجوزات المعلقة"/>
                  <Toggle checked={notif.confirmed_booking} onChange={v => setNotif({...notif, confirmed_booking: v})} label="تأكيد الحجز"       description="عند تأكيد حجز"/>
                  <Toggle checked={notif.cancelled_booking} onChange={v => setNotif({...notif, cancelled_booking: v})} label="إلغاء الحجز"       description="عند إلغاء حجز"/>
                  {isAdmin && (
                    <>
                      <Toggle checked={notif.new_agency}   onChange={v => setNotif({...notif, new_agency: v})}        label="وكالة جديدة"       description="عند انضمام وكالة شريكة جديدة"/>
                      <Toggle checked={notif.daily_report} onChange={v => setNotif({...notif, daily_report: v})}      label="تقرير يومي"        description="ملخص يومي للنشاط"/>
                    </>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="إشعارات WhatsApp" description="استقبال الإشعارات على هاتفك">
                <div className="space-y-4">
                  <Toggle checked={notif.whatsapp_notif} onChange={v => setNotif({...notif, whatsapp_notif: v})} label="تفعيل إشعارات WhatsApp"/>
                  {notif.whatsapp_notif && (
                    <Field label="رقم WhatsApp" hint="أدخل الرقم مع رمز الدولة">
                      <input value={notif.whatsapp_number} onChange={e => setNotif({...notif, whatsapp_number: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-w-sm" dir="ltr" placeholder="+60 12 345 6789"/>
                    </Field>
                  )}
                  <button onClick={() => addToast('success', '✅ تم حفظ إعدادات الإشعارات')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                    <Save className="w-4 h-4"/> حفظ
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <>
              <SectionCard title="الجلسات النشطة" description="الأجهزة المتصلة بحسابك">
                <div className="space-y-3">
                  {sessions.map((s, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${s.current ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-400 shrink-0"/>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{s.device}</p>
                          <p className="text-xs text-gray-400">{s.location} • {s.time}</p>
                        </div>
                      </div>
                      {s.current
                        ? <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">الجلسة الحالية</span>
                        : <button className="text-xs text-red-500 hover:text-red-700 font-medium">إنهاء</button>
                      }
                    </div>
                  ))}
                </div>
                <button onClick={() => addToast('warning', '⚠️ تم إنهاء جميع الجلسات الأخرى')}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50">
                  <LogOut className="w-4 h-4"/> إنهاء جميع الجلسات الأخرى
                </button>
              </SectionCard>

              <SectionCard title="سجل النشاط" description="آخر عمليات الدخول">
                <div className="space-y-2">
                  {[
                    { action: 'تسجيل دخول ناجح', time: 'الآن', device: 'MacBook Pro', color: 'text-emerald-600' },
                    { action: 'تغيير كلمة المرور', time: 'منذ يومين', device: 'MacBook Pro', color: 'text-blue-600' },
                    { action: 'تسجيل دخول ناجح', time: 'منذ أسبوع', device: 'iPhone 15', color: 'text-emerald-600' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0"/>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.color}`}>{item.action}</p>
                        <p className="text-xs text-gray-400">{item.device}</p>
                      </div>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="منطقة الخطر" description="إجراءات لا يمكن التراجع عنها">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-red-800">تسجيل الخروج من كل الأجهزة</p>
                      <p className="text-xs text-red-500">ستحتاج إلى تسجيل الدخول مجدداً</p>
                    </div>
                    <button onClick={() => { clearAuth(); onLogout(); }}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Export (Admin) ── */}
          {activeTab === 'export' && isAdmin && (
            <SectionCard title="تصدير البيانات" description="تحميل بيانات النظام بصيغ مختلفة">
              <div className="space-y-3">
                {[
                  { label: 'تصدير الحجوزات',        desc: 'جميع الحجوزات بتفاصيلها',       icon: <FileText className="w-5 h-5 text-blue-600"/>,    color: 'bg-blue-50',   key: 'الحجوزات' },
                  { label: 'تصدير الباقات',          desc: 'قائمة الباقات السياحية',         icon: <Globe className="w-5 h-5 text-emerald-600"/>,    color: 'bg-emerald-50', key: 'الباقات' },
                  { label: 'تصدير المستخدمين',       desc: 'قائمة المستخدمين والوكالات',    icon: <User className="w-5 h-5 text-purple-600"/>,      color: 'bg-purple-50',  key: 'المستخدمين' },
                  { label: 'تصدير التقارير المالية', desc: 'إيرادات وعمولات الوكالات',      icon: <BarChart2 className="w-5 h-5 text-amber-600"/>,  color: 'bg-amber-50',   key: 'التقارير المالية' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>{item.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => exportData(item.key)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                      <Download className="w-4 h-4"/> تحميل
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

        </div>
      </div>
    </div>
  );
}