import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, User, Phone, Mail,
  X, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Eye, Calendar,
  Shield, Users, UserPlus, Building2
} from 'lucide-react';
import { apiFetch } from '../auth/apiFetch';
import type { AuthUser } from '../auth/authService';

// ─── Types ────────────────────────────────────────────────
interface Agency { id: number; name: string; }

interface StaffUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  agency: number | null;
  agency_name: string | null;
  is_active: boolean;
  date_joined: string;
  password?: string;
}

type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'مدير عام',   color: 'bg-purple-100 text-purple-700' },
  { value: 'admin',       label: 'مشرف',        color: 'bg-blue-100 text-blue-700' },
  { value: 'agency',      label: 'وكالة شريكة', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'tourist',     label: 'سائح',         color: 'bg-gray-100 text-gray-600' },
];

const getRoleConf = (role: string) =>
  ADMIN_ROLES.find(r => r.value === role) ?? ADMIN_ROLES[3];

const emptyForm = () => ({
  username: '', email: '', first_name: '', last_name: '',
  phone: '', role: 'tourist', agency: '', is_active: true, password: '',
});

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

// ─── Main ─────────────────────────────────────────────────
interface Props { user?: AuthUser | null; }

export function CustomersManagement({ user }: Props = {}) {
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [users, setUsers]             = useState<StaffUser[]>([]);
  const [agencies, setAgencies]       = useState<Agency[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [viewUser, setViewUser]       = useState<StaffUser | null>(null);
  const [form, setForm]               = useState(emptyForm());

  const itemsPerPage = 10;

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        apiFetch('/api/v1/accounts/users/'),
        isAdmin ? apiFetch('/api/v1/accounts/agencies/') : Promise.resolve(null),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes?.ok) setAgencies(await aRes.json());
    } catch { addToast('error', 'تعذّر الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const filtered = users.filter(u => {
    const fullName = `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase();
    const matchSearch = fullName.includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditingUser(null);
    setForm({
      ...emptyForm(),
      // الوكالة تضيف موظفين فقط
      role: isAdmin ? 'tourist' : 'agency',
    });
    setShowModal(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditingUser(u);
    setForm({
      username: u.username, email: u.email,
      first_name: u.first_name, last_name: u.last_name,
      phone: u.phone, role: u.role,
      agency: u.agency?.toString() || '',
      is_active: u.is_active, password: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) { addToast('warning', 'اسم المستخدم مطلوب'); return; }
    if (!editingUser && !form.password) { addToast('warning', 'كلمة المرور مطلوبة'); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        username:   form.username,
        email:      form.email,
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:      form.phone,
        is_active:  form.is_active,
      };

      // Admin يحدد الدور والوكالة — الوكالة لا تحدد
      if (isAdmin) {
        payload.role = form.role;
        if (form.agency) payload.agency = Number(form.agency);
      }

      if (form.password) payload.password = form.password;

      const url    = editingUser ? `/api/v1/accounts/users/${editingUser.id}/` : '/api/v1/accounts/users/create/';
      const method = editingUser ? 'PATCH' : 'POST';
      const res    = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        addToast('error', Object.values(err).flat().join(' | ') as string);
        return;
      }
      const saved: StaffUser = await res.json();
      setUsers(p => editingUser ? p.map(u => u.id === saved.id ? saved : u) : [...p, saved]);
      setShowModal(false);
      addToast('success', editingUser
        ? `✅ تم تعديل "${saved.username}"`
        : `✅ تمت إضافة "${saved.username}"`);
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u: StaffUser) => {
    try {
      const res = await apiFetch(`/api/v1/accounts/users/${u.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (res.ok) {
        setUsers(p => p.map(s => s.id === u.id ? { ...s, is_active: !s.is_active } : s));
        addToast('success', `${!u.is_active ? '✅ تم تفعيل' : '⚠️ تم تعطيل'} "${u.username}"`);
      }
    } catch { addToast('error', 'خطأ في الاتصال'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-gray-500">جاري التحميل...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'إدارة المستخدمين' : 'موظفو الوكالة'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? 'عرض وإدارة جميع مستخدمي النظام'
              : `إدارة موظفي ${user?.agency_name || 'الوكالة'} — ${users.length} موظف`
            }
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
          <UserPlus className="w-4 h-4"/>
          {isAdmin ? 'إضافة مستخدم' : 'إضافة موظف'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isAdmin ? (
          ADMIN_ROLES.map(r => (
            <div key={r.value} className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.color}`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === r.value).length}</p>
                <p className="text-sm text-gray-500">{r.label}</p>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                <p className="text-sm text-gray-500">إجمالي الموظفين</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.is_active).length}</p>
                <p className="text-sm text-gray-500">موظفون نشطون</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{users.filter(u => !u.is_active).length}</p>
                <p className="text-sm text-gray-500">موظفون معطّلون</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 truncate text-base">{user?.agency_name || '—'}</p>
                <p className="text-sm text-gray-500">الوكالة</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder={isAdmin ? 'ابحث باسم المستخدم أو البريد...' : 'ابحث باسم الموظف...'}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pr-10 pl-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        {isAdmin && (
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="border p-2.5 rounded-xl text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">كل الأدوار</option>
            {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {(isAdmin
                ? ['المستخدم', 'البريد الإلكتروني', 'الدور', 'الوكالة', 'تاريخ الانضمام', 'الحالة', 'إجراءات']
                : ['الموظف', 'البريد الإلكتروني', 'الهاتف', 'تاريخ الانضمام', 'الحالة', 'إجراءات']
              ).map(h => (
                <th key={h} className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">
                  {isAdmin ? 'لا توجد نتائج' : 'لا يوجد موظفون بعد — اضغط "إضافة موظف" للبدء'}
                </p>
              </td></tr>
            ) : paginated.map(u => {
              const roleConf = getRoleConf(u.role);
              const fullName = `${u.first_name} ${u.last_name}`.trim() || u.username;
              const initials = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.email || '—'}</td>
                  {isAdmin ? (
                    <>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleConf.color}`}>{roleConf.label}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{u.agency_name || '—'}</td>
                    </>
                  ) : (
                    <td className="px-5 py-3 text-sm text-gray-600" dir="ltr">{u.phone || '—'}</td>
                  )}
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(u.date_joined).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(u)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors
                        ${u.is_active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                      {u.is_active ? 'نشط' : 'معطّل'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setViewUser(u)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Eye className="w-4 h-4"/></button>
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">
            عرض {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage, filtered.length)} من {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage===1}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4"/> السابق
            </button>
            {Array.from({length: Math.min(totalPages, 5)}, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium ${currentPage===p?'bg-blue-600 text-white':'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              التالي <ChevronLeft className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{isAdmin ? 'تفاصيل المستخدم' : 'تفاصيل الموظف'}</h2>
              <button onClick={() => setViewUser(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                {`${viewUser.first_name?.[0]||''}${viewUser.last_name?.[0]||''}`.toUpperCase() || viewUser.username[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold">{`${viewUser.first_name} ${viewUser.last_name}`.trim() || viewUser.username}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleConf(viewUser.role).color}`}>
                  {getRoleConf(viewUser.role).label}
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { icon: <User className="w-4 h-4"/>,     label: 'اسم المستخدم',       value: viewUser.username },
                { icon: <Mail className="w-4 h-4"/>,     label: 'البريد الإلكتروني',  value: viewUser.email || '—' },
                { icon: <Phone className="w-4 h-4"/>,    label: 'الهاتف',              value: viewUser.phone || '—' },
                { icon: <Calendar className="w-4 h-4"/>, label: 'تاريخ الانضمام',     value: new Date(viewUser.date_joined).toLocaleDateString('ar-SA') },
                ...(isAdmin && viewUser.agency_name ? [{ icon: <Building2 className="w-4 h-4"/>, label: 'الوكالة', value: viewUser.agency_name }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400">{item.icon}</span>
                  <span className="text-gray-500 w-32">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setViewUser(null)} className="w-full mt-6 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إغلاق</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">
                {editingUser
                  ? (isAdmin ? 'تعديل المستخدم' : 'تعديل الموظف')
                  : (isAdmin ? 'إضافة مستخدم جديد' : 'إضافة موظف جديد')}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الأول</label>
                  <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="محمد"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم العائلة</label>
                  <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="أحمد"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم *</label>
                <input value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="username" dir="ltr"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="email@example.com" dir="ltr"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الهاتف</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="+60 12 345 6789" dir="ltr"/>
              </div>

              {/* الدور والوكالة — Admin فقط */}
              {isAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">الدور</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ADMIN_ROLES.map(r => (
                        <button key={r.value} type="button" onClick={() => setForm({...form, role: r.value})}
                          className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all text-right
                            ${form.role === r.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(form.role === 'agency') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">الوكالة</label>
                      <select value={form.agency} onChange={e => setForm({...form, agency: e.target.value})}
                        className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                        <option value="">-- اختر الوكالة --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* الوكالة — تضيف موظفين فقط بدون خيار الدور */}
              {!isAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-500 shrink-0"/>
                  <div>
                    <p className="text-sm font-medium text-blue-800">سيتم إضافة الموظف لوكالة {user?.agency_name}</p>
                    <p className="text-xs text-blue-500">الدور: موظف وكالة</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editingUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على القديمة)' : 'كلمة المرور *'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="••••••••" dir="ltr"/>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}
                  className="w-5 h-5 accent-blue-600 rounded"/>
                <span className="text-sm font-medium text-gray-700">الحساب نشط</span>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin"/>جاري الحفظ...</>
                  : <><UserPlus className="w-4 h-4"/>{editingUser ? 'حفظ التعديلات' : (isAdmin ? 'إضافة المستخدم' : 'إضافة الموظف')}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}