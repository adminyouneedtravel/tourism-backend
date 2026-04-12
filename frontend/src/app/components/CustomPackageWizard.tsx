import { apiFetch, BASE } from '../auth/apiFetch';
import { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
  Globe, Moon, Building2, MapPin, Plus, Minus, Check,
  Plane, Car, Camera, Trash2, Star, Filter, User, Phone,
  Baby, BedDouble, AlertTriangle, Calculator
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface Country   { id: number; name: string; }
interface City      { id: number; name: string; country: number; }
interface Hotel     { id: number; name: string; city: number; stars: number; image?: string; }

interface PersonConfig {
  type: 'adult' | 'child' | 'infant';
  age?: number;
  extra_bed: boolean;
}
interface PkgCity   { city_id: number; city_name: string; nights: number; order: number; }
interface PkgHotel  {
  temp_id: string;
  package_city_idx: number;
  hotel_id: number; hotel_name: string; hotel_stars: number; hotel_image?: string;
  room_type: string;
  check_in_date: string; check_out_date: string; nights: number;
  price_per_room_night_myr: number;
  source: string; includes_breakfast: boolean;
}
interface PkgFlight {
  from_city_id: number; from_city_name: string;
  to_city_id: number; to_city_name: string;
  price_adult_myr: number; price_child_myr: number; price_infant_myr: number;
}
interface PkgTransfer {
  city_id: number; city_name: string;
  transfer_type: string; price_myr: number;
}
interface PkgTour {
  city_id: number; city_name: string; tour_name: string;
  price_adult_myr: number; price_child_myr: number; price_infant_myr: number;
}

const ROOM_TYPES = ['standard','superior','deluxe','suite','twin','triple','family'];
const TRANSFER_TYPES: Record<string, string> = {
  airport_pickup: 'استقبال مطار', intercity: 'نقل بين مدن', local: 'نقل محلي'
};

const STEPS = [
  'العميل والأساسيات', 'الأفراد', 'المدن',
  'الفنادق', 'الطيران', 'النقل والجولات', 'المراجعة'
];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 overflow-x-auto gap-1">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center gap-1 shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
            ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-200 text-gray-400'}`}>
            {i < step ? <Check className="w-3.5 h-3.5"/> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden md:block whitespace-nowrap
            ${i === step ? 'text-emerald-600' : i < step ? 'text-gray-500' : 'text-gray-400'}`}>{s}</span>
          {i < STEPS.length - 1 && <div className={`w-4 h-0.5 mx-0.5 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`}/>}
        </div>
      ))}
    </div>
  );
}

function Counter({ value, onChange, min = 0, max = 20, label }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; label?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
      {label && <span className="text-sm text-gray-700 font-medium">{label}</span>}
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:border-emerald-400 disabled:opacity-30">
          <Minus className="w-3.5 h-3.5"/>
        </button>
        <span className="w-8 text-center font-bold text-gray-800 text-lg">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:border-emerald-400 disabled:opacity-30">
          <Plus className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  );
}

// ─── Hotel Card ───────────────────────────────────────────
function HotelCard({ hotel, roomType, priceData, nights, isSelected, onSelect }: {
  hotel: Hotel; roomType: string; priceData: any; nights: number;
  isSelected: boolean; onSelect: () => void;
}) {
  const img = hotel.image ? (hotel.image.startsWith('http') ? hotel.image : `${BASE}${hotel.image}`) : null;
  const totalPrice = priceData?.price_myr ? (parseFloat(priceData.price_myr) * nights).toFixed(0) : null;

  return (
    <div onClick={onSelect} className={`border-2 rounded-2xl overflow-hidden cursor-pointer transition-all
      ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
      <div className="h-32 bg-gradient-to-br from-blue-50 to-teal-100 relative overflow-hidden">
        {img
          ? <img src={img} className="w-full h-full object-cover" alt={hotel.name}/>
          : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-gray-300"/></div>
        }
        {isSelected && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white rounded-full p-1">
            <Check className="w-3 h-3"/>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">{hotel.name}</p>
        <div className="flex mb-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`w-3 h-3 ${s <= hotel.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}/>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-1">{roomType}</p>
        {priceData?.price_myr ? (
          <div>
            <p className="text-xs text-gray-400">RM{parseFloat(priceData.price_myr).toFixed(0)}/ليلة</p>
            <p className="font-bold text-emerald-600 text-sm">RM{totalPrice} ({nights} ليالي)</p>
            {priceData.includes_breakfast && <p className="text-xs text-teal-600">يشمل فطور</p>}
            <p className="text-xs text-gray-400">{priceData.source === 'contract' ? 'سعر شراكة' : 'سعر السوق'}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">لا يوجد سعر متاح</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────
interface Props { onClose: () => void; onSuccess: () => void; }

export function CustomPackageWizard({ onClose, onSuccess }: Props) {
  const [step, setStep]           = useState(0);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [packageId, setPackageId] = useState<number | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities]       = useState<City[]>([]);
  const [hotels, setHotels]       = useState<Hotel[]>([]);

  // Step 0
  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [countryId, setCountryId]     = useState<number | null>(null);
  const [totalNights, setTotalNights] = useState(7);
  const [totalDays, setTotalDays]     = useState(8);

  // Step 1 — الأفراد
  const [persons, setPersons] = useState<PersonConfig[]>([
    { type: 'adult', extra_bed: false },
    { type: 'adult', extra_bed: false },
  ]);

  const adults   = persons.filter(p => p.type === 'adult').length;
  const children = persons.filter(p => p.type === 'child').length;
  const infants  = persons.filter(p => p.type === 'infant').length;
  const totalPax = persons.length;

  // Step 2
  const [pkgCities, setPkgCities]   = useState<PkgCity[]>([]);
  const citiesNightsSum = pkgCities.reduce((s, c) => s + c.nights, 0);

  // Step 3 — الفنادق
  const [pkgHotels, setPkgHotels]   = useState<PkgHotel[]>([]);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [roomTypeFilter, setRoomTypeFilter] = useState('superior');
  const [hotelPrices, setHotelPrices] = useState<Record<string, any>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Step 4
  const [pkgFlights, setPkgFlights] = useState<PkgFlight[]>([]);
  const [flightFilter, setFlightFilter] = useState<number | null>(null);

  // Step 5
  const [pkgTransfers, setPkgTransfers] = useState<PkgTransfer[]>([]);
  const [pkgTours, setPkgTours]         = useState<PkgTour[]>([]);
  const [transferFilter, setTransferFilter] = useState<number | null>(null);
  const [tourFilter, setTourFilter]         = useState<number | null>(null);

  // Step 6 — نتيجة الحساب
  const [pricing, setPricing]     = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/v1/locations/countries/').then(r => r.json()),
      apiFetch('/api/v1/locations/cities/').then(r => r.json()),
      apiFetch('/api/v1/hotels/').then(r => r.json()),
    ]).then(([c, ci, h]) => {
      setCountries(Array.isArray(c) ? c : []);
      setCities(Array.isArray(ci) ? ci : []);
      setHotels(Array.isArray(h) ? h : h.results || []);
    });
  }, []);

  const filteredCities = cities.filter(c => c.country === countryId);

  const fetchHotelPrices = useCallback(async (cityIdx: number) => {
    const city = pkgCities[cityIdx];
    if (!city) return;
    const cityHotels = hotels.filter(h => h.city === city.city_id);
    setLoadingPrices(true);
    const prices: Record<string, any> = {};
    await Promise.all(cityHotels.map(async h => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const checkout = new Date(Date.now() + city.nights * 86400000).toISOString().split('T')[0];
        const res = await apiFetch(
          `/api/v1/packages/${packageId}/best-hotel-price/?hotel_id=${h.id}&room_type=${roomTypeFilter}&check_in=${today}&check_out=${checkout}&pax_count=${totalPax}`
        );
        if (res.ok) prices[h.id] = await res.json();
      } catch {}
    }));
    setHotelPrices(prices);
    setLoadingPrices(false);
  }, [pkgCities, hotels, packageId, roomTypeFilter, totalPax]);

  const savePackage = async (): Promise<number | null> => {
    const agency = JSON.parse(localStorage.getItem('user') || '{}')?.agency || 1;
    const res = await apiFetch('/api/v1/packages/', {
      method: 'POST',
      body: JSON.stringify({
        title: `طلب ${clientName} — ${totalNights} ليالي`,
        agency, country: countryId,
        total_nights: totalNights, total_days: totalDays,
        status: 'draft',
        peak_surcharge_pct: 0,
        currency_cost: 'MYR', currency_sell: 'EUR',
        is_custom_order: true,
        client_name: clientName, client_phone: clientPhone, client_email: clientEmail,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
  };

  const handleNext = async () => {
    setError('');

    if (step === 0) {
      if (!clientName.trim() || !clientPhone.trim() || !countryId) {
        setError('يرجى إدخال اسم العميل والهاتف واختيار الدولة');
        return;
      }
      setSaving(true);
      const id = await savePackage();
      setSaving(false);
      if (!id) { setError('فشل إنشاء الباقة'); return; }
      setPackageId(id);
    }

    if (step === 1 && packageId) {
      if (adults === 0) { setError('يجب إضافة بالغ واحد على الأقل'); return; }
      setSaving(true);
      await apiFetch(`/api/v1/packages/${packageId}/set-pax/`, {
        method: 'POST',
        body: JSON.stringify({
          adults_count: adults, children_count: children, infants_count: infants,
          extra_bed_children: persons.filter(p => p.type === 'child').some(p => p.extra_bed),
          extra_bed_infants: persons.filter(p => p.type === 'infant').some(p => p.extra_bed),
        }),
      });
      setSaving(false);
    }

    if (step === 2 && packageId) {
      if (pkgCities.length === 0) { setError('يرجى إضافة مدينة واحدة على الأقل'); return; }
      if (citiesNightsSum !== totalNights) {
        setError(`مجموع ليالي المدن (${citiesNightsSum}) يجب أن يساوي إجمالي الليالي (${totalNights})`);
        return;
      }
      setSaving(true);
      for (const c of pkgCities) {
        await apiFetch(`/api/v1/packages/${packageId}/add-city/`, {
          method: 'POST',
          body: JSON.stringify({ city_id: c.city_id, nights: c.nights, order: c.order }),
        });
      }
      setSaving(false);
      await fetchHotelPrices(0);
    }

    if (step === 3 && packageId) {
      if (pkgHotels.length === 0) { setError('يرجى إضافة فندق واحد على الأقل'); return; }
      setSaving(true);
      for (const h of pkgHotels) {
        await apiFetch(`/api/v1/packages/${packageId}/add-hotel/`, {
          method: 'POST',
          body: JSON.stringify({
            package_city_id: h.package_city_idx,
            hotel_id: h.hotel_id, room_type: h.room_type,
            rooms_count: Math.ceil(totalPax / 2),
            check_in_date: h.check_in_date, check_out_date: h.check_out_date,
            nights: h.nights, price_per_room_night_myr: h.price_per_room_night_myr,
            source: h.source,
          }),
        });
      }
      setSaving(false);
    }

    if (step === 4 && packageId) {
      setSaving(true);
      for (const f of pkgFlights) {
        await apiFetch(`/api/v1/packages/${packageId}/add-flight/`, {
          method: 'POST', body: JSON.stringify(f),
        });
      }
      setSaving(false);
    }

    if (step === 5 && packageId) {
      setSaving(true);
      for (const t of pkgTransfers) {
        await apiFetch(`/api/v1/packages/${packageId}/add-transfer/`, {
          method: 'POST', body: JSON.stringify(t),
        });
      }
      for (const t of pkgTours) {
        await apiFetch(`/api/v1/packages/${packageId}/add-tour/`, {
          method: 'POST', body: JSON.stringify(t),
        });
      }
      setSaving(false);
      setCalculating(true);
      const res = await apiFetch(`/api/v1/packages/${packageId}/calculate-price/`, { method: 'POST' });
      if (res.ok) setPricing(await res.json());
      setCalculating(false);
    }

    setStep(s => s + 1);
  };

  const handlePublish = async () => {
    if (!packageId) return;
    setSaving(true);
    await apiFetch(`/api/v1/packages/${packageId}/publish/`, { method: 'POST' });
    setSaving(false);
    onSuccess();
  };

  const addPerson = (type: 'adult' | 'child' | 'infant') => {
    setPersons(prev => [...prev, { type, age: type !== 'adult' ? 1 : undefined, extra_bed: false }]);
  };

  const removePerson = (idx: number) => {
    setPersons(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePerson = (idx: number, data: Partial<PersonConfig>) => {
    setPersons(prev => prev.map((p, i) => i === idx ? { ...p, ...data } : p));
  };

  const filteredHotels = (cityId: number) => hotels
    .filter(h => h.city === cityId)
    .filter(h => !starFilter || h.stars === starFilter)
    .sort((a, b) => {
      const pa = parseFloat(hotelPrices[a.id]?.price_myr || '9999999');
      const pb = parseFloat(hotelPrices[b.id]?.price_myr || '9999999');
      return pa - pb;
    });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh]">

        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">باقة حسب الطلب</h2>
            <p className="text-xs text-gray-400 mt-0.5">{STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <StepBar step={step}/>

        {error && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0"/> {error}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── Step 0: العميل والأساسيات ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                  <User className="w-4 h-4"/> بيانات العميل
                </h3>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="اسم العميل *"
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  placeholder="رقم الهاتف *" dir="ltr"
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
                <input value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                  placeholder="البريد الإلكتروني (اختياري)" dir="ltr"
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الدولة *</label>
                <select value={countryId || ''} onChange={e => setCountryId(Number(e.target.value))}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                  <option value="">-- اختر الدولة --</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">عدد الليالي *</label>
                  <input type="number" min={1} value={totalNights}
                    onChange={e => { setTotalNights(Number(e.target.value)); setTotalDays(Number(e.target.value) + 1); }}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" dir="ltr"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">عدد الأيام</label>
                  <input type="number" min={1} value={totalDays} onChange={e => setTotalDays(Number(e.target.value))}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" dir="ltr"/>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: الأفراد ── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => addPerson('adult')}
                  className="py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 text-sm hover:bg-blue-50 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  <span>بالغ</span>
                </button>
                <button onClick={() => addPerson('child')}
                  className="py-2.5 border-2 border-dashed border-amber-200 rounded-xl text-amber-600 text-sm hover:bg-amber-50 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  <span>طفل (3-11)</span>
                </button>
                <button onClick={() => addPerson('infant')}
                  className="py-2.5 border-2 border-dashed border-purple-200 rounded-xl text-purple-600 text-sm hover:bg-purple-50 flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5"/>
                  <span>رضيع (0-2)</span>
                </button>
              </div>

              <div className="space-y-2">
                {persons.map((p, i) => {
                  const sameType = persons.slice(0, i).filter(x => x.type === p.type).length + 1;
                  const label = p.type === 'adult' ? `بالغ ${sameType}` : p.type === 'child' ? `طفل ${sameType}` : `رضيع ${sameType}`;
                  const colors = {
                    adult:  { border: 'border-r-4 border-r-blue-400',   bg: 'bg-blue-50',   avatar: 'bg-blue-100 text-blue-700' },
                    child:  { border: 'border-r-4 border-r-amber-400',  bg: 'bg-amber-50',  avatar: 'bg-amber-100 text-amber-700' },
                    infant: { border: 'border-r-4 border-r-purple-400', bg: 'bg-purple-50', avatar: 'bg-purple-100 text-purple-700' },
                  };
                  const c = colors[p.type];
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.border} ${c.bg}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${c.avatar}`}>
                        {p.type === 'adult' ? <User className="w-4 h-4"/> : p.type === 'child' ? <Users className="w-4 h-4"/> : <Baby className="w-4 h-4"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        {p.type !== 'adult' && (
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500">العمر:</span>
                              <input type="number"
                                min={p.type === 'child' ? 3 : 0}
                                max={p.type === 'child' ? 11 : 2}
                                value={p.age || ''}
                                onChange={e => updatePerson(i, { age: Number(e.target.value) })}
                                className="w-14 border p-1 rounded-lg text-xs text-center bg-white"
                                dir="ltr"/>
                              <span className="text-xs text-gray-400">{p.type === 'child' ? '(3-11)' : '(0-2)'}</span>
                            </div>
                            <button
                              onClick={() => updatePerson(i, { extra_bed: !p.extra_bed })}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all
                                ${p.extra_bed
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                              <BedDouble className="w-3 h-3"/>
                              سرير إضافي
                            </button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removePerson(i)}
                        className="p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all shrink-0">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { label: 'بالغين', val: adults, color: 'text-blue-600' },
                  { label: 'أطفال', val: children, color: 'text-amber-600' },
                  { label: 'رضع', val: infants, color: 'text-purple-600' },
                  { label: 'الإجمالي', val: totalPax, color: 'text-emerald-600' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center border">
                    <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: المدن ── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium
                ${citiesNightsSum === totalNights ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  citiesNightsSum > totalNights ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <span>مجموع ليالي المدن</span>
                <span className="font-bold">{citiesNightsSum} / {totalNights} ليلة
                  {citiesNightsSum === totalNights ? ' ✓' :
                   citiesNightsSum > totalNights ? ' تجاوزت' :
                   ` (متبقي ${totalNights - citiesNightsSum})`}
                </span>
              </div>

              {pkgCities.map((c, i) => (
                <div key={i} className="border-2 border-dashed border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                    <select value={c.city_id || ''} onChange={e => {
                        const city = filteredCities.find(fc => fc.id === Number(e.target.value));
                        setPkgCities(prev => prev.map((pc, idx) => idx === i ? {...pc, city_id: Number(e.target.value), city_name: city?.name || ''} : pc));
                      }}
                      className="flex-1 border p-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">-- اختر المدينة --</option>
                      {filteredCities.map(fc => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <Moon className="w-4 h-4 text-gray-400"/>
                      <input type="number" min={1} max={totalNights} value={c.nights}
                        onChange={e => setPkgCities(prev => prev.map((pc, idx) => idx === i ? {...pc, nights: Number(e.target.value)} : pc))}
                        className="w-16 border p-2 rounded-xl text-sm text-center" dir="ltr"/>
                    </div>
                    <button onClick={() => setPkgCities(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}

              <button onClick={() => setPkgCities(prev => [...prev, { city_id: 0, city_name: '', nights: 1, order: prev.length + 1 }])}
                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4"/> إضافة مدينة
              </button>
            </div>
          )}

          {/* ── Step 3: الفنادق ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap bg-gray-50 p-3 rounded-xl border">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gray-400"/>
                  <span className="text-xs text-gray-500">النجوم:</span>
                  {[null,3,4,5].map(s => (
                    <button key={String(s)} onClick={() => setStarFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                        ${starFilter === s ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-gray-200 bg-white hover:border-amber-200 text-gray-500'}`}>
                      {s === null ? 'الكل' : `${s}★`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">نوع الغرفة:</span>
                  <select value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}
                    className="border p-1.5 rounded-lg text-xs bg-white text-gray-700">
                    {['standard','superior','deluxe','suite','twin','triple','family'].map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {pkgCities.map((city, ci) => (
                <div key={ci} className="border rounded-2xl overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2.5 flex items-center justify-between border-b">
                    <span className="font-medium text-blue-800 text-sm flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5"/> {city.city_name} — {city.nights} ليالي
                    </span>
                    <button onClick={() => fetchHotelPrices(ci)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      {loadingPrices ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
                      تحديث الأسعار
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {filteredHotels(city.city_id).length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-6">لا توجد فنادق بهذه المعايير</p>
                    )}
                    {filteredHotels(city.city_id).map(h => {
                      const priceData = hotelPrices[h.id];
                      const isSelected = pkgHotels.some(ph => ph.hotel_id === h.id && ph.package_city_idx === ci + 1);
                      const img = h.image ? (h.image.startsWith('http') ? h.image : `${BASE}${h.image}`) : null;
                      const totalPrice = priceData?.price_myr ? (parseFloat(priceData.price_myr) * city.nights).toFixed(0) : null;
                      const margin = pkgHotels.find(ph => ph.hotel_id === h.id && ph.package_city_idx === ci + 1)?.profit_margin_pct ?? 20;

                      return (
                        <div key={h.id} className={`border rounded-xl overflow-hidden transition-all
                          ${isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex">
                            <div className="w-24 bg-blue-50 flex items-center justify-center shrink-0">
                              {img
                                ? <img src={img} className="w-full h-full object-cover" alt={h.name}/>
                                : <Building2 className="w-8 h-8 text-gray-300"/>
                              }
                            </div>
                            <div className="flex-1 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{h.name}</p>
                                  <div className="flex mt-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s} className={`w-3 h-3 ${s <= h.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}/>
                                    ))}
                                  </div>
                                </div>
                                {priceData?.source === 'contract' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shrink-0">شراكة</span>
                                )}
                              </div>

                              <div className="mt-2 flex items-end justify-between gap-2">
                                <div>
                                  <p className="text-xs text-gray-400">{roomTypeFilter}</p>
                                  {priceData?.price_myr ? (
                                    <div>
                                      <p className="text-xs text-gray-500">RM {parseFloat(priceData.price_myr).toFixed(0)}/ليلة</p>
                                      <p className="font-bold text-emerald-600 text-sm">RM {totalPrice} ({city.nights} ليالي)</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">لا يوجد سعر</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">ربح%</span>
                                      <input type="number" min={0} max={100}
                                        value={margin}
                                        onChange={e => setPkgHotels(prev => prev.map(ph =>
                                          ph.hotel_id === h.id && ph.package_city_idx === ci + 1
                                            ? {...ph, profit_margin_pct: Number(e.target.value)}
                                            : ph
                                        ))}
                                        className="w-14 border p-1 rounded-lg text-xs text-center bg-white"
                                        dir="ltr"/>
                                    </div>
                                  )}
                                  <button onClick={() => {
                                    if (isSelected) {
                                      setPkgHotels(prev => prev.filter(ph => !(ph.hotel_id === h.id && ph.package_city_idx === ci + 1)));
                                    } else {
                                      const today = new Date().toISOString().split('T')[0];
                                      const checkout = new Date(Date.now() + city.nights * 86400000).toISOString().split('T')[0];
                                      setPkgHotels(prev => [...prev, {
                                        temp_id: `${ci}-${h.id}`,
                                        package_city_idx: ci + 1,
                                        hotel_id: h.id, hotel_name: h.name,
                                        hotel_stars: h.stars, hotel_image: h.image,
                                        room_type: roomTypeFilter,
                                        check_in_date: today, check_out_date: checkout,
                                        nights: city.nights,
                                        price_per_room_night_myr: parseFloat(priceData?.price_myr || '0'),
                                        source: priceData?.source || 'manual',
                                        includes_breakfast: priceData?.includes_breakfast || false,
                                        profit_margin_pct: 20,
                                      }]);
                                    }
                                  }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                      ${isSelected
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
                                    {isSelected ? '✓ مختار' : 'اختيار'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 4: الطيران ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400"/>
                <span className="text-sm text-gray-600">فلتر السعر الأقصى (MYR):</span>
                <input type="number" value={flightFilter || ''} onChange={e => setFlightFilter(e.target.value ? Number(e.target.value) : null)}
                  placeholder="بدون حد"
                  className="border p-1.5 rounded-lg text-sm w-28" dir="ltr"/>
              </div>

              {pkgFlights.map((f, i) => (
                <div key={i} className="border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Plane className="w-4 h-4 text-blue-500"/>
                      {f.from_city_name} → {f.to_city_name}
                    </span>
                    <button onClick={() => setPkgFlights(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><label className="text-gray-500">بالغ (MYR)</label>
                      <input type="number" value={f.price_adult_myr}
                        onChange={e => setPkgFlights(prev => prev.map((pf, idx) => idx === i ? {...pf, price_adult_myr: Number(e.target.value)} : pf))}
                        className="w-full border p-2 rounded-lg mt-1" dir="ltr"/></div>
                    <div><label className="text-gray-500">طفل (MYR)</label>
                      <input type="number" value={f.price_child_myr}
                        onChange={e => setPkgFlights(prev => prev.map((pf, idx) => idx === i ? {...pf, price_child_myr: Number(e.target.value)} : pf))}
                        className="w-full border p-2 rounded-lg mt-1" dir="ltr"/></div>
                    <div><label className="text-gray-500">رضيع (MYR)</label>
                      <input type="number" value={f.price_infant_myr}
                        onChange={e => setPkgFlights(prev => prev.map((pf, idx) => idx === i ? {...pf, price_infant_myr: Number(e.target.value)} : pf))}
                        className="w-full border p-2 rounded-lg mt-1" dir="ltr"/></div>
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                    إجمالي الطيران: RM{(f.price_adult_myr * adults + f.price_child_myr * children + f.price_infant_myr * infants).toFixed(0)}
                  </div>
                </div>
              ))}

              {pkgCities.length > 1 && pkgCities.slice(0, -1).map((c, i) => {
                const next = pkgCities[i + 1];
                const exists = pkgFlights.some(f => f.from_city_id === c.city_id && f.to_city_id === next.city_id);
                if (exists) return null;
                return (
                  <button key={i} onClick={() => setPkgFlights(prev => [...prev, {
                      from_city_id: c.city_id, from_city_name: c.city_name,
                      to_city_id: next.city_id, to_city_name: next.city_name,
                      price_adult_myr: 350, price_child_myr: 350, price_infant_myr: 250,
                    }])}
                    className="w-full py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 text-sm hover:bg-blue-50 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> {c.city_name} → {next.city_name}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 5: النقل والجولات ── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Car className="w-4 h-4 text-emerald-600"/> خدمات النقل</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-400"/>
                  <span className="text-xs text-gray-600">حد السعر (MYR):</span>
                  <input type="number" value={transferFilter || ''} onChange={e => setTransferFilter(e.target.value ? Number(e.target.value) : null)}
                    placeholder="بدون حد" className="border p-1.5 rounded-lg text-xs w-24" dir="ltr"/>
                </div>
                <div className="space-y-2">
                  {pkgTransfers.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border rounded-xl p-3">
                      <select value={t.city_id} onChange={e => setPkgTransfers(prev => prev.map((pt, idx) => idx === i ? {...pt, city_id: Number(e.target.value), city_name: pkgCities.find(c => c.city_id === Number(e.target.value))?.city_name || ''} : pt))}
                        className="flex-1 border p-1.5 rounded-lg text-xs bg-white">
                        {pkgCities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
                      </select>
                      <select value={t.transfer_type} onChange={e => setPkgTransfers(prev => prev.map((pt, idx) => idx === i ? {...pt, transfer_type: e.target.value} : pt))}
                        className="border p-1.5 rounded-lg text-xs bg-white">
                        {Object.entries(TRANSFER_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <input type="number" value={t.price_myr} onChange={e => setPkgTransfers(prev => prev.map((pt, idx) => idx === i ? {...pt, price_myr: Number(e.target.value)} : pt))}
                        className="w-20 border p-1.5 rounded-lg text-xs" dir="ltr"/>
                      <span className="text-xs text-gray-400">MYR</span>
                      <button onClick={() => setPkgTransfers(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                  <button onClick={() => {
                      const city = pkgCities[0];
                      if (!city) return;
                      setPkgTransfers(prev => [...prev, { city_id: city.city_id, city_name: city.city_name, transfer_type: 'airport_pickup', price_myr: 100 }]);
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 text-sm hover:bg-emerald-50 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> إضافة نقل
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-purple-600"/> الجولات السياحية</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-400"/>
                  <span className="text-xs text-gray-600">حد السعر (MYR):</span>
                  <input type="number" value={tourFilter || ''} onChange={e => setTourFilter(e.target.value ? Number(e.target.value) : null)}
                    placeholder="بدون حد" className="border p-1.5 rounded-lg text-xs w-24" dir="ltr"/>
                </div>
                <div className="space-y-2">
                  {pkgTours.map((t, i) => (
                    <div key={i} className="bg-gray-50 border rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select value={t.city_id} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, city_id: Number(e.target.value), city_name: pkgCities.find(c => c.city_id === Number(e.target.value))?.city_name || ''} : pt))}
                          className="flex-1 border p-1.5 rounded-lg text-xs bg-white">
                          {pkgCities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
                        </select>
                        <input value={t.tour_name} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, tour_name: e.target.value} : pt))}
                          placeholder="اسم الجولة" className="flex-1 border p-1.5 rounded-lg text-xs"/>
                        <button onClick={() => setPkgTours(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><label className="text-gray-500">بالغ</label>
                          <input type="number" value={t.price_adult_myr} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, price_adult_myr: Number(e.target.value)} : pt))}
                            className="w-full border p-1.5 rounded-lg mt-1" dir="ltr"/></div>
                        <div><label className="text-gray-500">طفل</label>
                          <input type="number" value={t.price_child_myr} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, price_child_myr: Number(e.target.value)} : pt))}
                            className="w-full border p-1.5 rounded-lg mt-1" dir="ltr"/></div>
                        <div><label className="text-gray-500">رضيع</label>
                          <input type="number" value={t.price_infant_myr} onChange={e => setPkgTours(prev => prev.map((pt, idx) => idx === i ? {...pt, price_infant_myr: Number(e.target.value)} : pt))}
                            className="w-full border p-1.5 rounded-lg mt-1" dir="ltr"/></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                      const city = pkgCities[0];
                      if (!city) return;
                      setPkgTours(prev => [...prev, { city_id: city.city_id, city_name: city.city_name, tour_name: '', price_adult_myr: 300, price_child_myr: 0, price_infant_myr: 0 }]);
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 text-sm hover:bg-purple-50 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> إضافة جولة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: المراجعة ── */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-blue-800 flex items-center gap-2"><User className="w-4 h-4"/> بيانات العميل</h3>
                <p className="text-sm"><span className="text-gray-500">الاسم:</span> <span className="font-semibold mr-1">{clientName}</span></p>
                <p className="text-sm"><span className="text-gray-500">الهاتف:</span> <span className="font-semibold mr-1" dir="ltr">{clientPhone}</span></p>
              </div>

              <div className="bg-gray-50 border rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-gray-800">ملخص الرحلة</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">الدولة:</span> <span className="font-semibold mr-1">{countries.find(c => c.id === countryId)?.name}</span></div>
                  <div><span className="text-gray-500">الليالي:</span> <span className="font-semibold mr-1">{totalNights}</span></div>
                  <div><span className="text-gray-500">الأفراد:</span> <span className="font-semibold mr-1">{totalPax} ({adults} بالغ، {children} طفل، {infants} رضيع)</span></div>
                  <div><span className="text-gray-500">المدن:</span> <span className="font-semibold mr-1">{pkgCities.map(c => c.city_name).join('، ')}</span></div>
                  <div><span className="text-gray-500">الفنادق:</span> <span className="font-semibold mr-1">{pkgHotels.length}</span></div>
                  <div><span className="text-gray-500">الجولات:</span> <span className="font-semibold mr-1">{pkgTours.length}</span></div>
                </div>
              </div>

              {calculating && (
                <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin"/> جاري حساب السعر...
                </div>
              )}

              {pricing && !calculating && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2"><Calculator className="w-4 h-4"/> السعر النهائي</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">التكلفة الإجمالية</p>
                      <p className="font-bold text-gray-800">{pricing.total_cost_myr} MYR</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">سعر البيع B2C</p>
                      <p className="text-2xl font-bold text-emerald-600">{pricing.selling_price_b2c_eur} €</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">للشخص B2C</p>
                      <p className="font-bold text-blue-600">{pricing.price_per_pax_b2c_eur} €</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">للوكالات B2B</p>
                      <p className="font-bold text-amber-600">{pricing.selling_price_b2b_eur} €</p>
                    </div>
                  </div>
                  {pricing.breakdown && (
                    <p className="text-xs text-gray-400 text-center">
                      فنادق: {pricing.breakdown.hotels_myr} | طيران: {pricing.breakdown.flights_myr} | نقل: {pricing.breakdown.transfers_myr} | جولات: {pricing.breakdown.tours_myr}
                    </p>
                  )}
                </div>
              )}

              {pricing && (
                <div className="flex gap-3">
                  <button onClick={() => onSuccess()}
                    className="flex-1 py-3 border-2 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Moon className="w-4 h-4"/> حفظ كمسودة
                  </button>
                  <button onClick={handlePublish} disabled={saving}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                    تأكيد الباقة
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {step < 6 && (
          <div className="flex gap-3 p-5 border-t">
            <button onClick={() => { setError(''); setStep(s => Math.max(0, s - 1)); }} disabled={step === 0}
              className="flex items-center gap-2 px-5 py-3 border-2 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4"/> السابق
            </button>
            <button onClick={handleNext} disabled={saving || calculating}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-60">
              {saving || calculating
                ? <><Loader2 className="w-4 h-4 animate-spin"/> {calculating ? 'جاري الحساب...' : 'جاري الحفظ...'}</>
                : <>{step === 5 ? 'حساب السعر والمراجعة' : 'التالي'} <ChevronLeft className="w-4 h-4"/></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}