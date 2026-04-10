import { apiFetch, BASE } from '../auth/apiFetch';
import { useState, useEffect } from 'react';
import {
  X, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
  Globe, Moon, Building2, Tag, User, Phone,
  Baby, Star, MapPin, Briefcase, AlertTriangle,
  Plus, Minus, Check, Users, Package, Sparkles
} from 'lucide-react';


// ─── Types ────────────────────────────────────────────────
interface City { id: number; name: string; country: number; image?: string; }
interface Hotel { id: number; name: string; city: number; stars: number; image?: string; }
interface Service { id: number; name: string; category: number; city: number; base_price: string; currency: string; is_optional: boolean; category_name?: string; }

interface PackageCityHotel { id?: number; hotel: number; hotel_name?: string; hotel_stars?: number; nights: number; is_default?: boolean; }
interface PackageCity { id?: number; city: number; city_name?: string; nights: number; min_nights?: number; max_nights?: number; hotels: PackageCityHotel[]; services: any[]; }
interface TourPackage { id: number; name: string; is_customizable: boolean; cities: PackageCity[]; base_price: string; currency: string; discount_percentage?: string; final_price: number; }

interface BookingHotel { hotel: number; hotel_name?: string; nights: number; rooms_count: number; }
interface BookingCity { city: number; city_name?: string; nights: number; order: number; hotels: BookingHotel[]; }

// ─── Step Bar ─────────────────────────────────────────────
function StepBar({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
            ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-400'}`}>
            {i < step ? <Check className="w-3.5 h-3.5"/> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block whitespace-nowrap
            ${i === step ? 'text-emerald-600' : i < step ? 'text-gray-500' : 'text-gray-400'}`}>{s}</span>
          {i < steps.length - 1 && <div className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`}/>}
        </div>
      ))}
    </div>
  );
}

// ─── Counter ──────────────────────────────────────────────
function Counter({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 transition-colors">
        <Minus className="w-3.5 h-3.5"/>
      </button>
      <span className="w-8 text-center font-bold text-gray-800">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 transition-colors">
        <Plus className="w-3.5 h-3.5"/>
      </button>
    </div>
  );
}

// ─── Client Form ──────────────────────────────────────────
function ClientForm({ clientName, clientPhone, clientEmail, notes, onChange }: {
  clientName: string; clientPhone: string; clientEmail: string; notes: string;
  onChange: (field: string, val: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <User className="w-4 h-4 text-emerald-600"/> معلومات العميل
      </h3>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">الاسم الكامل *</label>
        <input value={clientName} onChange={e => onChange('clientName', e.target.value)}
          className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="مثال: أحمد محمد"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">رقم الهاتف *</label>
          <input value={clientPhone} onChange={e => onChange('clientPhone', e.target.value)} dir="ltr"
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="+213 555 000000"/>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">البريد الإلكتروني</label>
          <input value={clientEmail} onChange={e => onChange('clientEmail', e.target.value)} dir="ltr"
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="email@example.com"/>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات</label>
        <textarea value={notes} onChange={e => onChange('notes', e.target.value)} rows={2}
          className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none" placeholder="أي طلبات خاصة..."/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 🏢 FIXED PACKAGE BOOKING (باقة ثابتة)
// ══════════════════════════════════════════════════════════
function FixedBookingWizard({ pkg, onClose, onSuccess }: {
  pkg: TourPackage; onClose: () => void; onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/v1/bookings/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: 'agency', package: pkg.id,
          client_name: clientName, client_phone: clientPhone,
          client_email: clientEmail, notes,
          adults, children, infants,
          currency: pkg.currency,
          cities: pkg.cities.map((c, i) => ({
            city: c.city, nights: c.nights, order: i,
            hotels: c.hotels.map(h => ({ hotel: h.hotel, nights: h.nights, rooms_count: 1 }))
          })),
          services: pkg.cities.flatMap(c => c.services.map(s => ({ service: s.service, quantity: 1 }))),
        }),
      });
      if (res.ok) onSuccess();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">حجز باقة الوكالة</h2>
              <p className="text-xs text-blue-600 font-medium">{pkg.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* ملخص الباقة */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">تفاصيل الباقة</p>
            <div className="flex flex-wrap gap-2">
              {pkg.cities.map((c, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-white text-blue-700 px-2.5 py-1.5 rounded-xl border border-blue-200">
                  <MapPin className="w-3 h-3"/> {c.city_name} · {c.nights} ليالي
                </span>
              ))}
            </div>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-2xl font-bold text-blue-600">{pkg.final_price.toFixed(0)}</span>
              <span className="text-sm text-gray-500">{pkg.currency} / شخص</span>
              {pkg.discount_percentage && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">-{pkg.discount_percentage}%</span>}
            </div>
          </div>

          {/* عدد الأفراد */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">عدد الأفراد</p>
            {[
              { label: 'البالغون', sub: '12+ سنة', icon: <User className="w-4 h-4 text-blue-600"/>, val: adults, set: setAdults, min: 1 },
              { label: 'الأطفال', sub: '2–11 سنة', icon: <Users className="w-4 h-4 text-purple-600"/>, val: children, set: setChildren },
              { label: 'الرضع', sub: 'أقل من سنتين', icon: <Baby className="w-4 h-4 text-pink-600"/>, val: infants, set: setInfants },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">{item.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                </div>
                <Counter value={item.val} onChange={item.set} min={item.min || 0}/>
              </div>
            ))}
          </div>

          {/* بيانات العميل */}
          <ClientForm clientName={clientName} clientPhone={clientPhone} clientEmail={clientEmail} notes={notes}
            onChange={(f, v) => { if(f==='clientName') setClientName(v); else if(f==='clientPhone') setClientPhone(v); else if(f==='clientEmail') setClientEmail(v); else setNotes(v); }}/>

          {(!clientName || !clientPhone) && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0"/>
              <p className="text-xs text-amber-700">يرجى إدخال اسم العميل ورقم هاتفه</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
          <button onClick={handleSubmit} disabled={saving || !clientName || !clientPhone}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>جاري الإرسال...</> : <><CheckCircle2 className="w-4 h-4"/>تأكيد الحجز</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ✨ CUSTOM PACKAGE BOOKING (باقة مخصصة)
// ══════════════════════════════════════════════════════════
function CustomBookingWizard({ pkg, allServices, onClose, onSuccess }: {
  pkg: TourPackage; allServices: Service[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // الأفراد
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // تخصيص المدن (الليالي + الفنادق)
  const [bookingCities, setBookingCities] = useState<BookingCity[]>(
    pkg.cities.map((c, i) => ({
      city: c.city, city_name: c.city_name,
      nights: c.nights, order: i, hotels: [],
    }))
  );

  // الخدمات الاختيارية
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  // بيانات العميل
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  const STEPS = ['الأفراد', 'الإقامة', 'الخدمات', 'التأكيد'];

  const updateCity = (cityId: number, data: Partial<BookingCity>) =>
    setBookingCities(prev => prev.map(c => c.city === cityId ? { ...c, ...data } : c));

  const toggleHotel = (cityId: number, hotelId: number, hotelName: string, nights: number) => {
    setBookingCities(prev => prev.map(c => {
      if (c.city !== cityId) return c;
      const exists = c.hotels.find(h => h.hotel === hotelId);
      return {
        ...c,
        hotels: exists
          ? c.hotels.filter(h => h.hotel !== hotelId)
          : [...c.hotels, { hotel: hotelId, hotel_name: hotelName, nights, rooms_count: 1 }]
      };
    }));
  };

  const getOptionalServices = () =>
    allServices.filter(s => s.is_optional && bookingCities.some(bc => bc.city === s.city));

  const canNext = () => {
    if (step === 0) return adults >= 1;
    if (step === 1) return bookingCities.every(c => c.hotels.length > 0);
    if (step === 3) return !!clientName.trim() && !!clientPhone.trim();
    return true;
  };

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/v1/bookings/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: 'custom', package: pkg.id,
          client_name: clientName, client_phone: clientPhone,
          client_email: clientEmail, notes,
          adults, children, infants,
          currency: pkg.currency,
          cities: bookingCities.map((c, i) => ({
            city: c.city, nights: c.nights, order: i,
            hotels: c.hotels.map(h => ({ hotel: h.hotel, nights: h.nights, rooms_count: h.rooms_count }))
          })),
          services: [
            // الخدمات الإلزامية تلقائياً
            ...pkg.cities.flatMap(c => c.services.filter(s => !s.is_optional).map(s => ({ service: s.service, quantity: 1 }))),
            // الخدمات الاختيارية المختارة
            ...selectedServices.map(sId => ({ service: sId, quantity: 1 })),
          ],
        }),
      });
      if (res.ok) onSuccess();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">تخصيص الباقة</h2>
              <p className="text-xs text-purple-600 font-medium">{pkg.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <StepBar step={step} steps={STEPS}/>

        <div className="overflow-y-auto flex-1 p-6">

          {/* ─── Step 0: الأفراد ─── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-sm text-purple-700">
                <p className="font-semibold mb-1">المدن المحددة في هذه الباقة:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pkg.cities.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 bg-white text-purple-700 text-xs px-2.5 py-1.5 rounded-xl border border-purple-200">
                      <MapPin className="w-3 h-3"/> {c.city_name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                {[
                  { label: 'البالغون', sub: '12+ سنة', icon: <User className="w-4 h-4 text-blue-600"/>, val: adults, set: setAdults, min: 1 },
                  { label: 'الأطفال', sub: '2–11 سنة', icon: <Users className="w-4 h-4 text-purple-600"/>, val: children, set: setChildren },
                  { label: 'الرضع', sub: 'أقل من سنتين', icon: <Baby className="w-4 h-4 text-pink-600"/>, val: infants, set: setInfants },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">{item.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                      </div>
                    </div>
                    <Counter value={item.val} onChange={item.set} min={item.min || 0}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 1: الإقامة ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">اختر فندقاً وحدد عدد الليالي لكل مدينة</p>
              {pkg.cities.map((pkgCity, ci) => {
                const bc = bookingCities.find(c => c.city === pkgCity.city)!;
                const availableHotels = pkgCity.hotels;
                const minN = pkgCity.min_nights || 1;
                const maxN = pkgCity.max_nights || 14;
                return (
                  <div key={ci} className="border-2 rounded-2xl overflow-hidden">
                    {/* City header */}
                    <div className="bg-purple-50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{ci+1}</div>
                        <span className="font-semibold text-gray-800">{pkgCity.city_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">عدد الليالي:</span>
                        <Counter value={bc.nights} onChange={v => updateCity(pkgCity.city, { nights: v })} min={minN} max={maxN}/>
                      </div>
                    </div>
                    {/* Hotels */}
                    <div className="p-4 space-y-2">
                      {availableHotels.length === 0
                        ? <p className="text-xs text-gray-400 italic text-center py-3">لا توجد فنادق متاحة</p>
                        : availableHotels.map(h => {
                          const sel = bc.hotels.find(bh => bh.hotel === h.hotel);
                          const hImg = h.hotel_image ? (h.hotel_image.startsWith('http') ? h.hotel_image : `${BASE}${h.hotel_image}`) : null;
                          return (
                            <button key={h.hotel} onClick={() => toggleHotel(pkgCity.city, h.hotel, h.hotel_name||'', bc.nights)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right
                                ${sel ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                              {hImg
                                ? <img src={hImg} className="w-11 h-11 rounded-xl object-cover shrink-0" alt=""/>
                                : <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-gray-300"/></div>}
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">{h.hotel_name}</p>
                                <div className="flex gap-0.5 mt-0.5">
                                  {[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=(h.hotel_stars||0)?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200'}`}/>)}
                                </div>
                              </div>
                              {h.is_default && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">مقترح</span>}
                              <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${sel ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                                {sel && <Check className="w-3 h-3 text-white"/>}
                              </div>
                            </button>
                          );
                        })
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Step 2: الخدمات الاختيارية ─── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* الخدمات الإلزامية */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">خدمات إلزامية (مشمولة تلقائياً)</p>
                <div className="flex flex-wrap gap-2">
                  {pkg.cities.flatMap(c => c.services.filter((s:any) => !s.is_optional)).map((s:any, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl border">
                      <Check className="w-3 h-3 text-emerald-500"/> {s.service_name}
                    </span>
                  ))}
                  {pkg.cities.flatMap(c => c.services.filter((s:any) => !s.is_optional)).length === 0 &&
                    <p className="text-xs text-gray-400 italic">لا توجد خدمات إلزامية</p>}
                </div>
              </div>

              {/* الخدمات الاختيارية */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">خدمات اختيارية</p>
                {getOptionalServices().length === 0
                  ? <div className="text-center py-8 text-gray-400">
                      <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-200"/>
                      <p className="text-sm">لا توجد خدمات اختيارية</p>
                    </div>
                  : <div className="space-y-2">
                      {getOptionalServices().map(s => {
                        const sel = selectedServices.includes(s.id);
                        return (
                          <button key={s.id} onClick={() => setSelectedServices(prev =>
                            sel ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-right
                              ${sel ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sel?'bg-purple-100':'bg-gray-100'}`}>
                              <Tag className={`w-4 h-4 ${sel?'text-purple-600':'text-gray-400'}`}/>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{s.name}</p>
                              {s.category_name && <p className="text-xs text-gray-400">{s.category_name}</p>}
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm text-purple-600">{s.base_price}</p>
                              <p className="text-xs text-gray-400">{s.currency}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${sel?'bg-purple-500 border-purple-500':'border-gray-300'}`}>
                              {sel && <Check className="w-3 h-3 text-white"/>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                }
              </div>
            </div>
          )}

          {/* ─── Step 3: التأكيد ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <ClientForm clientName={clientName} clientPhone={clientPhone} clientEmail={clientEmail} notes={notes}
                onChange={(f, v) => { if(f==='clientName') setClientName(v); else if(f==='clientPhone') setClientPhone(v); else if(f==='clientEmail') setClientEmail(v); else setNotes(v); }}/>

              {/* ملخص */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                <p className="font-semibold text-purple-800">ملخص الحجز</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-xl p-2.5"><p className="text-xl font-bold">{adults+children+infants}</p><p className="text-xs text-gray-500">أفراد</p></div>
                  <div className="bg-white rounded-xl p-2.5"><p className="text-xl font-bold">{bookingCities.length}</p><p className="text-xs text-gray-500">مدن</p></div>
                  <div className="bg-white rounded-xl p-2.5"><p className="text-xl font-bold">{bookingCities.reduce((s,c)=>s+c.nights,0)}</p><p className="text-xs text-gray-500">ليالي</p></div>
                </div>
                {bookingCities.map((c,i)=>(
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 text-sm">
                    <span className="font-medium">{c.city_name}</span>
                    <div className="flex items-center gap-3 text-gray-500 text-xs">
                      <span className="flex items-center gap-1"><Moon className="w-3 h-3"/>{c.nights} ليالي</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/>{c.hotels.map(h=>h.hotel_name).join(', ')}</span>
                    </div>
                  </div>
                ))}
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServices.map(sId => {
                      const svc = allServices.find(s => s.id === sId);
                      return svc ? <span key={sId} className="text-xs bg-white text-purple-700 px-2 py-1 rounded-full border border-purple-200">{svc.name}</span> : null;
                    })}
                  </div>
                )}
              </div>

              {(!clientName || !clientPhone) && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0"/>
                  <p className="text-xs text-amber-700">يرجى إدخال اسم العميل ورقم هاتفه</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          {step > 0
            ? <button onClick={() => setStep(s => s-1)} className="flex items-center gap-1 px-5 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">
                <ChevronRight className="w-4 h-4"/> السابق
              </button>
            : <button onClick={onClose} className="px-5 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
          }
          <div className="flex-1"/>
          {step < STEPS.length - 1
            ? <button onClick={() => setStep(s => s+1)} disabled={!canNext()}
                className="flex items-center gap-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-40 text-sm">
                التالي <ChevronLeft className="w-4 h-4"/>
              </button>
            : <button onClick={handleSubmit} disabled={saving || !clientName || !clientPhone}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-40 text-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>جاري الإرسال...</> : <><CheckCircle2 className="w-4 h-4"/>إرسال طلب الحجز</>}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 🚀 MAIN EXPORT
// ══════════════════════════════════════════════════════════
export function BookingWizard({ pkg, onClose, onSuccess }: {
  pkg: TourPackage;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [allServices, setAllServices] = useState<Service[]>([]);

  useEffect(() => {
    apiFetch(`/api/v1/services/`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setAllServices(Array.isArray(d) ? d : d.results || []));
  }, []);

  if (!pkg.is_customizable) {
    return <FixedBookingWizard pkg={pkg} onClose={onClose} onSuccess={onSuccess}/>;
  }
  return <CustomBookingWizard pkg={pkg} allServices={allServices} onClose={onClose} onSuccess={onSuccess}/>;
}