import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Building2, Phone, Mail,
  X, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Globe, Percent, Users, Clock, Check, Ban
} from 'lucide-react';
import { apiFetch } from '../auth/apiFetch';

// ─── Types ────────────────────────────────────────────────
interface Agency {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  commission_rate: string;
  currency: string;
  is_active: boolean;
  is_approved: boolean;
  employees_count: number;
  created_at: string;
}

type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }
type ActiveTab = 'active' | 'pending';

const emptyForm = () => ({
  name: '', email: '', phone: '', address: '',
  commission_rate: '10.00', currency: 'MYR', is_active: true,
});

// ─── Toast ────────────────────────────────────────────────
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
          ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
           t.type === 'error'   ? <XCircle className="w-5 h-5 shrink-0" /> :
           <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">تعطيل الوكالة</h3>
        <p className="text-gray-500 mb-6">هل أنت متأكد من تعطيل <span className="font-semibold text-gray-800">"{name}"</span>؟</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50">إلغاء</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} تعطيل
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────
function RejectModal({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: (reason: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 p-8 shadow-2xl">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ban className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold mb-1 text-center">رفض طلب التسجيل</h3>
        <p className="text-gray-500 text-sm text-center mb-4">
          سيتم إشعار <span className="font-semibold text-gray-800">"{name}"</span> برفض طلبها
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="سبب الرفض (اختياري)..."
          className="w-full border p-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} رفض الطلب
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pending Card ──────────────────────────────────────────
function PendingAgencyCard({ agency, onApprove, onReject, actionLoading }: {
  agency: Agency;
  onApprove: (id: number) => void;
  onReject: (agency: Agency) => void;
  actionLoading: number | null;
}) {
  return (
    <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all">
      <div className="flex items-start gap-3 mb-4">
        {agency.logo ? (
          <img src={agency.logo} className="w-12 h-12 rounded-xl object-cover border" alt={agency.name} />
        ) : (
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-amber-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate">{agency.name}</h3>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 mt-0.5">
            <Clock className="w-3 h-3" /> بانتظار المراجعة
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-gray-500 mb-4">
        {agency.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span dir="ltr">{agency.phone}</span>
          </div>
        )}
        {agency.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{agency.email}</span>
          </div>
        )}
        {agency.address && (
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{agency.address}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 mb-4">
        تاريخ الطلب: {new Date(agency.created_at).toLocaleDateString('ar-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onApprove(agency.id)}
          disabled={actionLoading === agency.id}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-60 transition-colors"
        >
          {actionLoading === agency.id
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Check className="w-4 h-4" />}
          قبول
        </button>
        <button
          onClick={() => onReject(agency)}
          disabled={actionLoading === agency.id}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition-colors"
        >
          <Ban className="w-4 h-4" /> رفض
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export function AgenciesManagement() {
  const [agencies, setAgencies]         = useState<Agency[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [activeTab, setActiveTab]       = useState<ActiveTab>('active');
  const [showModal, setShowModal]       = useState(false);
  const [editingAgency, setEditingAgency]   = useState<Agency | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<Agency | null>(null);
  const [rejectTarget, setRejectTarget]     = useState<Agency | null>(null);
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [actionLoading, setActionLoading]   = useState<number | null>(null);
  const [logoFile, setLogoFile]             = useState<File | null>(null);
  const [logoPreview, setLogoPreview]       = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const itemsPerPage = 9;

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => { fetchAgencies(); }, []);

  const fetchAgencies = async () => {
    try {
      const res = await apiFetch('/api/v1/accounts/agencies/all/'); // يجلب approved + pending
      if (res.ok) setAgencies(await res.json());
      else addToast('error', 'فشل تحميل الوكالات');
    } catch { addToast('error', 'تعذّر الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  // ─── Split by approval status ─────────────────────────
  const approvedAgencies = agencies.filter(a => a.is_approved);
  const pendingAgencies  = agencies.filter(a => !a.is_approved);

  const filtered = approvedAgencies.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ─── Approve ──────────────────────────────────────────
  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/v1/accounts/agencies/${id}/approve/`, { method: 'POST' });
      if (res.ok) {
        setAgencies(p => p.map(a => a.id === id ? { ...a, is_approved: true, is_active: true } : a));
        addToast('success', '✅ تم قبول الوكالة بنجاح');
      } else addToast('error', 'فشل قبول الوكالة');
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setActionLoading(null); }
  };

  // ─── Reject ───────────────────────────────────────────
  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      const res = await apiFetch(`/api/v1/accounts/agencies/${rejectTarget.id}/reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setAgencies(p => p.filter(a => a.id !== rejectTarget.id));
        addToast('success', `✅ تم رفض طلب "${rejectTarget.name}"`);
        setRejectTarget(null);
      } else addToast('error', 'فشل رفض الطلب');
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setActionLoading(null); }
  };

  // ─── CRUD ─────────────────────────────────────────────
  const openAdd = () => {
    setEditingAgency(null);
    setForm(emptyForm());
    setLogoFile(null); setLogoPreview(null);
    setShowModal(true);
  };

  const openEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setForm({
      name: agency.name, email: agency.email, phone: agency.phone,
      address: agency.address, commission_rate: agency.commission_rate,
      currency: agency.currency, is_active: agency.is_active,
    });
    setLogoFile(null);
    setLogoPreview(agency.logo);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('warning', 'اسم الوكالة مطلوب'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (logoFile) fd.append('logo', logoFile);

      const url    = editingAgency ? `/api/v1/accounts/agencies/${editingAgency.id}/` : '/api/v1/accounts/agencies/';
      const method = editingAgency ? 'PUT' : 'POST';
      const res    = await apiFetch(url, { method, body: fd });

      if (!res.ok) { addToast('error', 'فشل الحفظ'); return; }
      const saved: Agency = await res.json();

      setAgencies(p => editingAgency
        ? p.map(a => a.id === saved.id ? saved : a)
        : [...p, saved]
      );
      setShowModal(false);
      addToast('success', editingAgency ? `✅ تم تعديل "${saved.name}"` : `✅ تمت إضافة "${saved.name}"`);
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await apiFetch(`/api/v1/accounts/agencies/${deleteTarget.id}/`, { method: 'DELETE' });
      if (res.ok) {
        setAgencies(p => p.filter(a => a.id !== deleteTarget.id));
        addToast('success', `✅ تم تعطيل "${deleteTarget.name}"`);
      } else addToast('error', 'فشل التعطيل');
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setDeletingId(null); setDeleteTarget(null); }
  };

  const CURRENCIES = ['MYR', 'USD', 'EUR', 'SAR', 'AED'];

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
          <h1 className="text-2xl font-bold text-gray-900">إدارة الوكالات الشريكة</h1>
          <p className="text-sm text-gray-500 mt-1">عرض وإدارة الوكالات السياحية الشريكة</p>
        </div>
        {activeTab === 'active' && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" /> إضافة وكالة
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الوكالات', value: approvedAgencies.length, color: 'bg-blue-50', icon: <Building2 className="w-6 h-6 text-blue-600" /> },
          { label: 'وكالات نشطة', value: approvedAgencies.filter(a => a.is_active).length, color: 'bg-emerald-50', icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" /> },
          { label: 'طلبات معلقة', value: pendingAgencies.length, color: 'bg-amber-50', icon: <Clock className="w-6 h-6 text-amber-500" /> },
          { label: 'إجمالي الموظفين', value: approvedAgencies.reduce((s, a) => s + a.employees_count, 0), color: 'bg-purple-50', icon: <Users className="w-6 h-6 text-purple-600" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border rounded-2xl p-1.5 shadow-sm flex gap-1">
        <button
          onClick={() => { setActiveTab('active'); setCurrentPage(1); setSearchQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'active'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Building2 className="w-4 h-4" />
          الوكالات المعتمدة
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'active' ? 'bg-blue-500' : 'bg-gray-100 text-gray-600'}`}>
            {approvedAgencies.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('pending'); setCurrentPage(1); setSearchQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Clock className="w-4 h-4" />
          طلبات التسجيل
          {pendingAgencies.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'pending' ? 'bg-amber-400' : 'bg-red-100 text-red-600'}`}>
              {pendingAgencies.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Active Agencies ── */}
      {activeTab === 'active' && (
        <>
          {/* Search */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="ابحث عن وكالة..." value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pr-10 pl-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <Building2 className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد وكالات</h3>
                <p className="text-gray-400 mb-4">ابدأ بإضافة وكالة شريكة جديدة</p>
                <button onClick={openAdd} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  إضافة وكالة
                </button>
              </div>
            ) : paginated.map(agency => (
              <div key={agency.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {agency.logo ? (
                      <img src={agency.logo} className="w-12 h-12 rounded-xl object-cover border" alt={agency.name} />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{agency.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agency.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {agency.is_active ? 'نشطة' : 'معطّلة'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(agency)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(agency)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  {agency.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span dir="ltr">{agency.phone}</span></div>}
                  {agency.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span className="truncate">{agency.email}</span></div>}
                  <div className="flex items-center gap-2"><Globe className="w-4 h-4" /><span>{agency.currency}</span></div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-1 text-sm font-medium text-purple-600">
                    <Percent className="w-4 h-4" />
                    <span>عمولة {agency.commission_rate}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{agency.employees_count} موظف</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4 shadow-sm">
              <span className="text-sm text-gray-500">
                عرض {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} من {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" /> السابق
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
                  التالي <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Pending Requests ── */}
      {activeTab === 'pending' && (
        <>
          {pendingAgencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white border rounded-2xl shadow-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد طلبات معلقة</h3>
              <p className="text-gray-400">جميع طلبات التسجيل تمت معالجتها</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingAgencies.map(agency => (
                <PendingAgencyCard
                  key={agency.id}
                  agency={agency}
                  onApprove={handleApprove}
                  onReject={a => setRejectTarget(a)}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {deleteTarget && (
        <DeleteModal name={deleteTarget.name} loading={deletingId === deleteTarget.id}
          onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {rejectTarget && (
        <RejectModal
          name={rejectTarget.name}
          loading={actionLoading === rejectTarget.id}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingAgency ? 'تعديل الوكالة' : 'إضافة وكالة جديدة'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">شعار الوكالة</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] || null;
                      setLogoFile(f);
                      if (f) { const r = new FileReader(); r.onload = e => setLogoPreview(e.target?.result as string); r.readAsDataURL(f); }
                    }} />
                  {logoPreview ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-300">
                      <img src={logoPreview} className="w-full h-full object-cover" alt="preview" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Building2 className="w-8 h-8 text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400">رفع شعار</span>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الوكالة *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="مثال: وكالة السفر الذهبية" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="info@agency.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الهاتف</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="+60 12 345 6789" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder="عنوان الوكالة" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">نسبة العمولة %</label>
                  <input type="number" min="0" max="100" step="0.5" value={form.commission_rate}
                    onChange={e => setForm({ ...form, commission_rate: e.target.value })}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">العملة</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700">الوكالة نشطة</span>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الحفظ...</> : <><Plus className="w-4 h-4" />{editingAgency ? 'حفظ التعديلات' : 'إضافة الوكالة'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}