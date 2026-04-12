import { apiFetch, BASE } from '../auth/apiFetch';
import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Loader2, CheckCircle2, XCircle,
  AlertTriangle, MapPin, Building2, Star, ChevronLeft, ChevronRight,
  Grid, List, Globe, Upload, ToggleLeft, ToggleRight, BedDouble,
  Briefcase, Tag, Calendar, Moon, Package, Eye, ChevronDown, ChevronUp,
  Sparkles, Users, UserPlus
} from 'lucide-react';
import { BookingWizard } from './BookingWizard';
import { CustomPackageWizard } from './CustomPackageWizard';
import type { AuthUser } from '../auth/authService';

// ─── Types ────────────────────────────────────────────────
interface Country { id: number; name: string; }
interface City { id: number; name: string; country: number; image?: string; }
interface Hotel { id: number; name: string; city: number; stars: number; image?: string; }
interface Service { id: number; name: string; category: number; city: number; base_price: string; currency: string; is_optional: boolean; }
interface AgencyUser { id: number; username: string; first_name: string; last_name: string; email: string; role: string; is_active: boolean; }

interface PackageCityService { id?: number; service: number; service_name?: string; service_category?: string; custom_price?: string; }
interface PackageCityHotel { id?: number; hotel: number; hotel_name?: string; hotel_stars?: number; nights: number; }
interface PackageCity {
  id?: number; city: number; city_name?: string; country_name?: string;
  city_image?: string; nights: number;
  hotels: PackageCityHotel[]; services: PackageCityService[];
}
interface TourPackage {
  id: number; name: string; slug: string; description: string;
  base_price: string; currency: string; discount_percentage?: string;
  image?: string; image_url?: string; highlights: string;
  is_active: boolean; is_customizable: boolean;
  cities: PackageCity[]; total_nights: number; cities_count: number; final_price: number;
}
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; type: ToastType; message: string; }

// ─── Helpers ──────────────────────────────────────────────
const getImg = (p?: string) => !p ? null : p.startsWith('http') ? p : `${BASE}${p}`;
const autoSlug = (n: string) => n.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// ─── Toast ────────────────────────────────────────────────
function ToastNotif({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
          ${t.type==='success'?'bg-emerald-500':t.type==='error'?'bg-red-500':'bg-amber-500'}`}>
          {t.type==='success'?<CheckCircle2 className="w-5 h-5 shrink-0"/>:t.type==='error'?<XCircle className="w-5 h-5 shrink-0"/>:<AlertTriangle className="w-5 h-5 shrink-0"/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={()=>remove(t.id)}><X className="w-4 h-4 opacity-70 hover:opacity-100"/></button>
        </div>
      ))}
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, loading }: { name:string; onConfirm:()=>void; onCancel:()=>void; loading:boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-500"/></div>
        <h3 className="text-xl font-bold mb-2">حذف الباقة</h3>
        <p className="text-gray-500 mb-6">هل أنت متأكد من حذف <span className="font-semibold text-gray-800">"{name}"</span>؟</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50">إلغاء</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<Trash2 className="w-4 h-4"/>} حذف
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string|number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
    </div>
  );
}

// ─── Agency Package Card (للوكالة فقط) ───────────────────
function AgencyPackageCard({ pkg, commissionRate, onBook, onView }: {
  pkg: TourPackage; commissionRate: number; onBook: () => void; onView: () => void;
}) {
  const img = pkg.image_url || getImg(pkg.image);
  const hasDiscount = !!pkg.discount_percentage && parseFloat(pkg.discount_percentage) > 0;
  const commission = (pkg.final_price * commissionRate / 100).toFixed(0);

  return (
    <div className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image */}
      <div className="h-44 bg-gradient-to-br from-emerald-100 to-teal-200 relative overflow-hidden cursor-pointer" onClick={onView}>
        {img
          ? <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={pkg.name}/>
          : <div className="w-full h-full flex flex-col items-center justify-center text-emerald-300"><Package className="w-14 h-14 mb-1"/></div>
        }
        {/* Badges */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow ${pkg.is_customizable?'bg-purple-500 text-white':'bg-emerald-500 text-white'}`}>
            {pkg.is_customizable ? '✨ مخصصة' : '📦 ثابتة'}
          </span>
        </div>
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white shadow">-{pkg.discount_percentage}%</span>
          </div>
        )}
        {/* Hover overlay — عرض فقط */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button onClick={e=>{e.stopPropagation();onView();}}
            className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg hover:bg-emerald-50">
            <Eye className="w-4 h-4"/> معاينة
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{pkg.name || pkg.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{pkg.description}</p>

        {/* Cities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {pkg.cities.slice(0,3).map((c,i)=>(
            <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3"/> {c.city_name}
            </span>
          ))}
          {pkg.cities.length > 3 && <span className="text-xs text-gray-400 px-2 py-1">+{pkg.cities.length-3}</span>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3"/> {pkg.cities_count} مدينة</span>
          <span className="flex items-center gap-1"><Moon className="w-3 h-3"/> {pkg.total_nights} ليلة</span>
        </div>

        {/* Price + Commission */}
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">سعر الباقة</span>
            <div className="flex items-baseline gap-1">
              {hasDiscount && <span className="text-xs line-through text-gray-400">{pkg.base_price}</span>}
              <span className="text-lg font-bold text-emerald-600">{(pkg.final_price ?? 0).toFixed(0)}</span>
              <span className="text-xs text-gray-500">{pkg.currency}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">عمولتك ({commissionRate}%)</span>
            <span className="text-sm font-bold text-amber-600">+{commission} {pkg.currency}</span>
          </div>
        </div>

        {/* Book Button */}
        <button onClick={onBook}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors
            ${pkg.is_customizable
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
          {pkg.is_customizable ? '✨ تخصيص وحجز' : '📦 حجز الباقة'}
        </button>
      </div>
    </div>
  );
}

// ─── Admin Package Card ───────────────────────────────────
function PackageCard({ pkg, onEdit, onDelete, onView, onBook }: {
  pkg: TourPackage; onEdit:()=>void; onDelete:()=>void; onView:()=>void; onBook:()=>void;
}) {
  const img = pkg.image_url || getImg(pkg.image);
  const hasDiscount = !!pkg.discount_percentage && parseFloat(pkg.discount_percentage) > 0;
  return (
    <div className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={onView}>
      <div className="h-44 bg-gradient-to-br from-emerald-100 to-teal-200 relative overflow-hidden">
        {img ? <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={pkg.name}/>
          : <div className="w-full h-full flex flex-col items-center justify-center text-emerald-300"><Package className="w-14 h-14 mb-1"/><span className="text-xs">بدون صورة</span></div>}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow ${pkg.is_active?'bg-emerald-500 text-white':'bg-gray-400 text-white'}`}>
            {pkg.is_active ? 'نشطة' : 'غير نشطة'}
          </span>
        </div>
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white shadow">-{pkg.discount_percentage}%</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
          onClick={e=>e.stopPropagation()}>
          <button onClick={onView} className="bg-white text-emerald-600 p-2.5 rounded-full hover:bg-emerald-50 shadow-lg"><Eye className="w-4 h-4"/></button>
          <button onClick={onEdit} className="bg-white text-blue-600 p-2.5 rounded-full hover:bg-blue-50 shadow-lg"><Edit className="w-4 h-4"/></button>
          <button onClick={onDelete} className="bg-white text-red-500 p-2.5 rounded-full hover:bg-red-50 shadow-lg"><Trash2 className="w-4 h-4"/></button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{pkg.name || pkg.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{pkg.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {pkg.cities.slice(0,3).map((c,i)=>(
            <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3"/> {c.city_name}
            </span>
          ))}
          {pkg.cities.length > 3 && <span className="text-xs text-gray-400 px-2 py-1">+{pkg.cities.length-3}</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3"/> {pkg.cities_count} مدينة</span>
          <span className="flex items-center gap-1"><Moon className="w-3 h-3"/> {pkg.total_nights} ليلة</span>
        </div>
        <div className="flex items-end justify-between pt-3 border-t">
          <div>
            {hasDiscount && <p className="text-xs line-through text-gray-400">{pkg.base_price} {pkg.currency}</p>}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-600">{(pkg.final_price ?? 0).toFixed(0)}</span>
              <span className="text-xs text-gray-500">{pkg.currency}</span>
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();onBook();}}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors
              ${pkg.is_customizable?'bg-purple-50 text-purple-700 hover:bg-purple-100':'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            {pkg.is_customizable ? '✨ تخصيص وحجز' : '📦 حجز الباقة'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Package Details Modal ────────────────────────────────
function PackageDetailsModal({ pkg, onClose, onEdit, isAdmin }: {
  pkg: TourPackage; onClose:()=>void; onEdit?:()=>void; isAdmin?: boolean;
}) {
  const [openCity, setOpenCity] = useState<number|null>(0);
  const img = pkg.image_url || getImg(pkg.image);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-200 relative rounded-t-3xl overflow-hidden">
          {img && <img src={img} className="w-full h-full object-cover" alt={pkg.name}/>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
          <div className="absolute bottom-4 right-6 text-white">
            <h2 className="text-2xl font-bold">{pkg.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5"/> {pkg.cities_count} مدن</span>
              <span className="flex items-center gap-1"><Moon className="w-3.5 h-3.5"/> {pkg.total_nights} ليالي</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pkg.is_active?'bg-emerald-500':'bg-gray-500'}`}>
                {pkg.is_active?'نشطة':'غير نشطة'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 left-4 bg-white/90 p-2 rounded-xl hover:bg-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="flex items-center justify-between bg-emerald-50 rounded-2xl p-4">
            <div>
              {pkg.discount_percentage && <p className="text-xs line-through text-gray-400">{pkg.base_price} {pkg.currency}</p>}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-emerald-600">{(pkg.final_price ?? 0).toFixed(0)}</span>
                <span className="text-gray-500">{pkg.currency}</span>
                {pkg.discount_percentage && <span className="text-sm bg-red-100 text-red-500 px-2 py-0.5 rounded-full">-{pkg.discount_percentage}%</span>}
              </div>
            </div>
            {/* زر تعديل للAdmin فقط */}
            {isAdmin && onEdit && (
              <button onClick={onEdit} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                <Edit className="w-4 h-4"/> تعديل
              </button>
            )}
          </div>

          {pkg.description && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">الوصف</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{pkg.description}</p>
            </div>
          )}

          {pkg.highlights && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">المميزات الرئيسية</h3>
              <div className="flex flex-wrap gap-2">
                {pkg.highlights.split('•').filter(h=>h.trim()).map((h,i)=>(
                  <span key={i} className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full border border-teal-200">✓ {h.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-bold text-gray-800 mb-3">برنامج الرحلة</h3>
            <div className="space-y-3">
              {pkg.cities.map((city, ci) => (
                <div key={ci} className="border rounded-2xl overflow-hidden">
                  <button onClick={()=>setOpenCity(openCity===ci?null:ci)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {city.city_image
                        ? <img src={city.city_image} className="w-10 h-10 rounded-xl object-cover" alt=""/>
                        : <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-blue-400"/></div>
                      }
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{city.city_name}</p>
                        <p className="text-xs text-gray-500">{city.country_name} • {city.nights} ليالي</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{city.hotels.length} فندق • {city.services.length} خدمة</span>
                      {openCity===ci?<ChevronDown className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
                    </div>
                  </button>
                  {openCity===ci && (
                    <div className="border-t bg-gray-50 p-4 space-y-3">
                      {city.hotels.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">الفنادق</p>
                          <div className="space-y-2">
                            {city.hotels.map((h,hi)=>(
                              <div key={hi} className="flex items-center gap-3 bg-white rounded-xl p-3 border">
                                <Building2 className="w-4 h-4 text-blue-400 shrink-0"/>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{h.hotel_name}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=(h.hotel_stars||0)?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200'}`}/>)}</div>
                                    <span className="text-xs text-gray-400">{h.nights} ليالي</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {city.services.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">الخدمات</p>
                          <div className="flex flex-wrap gap-2">
                            {city.services.map((s,si)=>(
                              <span key={si} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-xl border border-purple-100">
                                <Briefcase className="w-3 h-3"/> {s.service_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── City Step ────────────────────────────────────────────
function CityStep({ cities, countries, hotels, services, pkgCities, onChange, isCustomizable }: {
  cities: City[]; countries: Country[]; hotels: Hotel[];
  services: Service[]; pkgCities: PackageCity[];
  onChange: (cities: PackageCity[]) => void;
  isCustomizable?: boolean;
}) {
  const [selCountry, setSelCountry] = useState('');
  const addCity = () => onChange([...pkgCities, { city: 0, nights: 1, hotels: [], services: [] }]);
  const removeCity = (i: number) => onChange(pkgCities.filter((_,idx)=>idx!==i));
  const updateCity = (i: number, data: Partial<PackageCity>) =>
    onChange(pkgCities.map((c,idx)=>idx===i?{...c,...data}:c));
  const filteredCities = cities.filter(c => !selCountry || c.country === Number(selCountry));
  const getHotelsForCity = (cityId: number) => hotels.filter(h => h.city === cityId);
  const getServicesForCity = (cityId: number) => services.filter(s => s.city === cityId);

  return (
    <div className="space-y-4">
      {pkgCities.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
          <p className="text-sm">لا توجد مدن بعد</p>
        </div>
      )}
      {pkgCities.length > 0 && (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400"/>
          <select value={selCountry} onChange={e=>setSelCountry(e.target.value)}
            className="border p-2 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">كل الدول</option>
            {countries.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      {pkgCities.map((pc, ci) => {
        const cityHotels = getHotelsForCity(pc.city);
        const cityServices = getServicesForCity(pc.city);
        return (
          <div key={ci} className="border-2 border-dashed border-blue-200 rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{ci+1}</div>
              <div className="flex-1 grid gap-2" style={{gridTemplateColumns: isCustomizable ? '1fr' : '1fr 100px'}}>
                <select value={pc.city||''} onChange={e=>updateCity(ci,{city:Number(e.target.value),hotels:[],services:[]})}
                  className="border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">-- اختر المدينة --</option>
                  {filteredCities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!isCustomizable && (
                  <div className="flex items-center gap-1">
                    <Moon className="w-4 h-4 text-gray-400 shrink-0"/>
                    <input type="number" min={1} value={pc.nights}
                      onChange={e=>updateCity(ci,{nights:Number(e.target.value)})}
                      className="w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" dir="ltr"/>
                  </div>
                )}
              </div>
              <button onClick={()=>removeCity(ci)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>
            </div>
            {pc.city > 0 && (
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> الفنادق</p>
                  {cityHotels.length === 0
                    ? <p className="text-xs text-gray-400 italic">لا توجد فنادق في هذه المدينة</p>
                    : cityHotels.map(h => {
                        const sel = pc.hotels.find(ph=>ph.hotel===h.id);
                        return (
                          <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl border mb-2 transition-colors ${sel?'bg-blue-50 border-blue-200':'bg-white'}`}>
                            <input type="checkbox" checked={!!sel}
                              onChange={e=>{
                                if(e.target.checked) updateCity(ci,{hotels:[...pc.hotels,{hotel:h.id,hotel_name:h.name,nights:pc.nights}]});
                                else updateCity(ci,{hotels:pc.hotels.filter(ph=>ph.hotel!==h.id)});
                              }}
                              className="w-4 h-4 accent-blue-600"/>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{h.name}</p>
                              <div className="flex">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=h.stars?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200'}`}/>)}</div>
                            </div>
                            {sel && (
                              <div className="flex items-center gap-1">
                                <Moon className="w-3.5 h-3.5 text-gray-400"/>
                                <input type="number" min={1} value={sel.nights}
                                  onChange={e=>updateCity(ci,{hotels:pc.hotels.map(ph=>ph.hotel===h.id?{...ph,nights:Number(e.target.value)}:ph)})}
                                  className="w-16 border p-1.5 rounded-lg text-sm text-center" dir="ltr"/>
                              </div>
                            )}
                          </div>
                        );
                      })}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> الخدمات</p>
                  {cityServices.length === 0
                    ? <p className="text-xs text-gray-400 italic">لا توجد خدمات في هذه المدينة</p>
                    : <div className="flex flex-wrap gap-2">
                        {cityServices.map(s => {
                          const sel = pc.services.find(ps=>ps.service===s.id);
                          return (
                            <button key={s.id} type="button"
                              onClick={()=>{
                                if(sel) updateCity(ci,{services:pc.services.filter(ps=>ps.service!==s.id)});
                                else updateCity(ci,{services:[...pc.services,{service:s.id,service_name:s.name}]});
                              }}
                              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border-2 font-medium transition-all
                                ${sel?'bg-purple-50 text-purple-700 border-purple-300':'bg-white text-gray-600 border-gray-200 hover:border-purple-200'}`}>
                              <Tag className="w-3 h-3"/> {s.name}
                              <span className={`text-xs ${s.is_optional?'text-amber-500':'text-red-500'}`}>
                                {s.is_optional?'اختياري':'إلزامي'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                  }
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={addCity}
        className="w-full py-3 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4"/> إضافة مدينة للباقة
      </button>
    </div>
  );
}

// ─── Package Modal (Admin Only) ───────────────────────────
function PackageModal({ editing, isCustomizable = false, cities, countries, hotels, services, onSave, onClose, saving }: {
  editing: TourPackage|null; isCustomizable?: boolean; cities: City[]; countries: Country[];
  hotels: Hotel[]; services: Service[];
  onSave: (info: any, imageFile: File|null, pkgCities: PackageCity[]) => void;
  onClose: ()=>void; saving: boolean;
}) {
  const [tab, setTab] = useState<'info'|'cities'|'review'>('info');
  const [form, setForm] = useState({
    name: editing?.name||'', slug: editing?.slug||'',
    description: editing?.description||'', base_price: editing?.base_price||'',
    currency: editing?.currency||'MYR', discount_percentage: editing?.discount_percentage||'',
    highlights: editing?.highlights||'', is_active: editing?.is_active??true,
    is_customizable: editing?.is_customizable ?? isCustomizable,
  });
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [imagePreview, setImagePreview] = useState<string|null>(editing?.image_url||getImg(editing?.image)||null);
  const [pkgCities, setPkgCities] = useState<PackageCity[]>(editing?.cities||[]);

  const handleImg = (f: File|null) => {
    setImageFile(f);
    if(f){const r=new FileReader();r.onload=e=>setImagePreview(e.target?.result as string);r.readAsDataURL(f);}
    else setImagePreview(null);
  };

  const totalNights = pkgCities.reduce((s,c)=>s+c.nights,0);
  const finalPrice = form.discount_percentage
    ? (parseFloat(form.base_price||'0')*(1-parseFloat(form.discount_percentage)/100)).toFixed(0)
    : form.base_price;

  const TABS = [
    {key:'info', label:'معلومات الباقة', icon:<Package className="w-4 h-4"/>},
    {key:'cities', label:'المدن والخدمات', icon:<Globe className="w-4 h-4"/>, badge: pkgCities.length},
    {key:'review', label:'مراجعة وحفظ', icon:<CheckCircle2 className="w-4 h-4"/>},
  ] as any[];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold">{editing?'تعديل الباقة': form.is_customizable?'إضافة باقة مخصصة':'إضافة باقة ثابتة'}</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full mt-1 inline-block
              ${form.is_customizable?'bg-purple-100 text-purple-700':'bg-emerald-100 text-emerald-700'}`}>
              {form.is_customizable?'✨ قابلة للتخصيص':'📦 باقة ثابتة'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex border-b px-6 gap-1">
          {TABS.map((t:any)=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                ${tab===t.key?'border-emerald-600 text-emerald-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon} {t.label}
              {t.badge>0&&<span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {tab==='info'&&(
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الباقة *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:autoSlug(e.target.value)})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                  <input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} dir="ltr"
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف *</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">السعر *</label>
                  <input type="number" value={form.base_price} onChange={e=>setForm({...form,base_price:e.target.value})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" dir="ltr"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">العملة</label>
                  <select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-sm">
                    {['MYR','USD','EUR','SAR','AED','DZD'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">خصم %</label>
                  <input type="number" value={form.discount_percentage} onChange={e=>setForm({...form,discount_percentage:e.target.value})}
                    className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" dir="ltr"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">المميزات</label>
                <textarea value={form.highlights} onChange={e=>setForm({...form,highlights:e.target.value})} rows={2}
                  className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  placeholder="مثال: تذكرة طيران • فندق 5 نجوم • جولات يومية"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">صورة الباقة</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e=>handleImg(e.target.files?.[0]||null)}/>
                  {imagePreview
                    ?<div className="relative rounded-xl overflow-hidden h-36 border-2 border-emerald-300">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="preview"/>
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">تغيير الصورة</span>
                        </div>
                      </div>
                    :<div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                        <p className="text-sm text-gray-400">اضغط لرفع صورة الباقة</p>
                      </div>
                  }
                </label>
              </div>
              <label className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">الباقة نشطة ومتاحة للحجز</p>
                  <p className="text-xs text-gray-400">إلغاء التفعيل يخفيها عن الوكالات</p>
                </div>
                <button type="button" onClick={()=>setForm({...form,is_active:!form.is_active})}>
                  {form.is_active?<ToggleRight className="w-8 h-8 text-emerald-600"/>:<ToggleLeft className="w-8 h-8 text-gray-300"/>}
                </button>
              </label>
            </div>
          )}

          {tab==='cities'&&(
            <CityStep cities={cities} countries={countries} hotels={hotels}
              services={services} pkgCities={pkgCities} onChange={setPkgCities}
              isCustomizable={form.is_customizable}/>
          )}

          {tab==='review'&&(
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <h3 className="font-bold text-emerald-800 mb-3">ملخص الباقة</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">الاسم:</span> <span className="font-semibold mr-1">{form.name||'—'}</span></div>
                  <div><span className="text-gray-500">السعر:</span> <span className="font-semibold text-emerald-600 mr-1">{finalPrice} {form.currency}</span></div>
                  <div><span className="text-gray-500">المدن:</span> <span className="font-semibold mr-1">{pkgCities.length} مدينة</span></div>
                  <div><span className="text-gray-500">الليالي:</span> <span className="font-semibold mr-1">{totalNights} ليلة</span></div>
                </div>
              </div>
              {(!form.name||!form.base_price)&&(
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                  <p className="text-sm text-amber-700">يرجى إدخال اسم الباقة والسعر الأساسي.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 text-sm">إلغاء</button>
          {tab!=='review'
            ?<button onClick={()=>setTab(tab==='info'?'cities':'review')}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 text-sm flex items-center justify-center gap-2">
                التالي <ChevronLeft className="w-4 h-4"/>
              </button>
            :<button onClick={()=>onSave(form,imageFile,pkgCities)} disabled={saving||!form.name||!form.base_price}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                {saving?<><Loader2 className="w-4 h-4 animate-spin"/>جاري الحفظ...</>:<><CheckCircle2 className="w-4 h-4"/>{editing?'حفظ التعديلات':'إضافة الباقة'}</>}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Staff Modal (للوكالة فقط) ────────────────────────────
function StaffModal({ agencyId, onClose }: { agencyId: number; onClose: () => void }) {
  const [staff, setStaff]     = useState<AgencyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ username:'', email:'', first_name:'', last_name:'', password:'' });
  const [error, setError]     = useState('');

  useEffect(() => {
    apiFetch(`/api/v1/accounts/users/?role=agency&agency=${agencyId}`)
      .then(r => r.json()).then(d => setStaff(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [agencyId]);

  const handleAdd = async () => {
    if (!form.username || !form.password) { setError('اسم المستخدم وكلمة المرور مطلوبان'); return; }
    setSaving(true); setError('');
    try {
      const res = await apiFetch('/api/v1/accounts/users/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'agency', agency: agencyId }),
      });
      if (!res.ok) { const e = await res.json(); setError(Object.values(e).flat().join(' | ') as string); return; }
      const newUser = await res.json();
      setStaff(p => [...p, newUser]);
      setShowAdd(false);
      setForm({ username:'', email:'', first_name:'', last_name:'', password:'' });
    } catch { setError('خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u: AgencyUser) => {
    const res = await apiFetch(`/api/v1/accounts/users/${u.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    if (res.ok) setStaff(p => p.map(s => s.id === u.id ? { ...s, is_active: !s.is_active } : s));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> موظفو الوكالة</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">
              <UserPlus className="w-4 h-4"/> إضافة موظف
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Add Form */}
          {showAdd && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-blue-800 text-sm">إضافة موظف جديد</h3>
              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}
                  placeholder="الاسم الأول" className="border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                <input value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}
                  placeholder="اسم العائلة" className="border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              </div>
              <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})}
                placeholder="اسم المستخدم *" dir="ltr"
                className="w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                placeholder="البريد الإلكتروني" dir="ltr"
                className="w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                placeholder="كلمة المرور *" dir="ltr"
                className="w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              <div className="flex gap-2">
                <button onClick={() => { setShowAdd(false); setError(''); }}
                  className="flex-1 py-2 border rounded-xl text-sm hover:bg-gray-50">إلغاء</button>
                <button onClick={handleAdd} disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserPlus className="w-4 h-4"/>} إضافة
                </button>
              </div>
            </div>
          )}

          {/* Staff List */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
              <p className="text-sm">لا يوجد موظفون بعد</p>
            </div>
          ) : staff.map(u => {
            const name = `${u.first_name} ${u.last_name}`.trim() || u.username;
            const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
            return (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">@{u.username} {u.email && `• ${u.email}`}</p>
                </div>
                <button onClick={() => toggleActive(u)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors
                    ${u.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                  {u.is_active ? 'نشط' : 'معطّل'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
interface Props { user?: AuthUser | null; }

export function PackagesManagement({ user }: Props = {}) {
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const commissionRate = user?.agency ? 10 : 0; // سيُحدَّث من بيانات الوكالة

  const [packages, setPackages]   = useState<TourPackage[]>([]);
  const [cities, setCities]       = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [hotels, setHotels]       = useState<Hotel[]>([]);
  const [services, setServices]   = useState<Service[]>([]);
  const [agencyCommission, setAgencyCommission] = useState(commissionRate);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId]   = useState<number|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TourPackage|null>(null);
  const [toasts, setToasts]       = useState<Toast[]>([]);

  const [viewMode, setViewMode]   = useState<'card'|'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [showModal, setShowModal]   = useState(false);
  const [modalIsCustomizable, setModalIsCustomizable] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showCustomWizard, setShowCustomWizard] = useState(false);
  const [wizardPackage, setWizardPackage] = useState<TourPackage|null>(null);
  const [editingPkg, setEditingPkg] = useState<TourPackage|null>(null);
  const [viewingPkg, setViewingPkg] = useState<TourPackage|null>(null);
  const [showStaff, setShowStaff]   = useState(false);

  const addToast = (type: ToastType, msg: string) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,type,message:msg}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [pkR, cR, ciR, hR, sR] = await Promise.all([
        apiFetch('/api/v1/packages/'),
        apiFetch('/api/v1/locations/countries/'),
        apiFetch('/api/v1/locations/cities/'),
        apiFetch('/api/v1/hotels/'),
        apiFetch('/api/v1/services/'),
      ]);
      if(pkR.ok){ const d=await pkR.json(); setPackages(Array.isArray(d)?d:d.results||[]); }
      if(cR.ok) setCountries(await cR.json());
      if(ciR.ok) setCities(await ciR.json());
      if(hR.ok){ const d=await hR.json(); setHotels(Array.isArray(d)?d:d.results||[]); }
      if(sR.ok){ const d=await sR.json(); setServices(Array.isArray(d)?d:d.results||[]); }

      // جلب نسبة عمولة الوكالة
      if (!isAdmin && user?.agency) {
        const aRes = await apiFetch(`/api/v1/accounts/agencies/${user.agency}/`);
        if (aRes.ok) { const a = await aRes.json(); setAgencyCommission(parseFloat(a.commission_rate)); }
      }
    } catch { addToast('error','تعذّر الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  // الوكالة ترى الباقات النشطة فقط
  const visiblePackages = isAdmin ? packages : packages.filter(p => p.is_active);

  const filtered = visiblePackages.filter(p => {
    const ms = (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const mc = !filterCountry || p.cities.some(c => c.country_name?.includes(filterCountry));
    return ms && mc;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  const openWizard = (pkg?: TourPackage) => { setWizardPackage(pkg||null); setShowWizard(true); };
  const handleWizardSuccess = () => { setShowWizard(false); addToast('success','✅ تم إرسال طلب الحجز بنجاح'); };

  const handleSave = async (form: any, imageFile: File|null, pkgCities: PackageCity[]) => {
    if(!form.name.trim()||!form.base_price){ addToast('warning','يرجى إدخال اسم الباقة والسعر'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('slug', form.slug || autoSlug(form.name) || 'package-' + Date.now());
      fd.append('description', form.description || '-');
      fd.append('base_price', form.base_price);
      fd.append('currency', form.currency);
      fd.append('highlights', form.highlights || '');
      fd.append('is_active', form.is_active ? 'true' : 'false');
      fd.append('is_customizable', form.is_customizable ? 'true' : 'false');
      if(form.discount_percentage) fd.append('discount_percentage', form.discount_percentage);
      if(imageFile) fd.append('image', imageFile);

      const url = editingPkg ? `/api/v1/packages/${editingPkg.id}/` : '/api/v1/packages/';
      const res = await apiFetch(url, {method: editingPkg?'PUT':'POST', body: fd});
      if(!res.ok){ addToast('error','فشل حفظ الباقة'); setSaving(false); return; }
      const pkg = await res.json();

      for(const pc of pkgCities){
        if(!pc.city) continue;
        await apiFetch(`/api/v1/packages/${pkg.id}/add-city/`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            city: pc.city, nights: pc.nights,
            hotels: pc.hotels.map(h=>({hotel:h.hotel,nights:h.nights})),
            services: pc.services.map(s=>({service:s.service,custom_price:s.custom_price||null})),
          }),
        });
      }

      await fetchAll();
      setShowModal(false);
      addToast('success', editingPkg?`✅ تم تعديل "${pkg.name}"`:`✅ تمت إضافة "${pkg.name}" بنجاح`);
    } catch { addToast('error','خطأ في الاتصال بالخادم'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if(!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const r = await apiFetch(`/api/v1/packages/${deleteTarget.id}/`,{method:'DELETE'});
      if(r.ok){ setPackages(p=>p.filter(pk=>pk.id!==deleteTarget.id)); addToast('success',`✅ تم حذف "${deleteTarget.name}"`); }
      else addToast('error','فشل الحذف');
    } catch { addToast('error','خطأ في الاتصال'); }
    finally { setDeletingId(null); setDeleteTarget(null); }
  };

  if(loading) return(
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin"/>
      <p className="text-gray-500">جاري تحميل الباقات...</p>
    </div>
  );

  return(
    <div className="max-w-7xl mx-auto space-y-6" dir="rtl">
      <ToastNotif toasts={toasts} remove={id=>setToasts(p=>p.filter(t=>t.id!==id))}/>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'إدارة الباقات السياحية' : 'الباقات المتاحة للحجز'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? 'بناء وإدارة الباقات بمدنها وفنادقها وخدماتها'
              : `${visiblePackages.length} باقة نشطة متاحة • عمولتك ${agencyCommission}%`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* أزرار الوكالة */}
          {!isAdmin && user?.agency && (
            <button onClick={() => setShowStaff(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
              <Users className="w-4 h-4"/> موظفو الوكالة
            </button>
          )}
          {/* أزرار Admin */}
          {isAdmin && (
            <>
              <button onClick={()=>setShowCustomWizard(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 shadow-sm">
                <Sparkles className="w-4 h-4"/> إضافة باقة مخصصة
              </button>
              <button onClick={()=>{setEditingPkg(null);setModalIsCustomizable(false);setShowModal(true);}}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm">
                <Plus className="w-4 h-4"/> إضافة باقة ثابتة
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats — Admin فقط */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Package className="w-6 h-6 text-emerald-600"/>} label="إجمالي الباقات" value={packages.length} color="bg-emerald-50"/>
          <StatCard icon={<CheckCircle2 className="w-6 h-6 text-blue-600"/>} label="باقات نشطة" value={packages.filter(p=>p.is_active).length} color="bg-blue-50"/>
          <StatCard icon={<Sparkles className="w-6 h-6 text-purple-600"/>} label="باقات مخصصة" value={packages.filter(p=>p.is_customizable).length} color="bg-purple-50"/>
          <StatCard icon={<Package className="w-6 h-6 text-gray-500"/>} label="باقات ثابتة" value={packages.filter(p=>!p.is_customizable).length} color="bg-gray-50"/>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
          <input type="text" placeholder="ابحث عن باقة..." value={searchQuery}
            onChange={e=>{setSearchQuery(e.target.value);setCurrentPage(1);}}
            className="w-full pr-10 pl-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"/>
        </div>
        <select value={filterCountry} onChange={e=>{setFilterCountry(e.target.value);setCurrentPage(1);}}
          className="border p-2.5 rounded-xl text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          <option value="">كل الوجهات</option>
          {countries.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <div className="flex border rounded-xl overflow-hidden shrink-0">
          <button onClick={()=>{setViewMode('card');setCurrentPage(1);}}
            className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode==='card'?'bg-emerald-600 text-white':'hover:bg-gray-50'}`}>
            <Grid className="w-4 h-4"/> بطاقات
          </button>
          <button onClick={()=>{setViewMode('table');setCurrentPage(1);}}
            className={`px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors ${viewMode==='table'?'bg-emerald-600 text-white':'hover:bg-gray-50'}`}>
            <List className="w-4 h-4"/> جدول
          </button>
        </div>
      </div>

      {/* Cards */}
      {viewMode==='card'&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.length===0
            ?<div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                <Package className="w-16 h-16 text-gray-200 mb-4"/>
                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد باقات</h3>
                <p className="text-gray-400">{isAdmin?'ابدأ بإضافة باقة سياحية':'لا توجد باقات نشطة حالياً'}</p>
              </div>
            : isAdmin
              ? paginated.map(pkg=>(
                  <PackageCard key={pkg.id} pkg={pkg}
                    onView={()=>setViewingPkg(pkg)}
                    onEdit={()=>{setEditingPkg(pkg);setShowModal(true);}}
                    onDelete={()=>setDeleteTarget(pkg)}
                    onBook={()=>openWizard(pkg)}/>
                ))
              : paginated.map(pkg=>(
                  <AgencyPackageCard key={pkg.id} pkg={pkg}
                    commissionRate={agencyCommission}
                    onView={()=>setViewingPkg(pkg)}
                    onBook={()=>openWizard(pkg)}/>
                ))
          }
        </div>
      )}

      {/* Table */}
      {viewMode==='table'&&(
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {isAdmin
                  ? ['الباقة','المدن','الليالي','السعر','الحالة','إجراءات'].map(h=>(
                      <th key={h} className="px-5 py-4 text-right text-xs font-semibold text-gray-500">{h}</th>
                    ))
                  : ['الباقة','المدن','الليالي','السعر','عمولتك','إجراء'].map(h=>(
                      <th key={h} className="px-5 py-4 text-right text-xs font-semibold text-gray-500">{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length===0
                ?<tr><td colSpan={6} className="text-center py-16 text-gray-400">لا توجد نتائج</td></tr>
                :paginated.map(pkg=>(
                  <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {(pkg.image_url||pkg.image)
                          ?<img src={pkg.image_url||getImg(pkg.image)||''} className="w-10 h-10 rounded-xl object-cover" alt=""/>
                          :<div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-emerald-400"/></div>
                        }
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{pkg.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{pkg.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {pkg.cities.slice(0,2).map((c,i)=>(
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c.city_name}</span>
                        ))}
                        {pkg.cities.length>2&&<span className="text-xs text-gray-400">+{pkg.cities.length-2}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-sm text-gray-600"><Moon className="w-3.5 h-3.5"/>{pkg.total_nights}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-emerald-600 text-sm">{(pkg.final_price ?? 0).toFixed(0)} {pkg.currency}</span>
                    </td>
                    {isAdmin
                      ? <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pkg.is_active?'bg-emerald-50 text-emerald-600':'bg-gray-100 text-gray-500'}`}>
                            {pkg.is_active?'نشطة':'غير نشطة'}
                          </span>
                        </td>
                      : <td className="px-5 py-3">
                          <span className="font-bold text-amber-600 text-sm">
                            +{(pkg.final_price * agencyCommission / 100).toFixed(0)} {pkg.currency}
                          </span>
                        </td>
                    }
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>setViewingPkg(pkg)} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"><Eye className="w-4 h-4"/></button>
                        {isAdmin && (
                          <>
                            <button onClick={()=>{setEditingPkg(pkg);setShowModal(true);}} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4"/></button>
                            <button onClick={()=>setDeleteTarget(pkg)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                          </>
                        )}
                        {!isAdmin && (
                          <button onClick={()=>openWizard(pkg)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium
                              ${pkg.is_customizable?'bg-purple-600 text-white hover:bg-purple-700':'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            حجز
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages>1&&(
        <div className="flex items-center justify-between bg-white border rounded-2xl px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">عرض {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage,filtered.length)} من {filtered.length} باقة</span>
          <div className="flex items-center gap-2">
            <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50"><ChevronRight className="w-4 h-4"/>السابق</button>
            {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium ${currentPage===p?'bg-emerald-600 text-white':'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
            ))}
            <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}
              className="flex items-center gap-1 px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">التالي<ChevronLeft className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showWizard && wizardPackage && <BookingWizard pkg={wizardPackage} onClose={()=>setShowWizard(false)} onSuccess={handleWizardSuccess}/>}
      {deleteTarget && <DeleteModal name={deleteTarget.name} loading={deletingId===deleteTarget.id} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)}/>}
      {viewingPkg && <PackageDetailsModal pkg={viewingPkg} isAdmin={isAdmin} onClose={()=>setViewingPkg(null)} onEdit={()=>{setEditingPkg(viewingPkg);setViewingPkg(null);setShowModal(true);}}/>}
      {showCustomWizard && isAdmin && <CustomPackageWizard onClose={()=>setShowCustomWizard(false)} onSuccess={()=>{setShowCustomWizard(false);fetchAll();addToast('success','✅ تم إنشاء الباقة بنجاح');}}/> }
      {showModal && isAdmin && <PackageModal editing={editingPkg} isCustomizable={modalIsCustomizable} cities={cities} countries={countries} hotels={hotels} services={services} onSave={handleSave} onClose={()=>setShowModal(false)} saving={saving}/>}
      {showStaff && !isAdmin && user?.agency && <StaffModal agencyId={user.agency} onClose={()=>setShowStaff(false)}/>}
    </div>
  );
}