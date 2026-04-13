import { useState } from 'react';
import { Eye, EyeOff, Loader2, Globe, Lock, User, Building2,
         Mail, Phone, MapPin, Percent, ChevronLeft, X,
         CheckCircle2, AlertTriangle } from 'lucide-react';
import { login, saveAuth } from './authService';
import type { AuthUser } from './authService';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface Props { onSuccess: (user: AuthUser) => void; }

// ─── Register Agency Form ─────────────────────────────────
function RegisterAgencyForm({ onBack }: { onBack: () => void }) {
  const [step, setStep]       = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({
    // بيانات الوكالة
    agency_name:     '',
    agency_email:    '',
    agency_phone:    '',
    agency_address:  '',
    commission_rate: '10',
    currency:        'MYR',
    // بيانات المستخدم
    first_name: '',
    last_name:  '',
    username:   '',
    phone:      '',
    password:   '',
    password2:  '',
  });
  const [showPwd, setShowPwd]   = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const update = (k: string, v: string) => setForm(p => ({...p, [k]: v}));

  const handleSubmit = async () => {
    if (!form.username || !form.password || !form.agency_name || !form.agency_email) {
      setError('يرجى ملء جميع الحقول المطلوبة'); return;
    }
    if (form.password !== form.password2) {
      setError('كلمتا المرور غير متطابقتين'); return;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/api/v1/accounts/auth/register/agency/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          commission_rate: parseFloat(form.commission_rate),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(Object.values(err).flat().join(' | ') as string);
        return;
      }
      setSuccess(true);
    } catch { setError('خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="text-center py-6">
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">تم إرسال طلبك بنجاح!</h3>
      <p className="text-blue-200 text-sm mb-6 leading-relaxed">
        طلب تسجيل وكالة <span className="font-semibold text-white">"{form.agency_name}"</span> قيد المراجعة.
        سيتم التواصل معك على <span className="font-semibold text-white">{form.agency_email}</span> بعد الموافقة.
      </p>
      <button onClick={onBack}
        className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
        العودة لتسجيل الدخول
      </button>
    </div>
  );

  const CURRENCIES = ['MYR', 'USD', 'EUR', 'SAR', 'AED'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 text-blue-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">تسجيل وكالة جديدة</h2>
          <p className="text-blue-300 text-xs">الخطوة {step} من 2</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-blue-500"/>
        <div className={`flex-1 h-1.5 rounded-full transition-colors ${step === 2 ? 'bg-blue-500' : 'bg-white/20'}`}/>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0"/>
          {error}
        </div>
      )}

      {/* Step 1 — بيانات الوكالة */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">اسم الوكالة *</label>
            <div className="relative">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
              <input value={form.agency_name} onChange={e => update('agency_name', e.target.value)}
                placeholder="مثال: وكالة السفر الذهبية"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">البريد الإلكتروني للوكالة *</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
              <input type="email" value={form.agency_email} onChange={e => update('agency_email', e.target.value)}
                placeholder="info@agency.com" dir="ltr"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">هاتف الوكالة</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
              <input value={form.agency_phone} onChange={e => update('agency_phone', e.target.value)}
                placeholder="+60 12 345 6789" dir="ltr"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">العنوان</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 w-4 h-4 text-blue-300"/>
              <textarea value={form.agency_address} onChange={e => update('agency_address', e.target.value)}
                placeholder="عنوان الوكالة" rows={2}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-blue-100 text-xs font-medium mb-1.5">نسبة العمولة المطلوبة % *</label>
              <div className="relative">
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
                <input type="number" min="1" max="50" value={form.commission_rate}
                  onChange={e => update('commission_rate', e.target.value)} dir="ltr"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              </div>
            </div>
            <div>
              <label className="block text-blue-100 text-xs font-medium mb-1.5">العملة</label>
              <select value={form.currency} onChange={e => update('currency', e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {CURRENCIES.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => {
            if (!form.agency_name || !form.agency_email) { setError('اسم الوكالة والبريد الإلكتروني مطلوبان'); return; }
            setError(''); setStep(2);
          }}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm transition-colors mt-2">
            التالي — بيانات المسؤول
          </button>
        </div>
      )}

      {/* Step 2 — بيانات المسؤول */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-blue-100 text-xs font-medium mb-1.5">الاسم الأول</label>
              <input value={form.first_name} onChange={e => update('first_name', e.target.value)}
                placeholder="محمد"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div>
              <label className="block text-blue-100 text-xs font-medium mb-1.5">اسم العائلة</label>
              <input value={form.last_name} onChange={e => update('last_name', e.target.value)}
                placeholder="أحمد"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">اسم المستخدم *</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
              <input value={form.username} onChange={e => update('username', e.target.value)}
                placeholder="username" dir="ltr"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">هاتف المسؤول</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
              <input value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="+60 12 345 6789" dir="ltr"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">كلمة المرور *</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
              <input type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => update('password', e.target.value)} dir="ltr"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              <button onClick={() => setShowPwd(!showPwd)} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white">
                {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-blue-100 text-xs font-medium mb-1.5">تأكيد كلمة المرور *</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"/>
              <input type={showPwd2 ? 'text' : 'password'} value={form.password2}
                onChange={e => update('password2', e.target.value)} dir="ltr"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-9 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              <button onClick={() => setShowPwd2(!showPwd2)} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white">
                {showPwd2 ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>

          {/* ملخص الوكالة */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-blue-200 space-y-1">
            <p className="font-medium text-white mb-1.5">ملخص الطلب:</p>
            <p>🏢 {form.agency_name}</p>
            <p>📧 {form.agency_email}</p>
            <p>💰 عمولة {form.commission_rate}% — {form.currency}</p>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={() => { setStep(1); setError(''); }}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl py-3 text-sm transition-colors">
              السابق
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-2 flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> إرسال...</> : '✅ إرسال الطلب'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────
export function LoginPage({ onSuccess }: Props) {
  const [view, setView]       = useState<'login' | 'register'>('login');
  const [form, setForm]       = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true); setError('');
    try {
      const data = await login(form.username, form.password);
      saveAuth(data);
      onSuccess(data.user);
    } catch (e: any) {
      setError(e.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4" dir="rtl">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"/>
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <Globe className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">You Need Travel</h1>
          <p className="text-blue-200 text-sm">
            {view === 'login' ? 'لوحة تحكم الإدارة' : 'انضم كوكالة شريكة'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8">

          {/* Register View */}
          {view === 'register' && (
            <RegisterAgencyForm onBack={() => { setView('login'); setError(''); }}/>
          )}

          {/* Login View */}
          {view === 'login' && (
            <>
              <h2 className="text-xl font-bold text-white mb-6 text-center">تسجيل الدخول</h2>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 text-sm mb-4 text-center flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0"/>
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-blue-100 text-sm font-medium mb-2">اسم المستخدم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300"/>
                  <input type="text" value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="أدخل اسم المستخدم"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-blue-100 text-sm font-medium mb-2">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300"/>
                  <input type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="أدخل كلمة المرور"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl pr-10 pl-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  <button onClick={() => setShowPwd(!showPwd)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white">
                    {showPwd ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                  </button>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors shadow-lg mb-4">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> جاري الدخول...</> : 'دخول'}
              </button>

              {/* Register Button */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"/>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-3 text-blue-300 text-xs">أو</span>
                </div>
              </div>

              <button onClick={() => { setView('register'); setError(''); }}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-colors text-sm">
                <Building2 className="w-4 h-4"/>
                سجّل وكالتك الآن
              </button>
            </>
          )}
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          You Need Travel © {new Date().getFullYear()} — نظام إدارة سياحي
        </p>
      </div>
    </div>
  );
}