import { useState, useEffect } from 'react';
import { apiFetch } from '../auth/apiFetch';
import {
  Building2, Plus, Edit3, Trash2, Save, X, Loader2,
  CheckCircle2, XCircle, AlertTriangle, Star, MapPin,
  Phone, Calendar, Moon, Tag, ChevronDown, ChevronUp,
  Wifi, Car, Waves, Users, Coffee
} from 'lucide-react';

interface Hotel {
  id: number; name: string; city: number; city_name: string;
  country: string; address: string; stars: number;
  description: string; image: string | null;
  latitude: string | null; longitude: string | null;
  amenities: string[]; phone: string; email: string;
  website: string; provider_type: string; is_active: boolean;
}
interface RoomType {
  id: number; hotel: number; name: string;
  max_occupancy: number; description: string;
}
interface Season {
  id: number; hotel: number; hotel_name: string;
  name: string; valid_from: string; valid_to: string;
  prices: RoomPrice[];
}
interface RoomPrice {
  id: number; season: number; room_type: number; room_type_name: string;
  price_per_night: string; discount_percentage: string | null;
  breakfast_included: boolean;
  child_with_bed_price: string | null; child_without_bed_price: string | null;
  infant_with_bed_price: string | null; infant_without_bed_price: string | null;
}
interface City { id: number; name: string; }
type Toast = { id: number; type: 'success'|'error'|'warning'; message: string; };

const AMENITIES = [
  { key: 'wifi', label: 'واي فاي', icon: Wifi },
  { key: 'pool', label: 'مسبح', icon: Waves },
  { key: 'parking', label: 'موقف', icon: Car },
  { key: 'gym', label: 'صالة', icon: Users },
  { key: 'restaurant', label: 'مطعم', icon: Coffee },
];

function ToastNotif({ toasts, remove }: { toasts: Toast[]; remove: (id:number)=>void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
          ${t.type==='success'?'bg-emerald-500':t.type==='error'?'bg-red-500':'bg-amber-500'}`}>
          {t.type==='success'?<CheckCircle2 className="w-4 h-4"/>:t.type==='error'?<XCircle className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={()=>remove(t.id)}><X className="w-4 h-4 opacity-70"/></button>
        </div>
      ))}
    </div>
  );
}

function SeasonFormModal({ hotelId, season, roomTypes, onClose, onSave }:
  { hotelId: number; season: Season|null; roomTypes: RoomType[]; onClose:()=>void; onSave:()=>void }) {
  const [form, setForm] = useState({ name: season?.name||'', valid_from: season?.valid_from||'', valid_to: season?.valid_to||'' });
  const [prices, setPrices] = useState<Record<number, any>>(
    season?.prices.reduce((acc, p) => ({ ...acc, [p.room_type]: p }), {}) || {}
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      let seasonId = season?.id;
      if (!seasonId) {
        const res = await apiFetch('/api/v1/pricing/seasons/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...form, hotel: hotelId}) });
        if (!res.ok) { setLoading(false); return; }
        seasonId = (await res.json()).id;
      } else {
        await apiFetch(`/api/v1/pricing/seasons/${seasonId}/`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      }
      for (const [roomTypeId, price] of Object.entries(prices)) {
        if (!price.price_per_night) continue;
        const existing = season?.prices.find(p => p.room_type === Number(roomTypeId));
        if (existing) {
          await apiFetch(`/api/v1/pricing/room-prices/${existing.id}/`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...price, season: seasonId, room_type: Number(roomTypeId)}) });
        } else {
          await apiFetch('/api/v1/pricing/room-prices/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...price, season: seasonId, room_type: Number(roomTypeId)}) });
        }
      }
      onSave(); onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold">{season ? 'تعديل موسم' : 'موسم جديد'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs font-medium text-gray-600 block mb-1.5">اسم الموسم</label>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="موسم الصيف 2026"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
            <div><label className="text-xs font-medium text-gray-600 block mb-1.5">من</label>
              <input type="date" value={form.valid_from} onChange={e=>setForm(p=>({...p,valid_from:e.target.value}))} dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
            <div><label className="text-xs font-medium text-gray-600 block mb-1.5">إلى</label>
              <input type="date" value={form.valid_to} onChange={e=>setForm(p=>({...p,valid_to:e.target.value}))} dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">أسعار الغرف</p>
            {roomTypes.length === 0
              ? <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl text-sm">أضف غرف للفندق أولاً</div>
              : <div className="space-y-3">
                  {roomTypes.map(rt => (
                    <div key={rt.id} className="border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-blue-600"/>
                        <p className="text-sm font-semibold">{rt.name}</p>
                        <p className="text-xs text-gray-400">— أقصى {rt.max_occupancy} نزلاء</p>
                        <div className="mr-auto flex items-center gap-2">
                          <span className="text-xs text-gray-400">فطور</span>
                          <button onClick={()=>setPrices(p=>({...p,[rt.id]:{...p[rt.id],breakfast_included:!p[rt.id]?.breakfast_included}}))}
                            className={`relative w-10 h-5 rounded-full transition-colors ${prices[rt.id]?.breakfast_included?'bg-emerald-500':'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${prices[rt.id]?.breakfast_included?'right-0.5':'left-0.5'}`}/>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {key:'price_per_night', label:'سعر الليلة *'},
                          {key:'child_with_bed_price', label:'طفل بسرير'},
                          {key:'child_without_bed_price', label:'طفل بدون سرير'},
                          {key:'infant_with_bed_price', label:'رضيع بسرير'},
                          {key:'infant_without_bed_price', label:'رضيع بدون سرير'},
                          {key:'discount_percentage', label:'خصم %'},
                        ].map(f => (
                          <div key={f.key}>
                            <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                            <input type="number" min="0" step="0.01" dir="ltr"
                              value={(prices[rt.id] as any)?.[f.key] || ''}
                              onChange={e=>setPrices(p=>({...p,[rt.id]:{...p[rt.id],[f.key]:e.target.value}}))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium">إلغاء</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>} حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function SeasonsPanel({ hotel, onClose }: { hotel: Hotel; onClose:()=>void }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSeason, setEditSeason] = useState<Season|null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [sRes, rRes] = await Promise.all([
      apiFetch(`/api/v1/pricing/seasons/?hotel=${hotel.id}`),
      apiFetch(`/api/v1/rooms/?hotel=${hotel.id}`),
    ]);
    if (sRes.ok) { const d = await sRes.json(); setSeasons(Array.isArray(d)?d:d.results||[]); }
    if (rRes.ok) { const d = await rRes.json(); setRoomTypes(Array.isArray(d)?d:d.results||[]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold">مواسم وأسعار — {hotel.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{roomTypes.length} نوع غرفة</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{setEditSeason(null);setShowForm(true);}}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4"/> موسم جديد
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
            : seasons.length === 0
              ? <div className="text-center py-16 text-gray-400"><Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200"/><p className="text-sm">لا توجد مواسم</p></div>
              : <div className="space-y-4">
                  {seasons.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Moon className="w-4 h-4 text-blue-600"/>
                          <div>
                            <p className="font-semibold text-sm">{s.name}</p>
                            <p className="text-xs text-gray-400" dir="ltr">{s.valid_from} → {s.valid_to}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>{setEditSeason(s);setShowForm(true);}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button onClick={async()=>{ await apiFetch(`/api/v1/pricing/seasons/${s.id}/`,{method:'DELETE'}); fetchData(); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                      {s.prices.length > 0 && (
                        <div className="px-5 py-3 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead><tr className="text-gray-400 border-b border-gray-100">
                              <th className="text-right py-2 font-medium">نوع الغرفة</th>
                              <th className="text-right py-2 font-medium">الليلة</th>
                              <th className="text-right py-2 font-medium">طفل بسرير</th>
                              <th className="text-right py-2 font-medium">طفل بدون</th>
                              <th className="text-right py-2 font-medium">خصم</th>
                              <th className="text-right py-2 font-medium">فطور</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-50">
                              {s.prices.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                  <td className="py-2 font-medium">{p.room_type_name}</td>
                                  <td className="py-2 text-emerald-600 font-semibold">{parseFloat(p.price_per_night).toLocaleString()} MYR</td>
                                  <td className="py-2">{p.child_with_bed_price ? `${parseFloat(p.child_with_bed_price).toLocaleString()}` : '—'}</td>
                                  <td className="py-2">{p.child_without_bed_price ? `${parseFloat(p.child_without_bed_price).toLocaleString()}` : '—'}</td>
                                  <td className="py-2">{p.discount_percentage ? `${p.discount_percentage}%` : '—'}</td>
                                  <td className="py-2">{p.breakfast_included ? '✓' : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
          }
        </div>
      </div>
      {showForm && <SeasonFormModal hotelId={hotel.id} season={editSeason} roomTypes={roomTypes} onClose={()=>{setShowForm(false);setEditSeason(null);}} onSave={fetchData}/>}
    </div>
  );
}

export function ExtranetManagement() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [seasonHotel, setSeasonHotel] = useState<Hotel|null>(null);
  const [expanded, setExpanded] = useState<number|null>(null);
  const [search, setSearch] = useState('');

  const addToast = (type: Toast['type'], msg: string) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,type,message:msg}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  };

  const fetchHotels = async () => {
    const [hRes, cRes] = await Promise.all([apiFetch('/api/v1/hotels/'), apiFetch('/api/v1/locations/cities/')]);
    if (hRes.ok) { const d = await hRes.json(); setHotels(Array.isArray(d)?d:d.results||[]); }
    if (cRes.ok) { const d = await cRes.json(); setCities(Array.isArray(d)?d:d.results||[]); }
    setLoading(false);
  };

  useEffect(() => { fetchHotels(); }, []);

  const filtered = hotels.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.city_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 text-blue-500 animate-spin"/></div>;

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen -m-8 p-8" dir="rtl">
      <ToastNotif toasts={toasts} remove={id=>setToasts(p=>p.filter(t=>t.id!==id))}/>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Extranet — إدارة الفنادق المباشرة</h1>
          <p className="text-gray-500 text-sm mt-0.5">إدخال وتعديل أسعار العقود المباشرة</p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث باسم الفندق أو المدينة..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
      <div className="space-y-3">
        {filtered.length === 0
          ? <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center py-20 text-gray-400">
              <Building2 className="w-12 h-12 mb-3 text-gray-200"/>
              <p className="text-sm">لا توجد فنادق</p>
            </div>
          : filtered.map(h => (
            <div key={h.id} className={`bg-white border rounded-2xl overflow-hidden ${h.is_active?'border-gray-200':'border-gray-100 opacity-60'}`}>
              <div className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{h.name}</p>
                    <div className="flex">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=h.stars?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200'}`}/>)}</div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{h.provider_type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin className="w-3 h-3"/>{h.city_name}</span>
                    {h.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="w-3 h-3"/>{h.phone}</span>}
                  </div>
                  {h.amenities?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {h.amenities.map(a => {
                        const cfg = AMENITIES.find(x=>x.key===a);
                        const Icon = cfg?.icon;
                        return Icon ? <span key={a} className="flex items-center gap-1 text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg border border-gray-100"><Icon className="w-3 h-3"/>{cfg.label}</span> : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={()=>setSeasonHotel(h)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium hover:bg-emerald-100">
                    <Calendar className="w-3.5 h-3.5"/> المواسم والأسعار
                  </button>
                  <button onClick={()=>setExpanded(expanded===h.id?null:h.id)} className="p-2 hover:bg-gray-50 rounded-xl">
                    {expanded===h.id?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              {expanded===h.id && (
                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50 text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
                  {h.latitude && <div><span className="text-gray-400">خط العرض: </span><span className="font-mono">{h.latitude}</span></div>}
                  {h.longitude && <div><span className="text-gray-400">خط الطول: </span><span className="font-mono">{h.longitude}</span></div>}
                  {h.email && <div>{h.email}</div>}
                  {h.website && <div>{h.website}</div>}
                  {h.description && <div className="col-span-4 text-gray-500">{h.description}</div>}
                </div>
              )}
            </div>
          ))
        }
      </div>
      {seasonHotel && <SeasonsPanel hotel={seasonHotel} onClose={()=>setSeasonHotel(null)}/>}
    </div>
  );
}
