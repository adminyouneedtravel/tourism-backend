import { apiFetch, BASE } from '../auth/apiFetch';
import { useState, useEffect } from 'react';
import {
  Plus, Search, Upload, Trash2, Edit, ChevronLeft, ChevronRight,
  Grid, List, Star, Building2, MapPin, Globe, CheckCircle2,
  XCircle, AlertTriangle, X, Loader2, BedDouble, Coffee, CalendarDays
} from 'lucide-react';

interface Country { id: number; name: string; }
interface City { id: number; name: string; country: number; }
interface Hotel { id: number; name: string; city: number; country?: string; address: string; stars: number; description?: string; image?: string; }
interface RoomType { id?: number; hotel?: number; name: string; max_occupancy: number; description: string; breakfast_included: boolean; }
interface RoomPrice { id?: number; season?: number; room_type?: number; room_type_name?: string; price_per_night: string; discount_percentage: string; breakfast_included: boolean; child_with_bed_price: string; child_without_bed_price: string; infant_with_bed_price: string; infant_without_bed_price: string; }
interface Season { id?: number; hotel?: number; name: string; valid_from: string; valid_to: string; prices?: RoomPrice[]; }
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

const emptyRoom = (): RoomType => ({ name: '', max_occupancy: 2, description: '', breakfast_included: false });
const emptySeason = (): Season => ({ name: '', valid_from: '', valid_to: '' });
const emptyPrice = (roomTypeId?: number): RoomPrice => ({
  room_type: roomTypeId, price_per_night: '', discount_percentage: '',
  breakfast_included: false, child_with_bed_price: '', child_without_bed_price: '',
  infant_with_bed_price: '', infant_without_bed_price: '',
});

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
          ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
          {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : t.type === 'error' ? <XCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
        </div>
      ))}
    </div>
  );
}

function DeleteModal({ name, onConfirm, onCancel, loading }: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
        <h3 className="text-xl font-bold mb-2">حذف الفندق</h3>
        <p className="text-gray-500 mb-6">هل أنت متأكد من حذف <span className="font-semibold text-gray-800">"{name}"</span>؟</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50">إلغاء</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} حذف
          </button>
        </div>
      </div>
    </div>
  );
}

function StarsDisplay({ count }: { count: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i<=count?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200'}`} />)}</div>;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string|number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
    </div>
  );
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"><Building2 className="w-12 h-12 text-gray-300" /></div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">{hasFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد فنادق بعد'}</h3>
      <p className="text-gray-400 mb-6 max-w-xs">{hasFilters ? 'جرّب تغيير معايير البحث.' : 'ابدأ بإضافة فندق جديد.'}</p>
      {hasFilters && <button onClick={onReset} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">مسح الفلاتر</button>}
    </div>
  );
}

function PriceRow({ label, field, price, onChange }: { label: string; field: keyof RoomPrice; price: RoomPrice; onChange: (p: RoomPrice) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-32 shrink-0">{label}</span>
      <input type="number" value={price[field] as string} placeholder="0.00"
        onChange={e => onChange({ ...price, [field]: e.target.value })}
        className="flex-1 border p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-left" dir="ltr" />
    </div>
  );
}

function SeasonCard({ season, index, rooms, onChange, onRemove }: {
  season: Season; index: number; rooms: RoomType[];
  onChange: (i: number, s: Season) => void; onRemove: (i: number) => void;
}) {
  const [openRoom, setOpenRoom] = useState<number | null>(null);
  const prices: RoomPrice[] = season.prices || [];
  const getPriceForRoom = (roomIdx: number) => prices[roomIdx] || emptyPrice();
  const updatePrice = (roomIdx: number, p: RoomPrice) => {
    const updated = [...prices];
    updated[roomIdx] = p;
    onChange(index, { ...season, prices: updated });
  };

  return (
    <div className="border-2 border-purple-200 rounded-2xl overflow-hidden bg-purple-50/30">
      <div className="flex items-center gap-3 p-4 bg-white border-b">
        <div className="w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{index+1}</div>
        <div className="flex-1 grid grid-cols-3 gap-2">
          <input value={season.name} placeholder="اسم الموسم"
            onChange={e => onChange(index, {...season, name: e.target.value})}
            className="col-span-1 border p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          <input type="date" value={season.valid_from}
            onChange={e => onChange(index, {...season, valid_from: e.target.value})}
            className="border p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          <input type="date" value={season.valid_to}
            onChange={e => onChange(index, {...season, valid_to: e.target.value})}
            className="border p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <button onClick={() => onRemove(index)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-3 space-y-2">
        {rooms.length === 0 ? (
          <p className="text-xs text-center text-gray-400 py-3">أضف أنواع الغرف أولاً</p>
        ) : rooms.map((room, ri) => (
          <div key={ri} className="bg-white rounded-xl border overflow-hidden">
            <button onClick={() => setOpenRoom(openRoom === ri ? null : ri)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{room.name || `غرفة ${ri+1}`}</span>
              </div>
              <div className="flex items-center gap-2">
                {prices[ri]?.price_per_night && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{prices[ri].price_per_night} / ليلة</span>
                )}
                <span className={`text-xs transition-transform ${openRoom === ri ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </button>
            {openRoom === ri && (
              <div className="px-4 pb-4 pt-1 space-y-2 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <label className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={getPriceForRoom(ri).breakfast_included}
                      onChange={e => updatePrice(ri, {...getPriceForRoom(ri), breakfast_included: e.target.checked})}
                      className="w-4 h-4 accent-blue-600" />
                    <Coffee className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium">فطور مشمول</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 shrink-0">خصم %</span>
                    <input type="number" value={getPriceForRoom(ri).discount_percentage} placeholder="0"
                      onChange={e => updatePrice(ri, {...getPriceForRoom(ri), discount_percentage: e.target.value})}
                      className="flex-1 border p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-2">
                  <PriceRow label="🧑 بالغ / ليلة *"         field="price_per_night"         price={getPriceForRoom(ri)} onChange={p => updatePrice(ri, p)} />
                  <PriceRow label="👦 طفل بسرير"              field="child_with_bed_price"     price={getPriceForRoom(ri)} onChange={p => updatePrice(ri, p)} />
                  <PriceRow label="👦 طفل بدون سرير"          field="child_without_bed_price"  price={getPriceForRoom(ri)} onChange={p => updatePrice(ri, p)} />
                  <PriceRow label="👶 رضيع بسرير"             field="infant_with_bed_price"    price={getPriceForRoom(ri)} onChange={p => updatePrice(ri, p)} />
                  <PriceRow label="👶 رضيع بدون سرير"         field="infant_without_bed_price" price={getPriceForRoom(ri)} onChange={p => updatePrice(ri, p)} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HotelsManagement() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<number | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState<number | null>(null);
  const [selectedStarsFilter, setSelectedStarsFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 8 : 12;
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [activeTab, setActiveTab] = useState<'info'|'rooms'|'seasons'>('info');
  const [formData, setFormData] = useState({ name:'', country:'', city:'', address:'', stars:3, description:'' });
  const [hotelImage, setHotelImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const addToast = (type: ToastType, msg: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message: msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cR, ciR, hR] = await Promise.all([
        apiFetch('/api/v1/locations/countries/'),
        apiFetch('/api/v1/locations/cities/'),
        apiFetch('/api/v1/hotels/')
      ]);
      if (cR.ok) setCountries(await cR.json());
      if (ciR.ok) setCities(await ciR.json());
      if (hR.ok) { const d = await hR.json(); setHotels(Array.isArray(d) ? d : d.results || []); }
    } catch { addToast('error', 'تعذّر الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  const hasFilters = !!(searchQuery || selectedCountryFilter || selectedCityFilter || selectedStarsFilter);
  const filteredHotels = hotels.filter(h => {
    const city = cities.find(c => c.id === h.city);
    return (
      (h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.address.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedCountryFilter || city?.country === selectedCountryFilter) &&
      (!selectedCityFilter || h.city === selectedCityFilter) &&
      (!selectedStarsFilter || h.stars === selectedStarsFilter)
    );
  });
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const paginated = filteredHotels.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const resetFilters = () => { setSearchQuery(''); setSelectedCountryFilter(null); setSelectedCityFilter(null); setSelectedStarsFilter(null); setCurrentPage(1); };
  const avgStars = hotels.length ? (hotels.reduce((s,h) => s+h.stars, 0)/hotels.length).toFixed(1) : '0';
  const citiesForModal = cities.filter(c => !formData.country || c.country === Number(formData.country));
  const citiesForFilter = cities.filter(c => !selectedCountryFilter || c.country === selectedCountryFilter);
  const getImg = (p?: string) => !p ? null : p.startsWith('http') ? p : `${BASE}${p}`;

  const handleImg = (f: File|null) => {
    setHotelImage(f);
    if (f) { const r = new FileReader(); r.onload = e => setImagePreview(e.target?.result as string); r.readAsDataURL(f); }
    else setImagePreview(null);
  };

  const fetchHotelData = async (hotelId: number) => {
    const [rR, sR] = await Promise.all([
      apiFetch(`/api/v1/rooms/?hotel=${hotelId}`),
      apiFetch(`/api/v1/pricing/seasons/?hotel=${hotelId}`)
    ]);
    if (rR.ok) setRooms(await rR.json());
    if (sR.ok) setSeasons(await sR.json());
  };

  const openAdd = () => {
    setEditingHotel(null);
    setFormData({ name:'', country:'', city:'', address:'', stars:3, description:'' });
    setHotelImage(null); setImagePreview(null);
    setRooms([]); setSeasons([]); setActiveTab('info');
    setShowModal(true);
  };

  const openEdit = (hotel: Hotel) => {
    const city = cities.find(c => c.id === hotel.city);
    setEditingHotel(hotel);
    setFormData({ name:hotel.name, country:city?.country.toString()||'', city:hotel.city.toString(), address:hotel.address, stars:hotel.stars, description:hotel.description||'' });
    setHotelImage(null); setImagePreview(getImg(hotel.image));
    setRooms([]); setSeasons([]); setActiveTab('info');
    fetchHotelData(hotel.id);
    setShowModal(true);
  };

  const saveAll = async () => {
    if (!formData.name.trim() || !formData.city) {
      addToast('warning', 'يرجى إدخال اسم الفندق واختيار المدينة');
      return;
    }
    setSaving(true);
    try {
      // 1. حفظ الفندق
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('city', formData.city);
      fd.append('address', formData.address || '-');
      fd.append('stars', formData.stars.toString());
      if (formData.description) fd.append('description', formData.description);
      if (hotelImage) fd.append('image', hotelImage);

      const hRes = await apiFetch(
        editingHotel ? `/api/v1/hotels/${editingHotel.id}/` : `/api/v1/hotels/`,
        { method: editingHotel ? 'PUT' : 'POST', body: fd }
      );
      if (!hRes.ok) {
        const err = await hRes.json().catch(() => ({}));
        console.error('Hotel error:', err);
        addToast('error', 'فشل حفظ الفندق');
        setSaving(false);
        return;
      }
      const hotel = await hRes.json();
      setHotels(p => editingHotel ? p.map(h => h.id === hotel.id ? hotel : h) : [...p, hotel]);

      // 2. حفظ الغرف
      const savedRooms: RoomType[] = [];
      for (const room of rooms) {
        const isEdit = !!room.id;
        const roomFd = new FormData();
        roomFd.append('name', room.name);
        roomFd.append('max_occupancy', room.max_occupancy.toString());
        roomFd.append('description', room.description || '');
        roomFd.append('breakfast_included', room.breakfast_included.toString());
        roomFd.append('hotel', hotel.id.toString());
        if ((room as any).imageFile) roomFd.append('image', (room as any).imageFile);

        const r = await apiFetch(
          isEdit ? `/api/v1/rooms/${room.id}/` : `/api/v1/rooms/`,
          { method: isEdit ? 'PUT' : 'POST', body: roomFd }
        );
        if (r.ok) savedRooms.push(await r.json());
        else { const err = await r.json().catch(() => ({})); console.error('Room error:', err); }
      }

      // 3. حفظ المواسم + الأسعار
      for (let si = 0; si < seasons.length; si++) {
        const season = seasons[si];
        if (!season.name || !season.valid_from || !season.valid_to) continue;
        const isEdit = !!season.id;

        const sRes = await apiFetch(
          isEdit ? `/api/v1/pricing/seasons/${season.id}/` : `/api/v1/pricing/seasons/`,
          {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: season.name, valid_from: season.valid_from, valid_to: season.valid_to, hotel: hotel.id })
          }
        );
        if (!sRes.ok) { const err = await sRes.json().catch(() => ({})); console.error('Season error:', err); continue; }
        const savedSeason = await sRes.json();

        const seasonPrices = season.prices || [];
        for (let ri = 0; ri < savedRooms.length; ri++) {
          const price = seasonPrices[ri];
          if (!price?.price_per_night) continue;
          const room = savedRooms[ri];
          const pRes = await apiFetch('/api/v1/pricing/room-prices/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              season: savedSeason.id,
              room_type: room.id,
              price_per_night: price.price_per_night,
              discount_percentage: price.discount_percentage || '0',
              breakfast_included: price.breakfast_included,
              child_with_bed_price: price.child_with_bed_price || '0',
              child_without_bed_price: price.child_without_bed_price || '0',
              infant_with_bed_price: price.infant_with_bed_price || '0',
              infant_without_bed_price: price.infant_without_bed_price || '0',
            })
          });
          if (!pRes.ok) { const err = await pRes.json().catch(() => ({})); console.error('Price error:', err); }
        }
      }

      setShowModal(false);
      addToast('success', editingHotel
        ? `✅ تم تعديل "${hotel.name}" بنجاح`
        : `✅ تمت إضافة "${hotel.name}" مع ${savedRooms.length} غرفة و ${seasons.length} موسم`
      );
    } catch (e) {
      console.error(e);
      addToast('error', 'خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const r = await apiFetch(`/api/v1/hotels/${deleteTarget.id}/`, { method: 'DELETE' });
      if (r.ok) { setHotels(p => p.filter(h => h.id !== deleteTarget.id)); addToast('success', `✅ تم حذف "${deleteTarget.name}"`); }
      else addToast('error', 'فشل الحذف');
    } catch { addToast('error', 'خطأ في الاتصال'); }
    finally { setDeletingId(null); setDeleteTarget(null); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-64 gap-4"><Loader2 className="w-10 h-10 text-blue-500 animate-spin"/><p className="text-gray-500">جاري التحميل...</p></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
      <ToastContainer toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">إدارة الفنادق</h1><p className="text-sm text-gray-500 mt-1">إدارة الفنادق والغرف والأسعار الموسمية</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> إضافة فندق
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Building2 className="w-6 h-6 text-blue-600"/>} label="إجمالي الفنادق" value={hotels.length} color="bg-blue-50"/>
        <StatCard icon={<Star className="w-6 h-6 text-amber-500"/>} label="متوسط النجوم" value={`${avgStars} ★`} color="bg-amber-50"/>
        <StatCard icon={<MapPin className="w-6 h-6 text-orange-600"/>} label="نتائج الفلتر" value={filteredHotels.length} color="bg-orange-50"/>
      </div>

      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
          <input type="text" placeholder="ابحث..." value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setCurrentPage(1);}}
            className="w-full pr-10 pl-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
        </div>
        <select value={selectedCountryFilter||''} onChange={e=>{setSelectedCountryFilter(e.target.value?Number(e.target.value):null);setSelectedCityFilter(null);setCurrentPage(1);}}
          className="border p-2.5 rounded-xl text-sm md:w-40 w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">كل الدول</option>{countries.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedCityFilter||''} onChange={e=>{setSelectedCityFilter(e.target.value?Number(e.target.value):null);setCurrentPage(1);}}
          className="border p-2.5 rounded-xl text-sm md:w-40 w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">كل المدن</option>{citiesForFilter.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedStarsFilter||''} onChange={e=>{setSelectedStarsFilter(e.target.value?Number(e.target.value):null);setCurrentPage(1);}}
          className="border p-2.5 rounded-xl text-sm md:w-36 w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">كل النجوم</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} ★</option>)}
        </select>
        <div className="flex border rounded-xl overflow-hidden shrink-0">
          <button onClick={()=>{setViewMode('card');setCurrentPage(1);}} className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode==='card'?'bg-blue-600 text-white':'hover:bg-gray-50'}`}>
            <Grid className="w-4 h-4"/> بطاقات
          </button>
          <button onClick={()=>{setViewMode('table');setCurrentPage(1);}} className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode==='table'?'bg-blue-600 text-white':'hover:bg-gray-50'}`}>
            <List className="w-4 h-4"/> جدول
          </button>
        </div>
        {hasFilters && <button onClick={resetFilters} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 whitespace-nowrap shrink-0">مسح الفلاتر</button>}
      </div>

      {viewMode==='card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginated.length===0 ? <EmptyState hasFilters={hasFilters} onReset={resetFilters}/> :
            paginated.map(hotel => {
              const city = cities.find(c => c.id === hotel.city);
              const country = countries.find(c => c.id === city?.country);
              const img = getImg(hotel.image);
              return (
                <div key={hotel.id} className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {img ? <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={hotel.name}/>
                      : <div className="w-full h-full flex flex-col items-center justify-center text-gray-300"><Building2 className="w-12 h-12 mb-1"/><span className="text-xs">بدون صورة</span></div>}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={()=>openEdit(hotel)} className="bg-white text-blue-600 p-2.5 rounded-full hover:bg-blue-50 shadow-lg"><Edit className="w-4 h-4"/></button>
                      <button onClick={()=>setDeleteTarget(hotel)} className="bg-white text-red-500 p-2.5 rounded-full hover:bg-red-50 shadow-lg"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400"/><span className="text-xs font-bold text-gray-700">{hotel.stars}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base">{hotel.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs"><MapPin className="w-3.5 h-3.5"/><span>{city?.name}{country ? ` · ${country.name}` : ''}</span></div>
                    <div className="mt-2"><StarsDisplay count={hotel.stars}/></div>
                    {hotel.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{hotel.description}</p>}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {viewMode==='table' && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{['الصورة','اسم الفندق','المدينة','الدولة','النجوم','العنوان','إجراءات'].map(h=>(
                <th key={h} className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length===0 ? <tr><td colSpan={7}><EmptyState hasFilters={hasFilters} onReset={resetFilters}/></td></tr> :
                paginated.map(hotel => {
                  const city = cities.find(c => c.id === hotel.city);
                  const country = countries.find(c => c.id === city?.country);
                  const img = getImg(hotel.image);
                  return (
                    <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">{img?<img src={img} className="w-11 h-11 object-cover rounded-xl shadow-sm" alt=""/>:<div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-gray-300"/></div>}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900 text-sm">{hotel.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{city?.name||'—'}</td>
                      <td className="px-5 py-3">{country&&<span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full"><Globe className="w-3 h-3"/>{country.name}</span>}</td>
                      <td className="px-5 py-3"><StarsDisplay count={hotel.stars}/></td>
                      <td className="px-5 py-3 text-sm text-gray-500 max-w-[180px] truncate">{hotel.address||'—'}</td>
                      <td className="px-5 py-3"><div className="flex gap-2">
                        <button onClick={()=>openEdit(hotel)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4"/></button>
                        <button onClick={()=>setDeleteTarget(hotel)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                      </div></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages>1 && (
        <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">عرض {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage,filteredHotels.length)} من {filteredHotels.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1} className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50"><ChevronRight className="w-4 h-4"/>السابق</button>
            <div className="flex gap-1">{Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setCurrentPage(p)} className={`w-9 h-9 rounded-xl text-sm font-medium ${currentPage===p?'bg-blue-600 text-white':'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}</div>
            <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages} className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">التالي<ChevronLeft className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {deleteTarget && <DeleteModal name={deleteTarget.name} loading={deletingId===deleteTarget.id} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)}/>}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">

            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingHotel ? 'تعديل الفندق' : 'إضافة فندق جديد'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
            </div>

            <div className="flex border-b px-6 gap-1">
              {([
                { key:'info',    label:'معلومات الفندق',   icon:<Building2 className="w-4 h-4"/>,   badge:0 },
                { key:'rooms',   label:'أنواع الغرف',      icon:<BedDouble className="w-4 h-4"/>,   badge:rooms.length },
                { key:'seasons', label:'المواسم والأسعار', icon:<CalendarDays className="w-4 h-4"/>, badge:seasons.length },
              ] as any[]).map(tab => (
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                    ${activeTab===tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab.icon} {tab.label}
                  {tab.badge > 0 && <span className="bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 p-6">

              {activeTab==='info' && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الفندق *</label>
                    <input value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="مثال: فندق ماريوت"/></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">الدولة</label>
                    <select value={formData.country} onChange={e=>setFormData({...formData,country:e.target.value,city:''})} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                      <option value="">-- اختر الدولة --</option>{countries.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">المدينة *</label>
                    <select value={formData.city} onChange={e=>setFormData({...formData,city:e.target.value})} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                      <option value="">-- اختر المدينة --</option>{citiesForModal.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان</label>
                    <input value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="مثال: شارع بوكيت بينتانج"/></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">عدد النجوم</label>
                    <div className="flex gap-2">{[1,2,3,4,5].map(n=>(
                      <button key={n} type="button" onClick={()=>setFormData({...formData,stars:n})}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${formData.stars===n?'border-amber-400 bg-amber-50 text-amber-600':'border-gray-200 hover:border-amber-200'}`}>
                        {n} ★
                      </button>
                    ))}</div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">وصف الفندق</label>
                    <textarea value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" rows={3} placeholder="اكتب وصفاً مختصراً..."/></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">صورة الفندق</label>
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={e=>handleImg(e.target.files?.[0]||null)}/>
                      {imagePreview
                        ? <div className="relative rounded-xl overflow-hidden h-40 border-2 border-blue-300">
                            <img src={imagePreview} className="w-full h-full object-cover" alt="preview"/>
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">تغيير الصورة</span>
                            </div>
                          </div>
                        : <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                            <p className="text-sm text-gray-500">اضغط لرفع صورة</p>
                          </div>
                      }
                    </label></div>
                </div>
              )}

              {activeTab==='rooms' && (
                <div className="space-y-4">
                  {rooms.length===0 && (
                    <div className="text-center py-10 text-gray-400">
                      <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
                      <p className="text-sm">لا توجد غرف بعد</p>
                    </div>
                  )}
                  {rooms.map((room,i) => (
                    <div key={i} className="border-2 border-dashed border-blue-200 rounded-2xl p-4 bg-blue-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i+1}</div>
                          <span className="text-sm font-semibold text-blue-700">نوع غرفة {i+1}</span>
                        </div>
                        <button onClick={()=>setRooms(p=>p.filter((_,idx)=>idx!==i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <input value={room.name} placeholder="اسم الغرفة (مثال: غرفة مزدوجة)"
                            onChange={e=>setRooms(p=>p.map((r,idx)=>idx===i?{...r,name:e.target.value}:r))}
                            className="w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">أقصى نزلاء</label>
                          <input type="number" min={1} max={10} value={room.max_occupancy}
                            onChange={e=>setRooms(p=>p.map((r,idx)=>idx===i?{...r,max_occupancy:Number(e.target.value)}:r))}
                            className="w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">وصف</label>
                          <input value={room.description} placeholder="اختياري"
                            onChange={e=>setRooms(p=>p.map((r,idx)=>idx===i?{...r,description:e.target.value}:r))}
                            className="w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 mb-1 block">صورة الغرفة</label>
                          <label className="block cursor-pointer">
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0] || null;
                                const reader = new FileReader();
                                reader.onload = ev => setRooms(p => p.map((r,idx) => idx===i ? {...r, imageFile:file, imagePreview:ev.target?.result as string} : r));
                                if (file) reader.readAsDataURL(file);
                                else setRooms(p => p.map((r,idx) => idx===i ? {...r, imageFile:null, imagePreview:null} : r));
                              }}/>
                            {(room as any).imagePreview || (room as any).image
                              ? <div className="relative rounded-xl overflow-hidden h-28 border-2 border-blue-300">
                                  <img src={(room as any).imagePreview || getImg((room as any).image)} className="w-full h-full object-cover" alt="preview"/>
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-lg">تغيير الصورة</span>
                                  </div>
                                </div>
                              : <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                  <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1"/>
                                  <p className="text-xs text-gray-400">اضغط لرفع صورة الغرفة</p>
                                </div>
                            }
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>setRooms(p=>[...p,emptyRoom()])}
                    className="w-full py-3 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> إضافة نوع غرفة
                  </button>
                </div>
              )}

              {activeTab==='seasons' && (
                <div className="space-y-4">
                  {rooms.length===0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2"/>
                      <p className="text-sm text-amber-700 font-medium">يجب إضافة أنواع الغرف أولاً</p>
                      <button onClick={()=>setActiveTab('rooms')} className="mt-2 text-xs text-amber-600 underline">اذهب إلى تبويب الغرف</button>
                    </div>
                  )}
                  {seasons.map((season,i) => (
                    <SeasonCard key={i} season={season} index={i} rooms={rooms}
                      onChange={(idx,s) => setSeasons(p => p.map((se,si) => si===idx ? s : se))}
                      onRemove={idx => setSeasons(p => p.filter((_,si) => si!==idx))}/>
                  ))}
                  <button onClick={()=>setSeasons(p=>[...p,emptySeason()])}
                    className="w-full py-3 border-2 border-dashed border-purple-300 rounded-2xl text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4"/> إضافة موسم
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={()=>setShowModal(false)} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
              <button onClick={saveAll} disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>جاري الحفظ...</> : <><Plus className="w-4 h-4"/>{editingHotel ? 'حفظ التعديلات' : 'حفظ الفندق'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}