import { useState, useEffect } from "react";
import {
  MapPin, Clock, Star, Shield, Phone, Tag,
  ChevronRight, Search, Plane, Hotel, Package,
  Globe, Heart, CheckCircle, Mail, Loader2,
} from "lucide-react";
import { Button }            from "@/app/components/ui/button";
import { Input }             from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { API }               from "@/app/auth/endpoints";
import { BASE }              from "@/app/auth/apiFetch";

/* ── TYPES ──────────────────────────────────── */
interface Hotel {
  id: number;
  name: string;
  city_name?: string;
  country_name?: string;
  stars: number;
  description?: string;
  image?: string;
}

interface Package {
  id: number;
  name: string;
  description?: string;
  price_per_person: string;
  duration_days: number;
  cities?: { name: string; country?: string }[];
  image?: string;
  is_featured?: boolean;
}

interface Review {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  initials: string;
}

/* ── STATIC REVIEWS (no review API yet) ─────── */
const STATIC_REVIEWS: Review[] = [
  { id:1, name:"Sarah Ahmad",  location:"Kuala Lumpur, Malaysia", rating:5, initials:"SA",
    text:"Booked a package and it exceeded every expectation. The team handled everything perfectly — truly a stress-free experience." },
  { id:2, name:"Ravi Menon",   location:"Penang, Malaysia",       rating:5, initials:"RM",
    text:"The Maldives package was phenomenal. Overwater villa, snorkeling, transfers — all seamless. Will definitely use again!" },
  { id:3, name:"Nurul Lim",    location:"Johor Bahru, Malaysia",  rating:4, initials:"NL",
    text:"Japan cherry blossom trip was incredible. Well-paced itinerary and exceptional local guides throughout." },
];

const SEARCH_TABS = [
  { id:"hotels",   label:"Hotels",   icon:"Hotel"   },
  { id:"packages", label:"Packages", icon:"Package" },
  { id:"services", label:"Services", icon:"Globe"   },
];

const WHY_US = [
  { title:"Expert Curated Trips",  desc:"Every itinerary is personally designed by specialists who have visited each destination." },
  { title:"Secure Payments",        desc:"All transactions are encrypted and protected. Full refund policy available." },
  { title:"24/7 Support",           desc:"Our dedicated team is always on standby before, during, and after your trip." },
  { title:"Best Price Guarantee",   desc:"Find a lower price elsewhere and we will match it or refund the difference." },
];

/* ── HELPERS ─────────────────────────────────── */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size}
          className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
      ))}
    </span>
  );
}

function getImageUrl(img?: string): string | null {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${BASE}${img}`;
}

const FALLBACK_HOTEL =
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=75";
const FALLBACK_PKG =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=75";

/* ── HOTEL CARD ──────────────────────────────── */
function HotelCard({ hotel }: { hotel: Hotel }) {
  const img = getImageUrl(hotel.image) || FALLBACK_HOTEL;
  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group p-0">
      <div className="relative h-48 overflow-hidden">
        <img src={img} alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_HOTEL; }} />
        {hotel.stars > 0 && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {"★".repeat(hotel.stars)}
          </span>
        )}
        <button className="absolute top-3 right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:text-red-500 transition-colors">
          <Heart size={14} />
        </button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-1 text-[#01869B] text-[11px] font-semibold uppercase tracking-wide mb-2">
          <MapPin size={11} />
          {[hotel.city_name, hotel.country_name].filter(Boolean).join(", ") || "Malaysia"}
        </div>
        <h3 className="font-bold text-gray-800 text-[15px] leading-snug mb-3"
          style={{ fontFamily:"Georgia,serif" }}>{hotel.name}</h3>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Stars rating={hotel.stars} size={13} />
          <button className="bg-[#E6F6F9] text-[#00566B] hover:bg-[#01869B] hover:text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors">
            View Hotel
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── PACKAGE CARD ────────────────────────────── */
function PackageCard({ pkg }: { pkg: Package }) {
  const img = getImageUrl(pkg.image) || FALLBACK_PKG;
  const location = pkg.cities?.map(c => c.name).join(", ") || "Malaysia";
  const price = parseFloat(pkg.price_per_person || "0");
  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group p-0">
      <div className="relative h-48 overflow-hidden">
        <img src={img} alt={pkg.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_PKG; }} />
        {pkg.is_featured && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
            Featured
          </span>
        )}
        <button className="absolute top-3 right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:text-red-500 transition-colors">
          <Heart size={14} />
        </button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-1 text-[#01869B] text-[11px] font-semibold uppercase tracking-wide mb-2">
          <MapPin size={11} />{location}
        </div>
        <h3 className="font-bold text-gray-800 text-[15px] leading-snug mb-2"
          style={{ fontFamily:"Georgia,serif" }}>{pkg.name}</h3>
        {pkg.description && (
          <p className="text-gray-400 text-[12px] leading-relaxed mb-3 line-clamp-2">{pkg.description}</p>
        )}
        <div className="flex gap-3 text-[11px] text-gray-500 mb-4">
          <span className="flex items-center gap-1"><Clock size={11}/>{pkg.duration_days} Days</span>
          <span className="flex items-center gap-1"><Plane size={11}/>Return Incl.</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Starting from</p>
            <p className="text-lg font-bold text-[#00566B]">
              MYR {price.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              <span className="text-[11px] font-normal text-gray-400">/pax</span>
            </p>
          </div>
          <button className="bg-[#E6F6F9] text-[#00566B] hover:bg-[#01869B] hover:text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors">
            Book Now
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── SKELETON ────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded mt-4" />
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ─────────────────────────── */
interface HomePageProps { onLogin: () => void; }

export function HomePage({ onLogin }: HomePageProps) {
  const [activeTab, setActiveTab]       = useState("packages");
  const [searchQuery, setSearchQuery]   = useState("");
  const [email, setEmail]               = useState("");
  const [hotels, setHotels]             = useState<Hotel[]>([]);
  const [packages, setPackages]         = useState<Package[]>([]);
  const [stats, setStats]               = useState({ bookings: 0, packages: 0, hotels: 0 });
  const [loadingHotels, setLoadingHotels]     = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);

  /* ── جلب البيانات الحقيقية ─────────────────── */
  useEffect(() => {
    // Hotels — public endpoint لا يحتاج token
    fetch(`http://127.0.0.1:8000${API.hotels.list}?limit=3`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const results = data.results ?? data;
          setHotels(Array.isArray(results) ? results.slice(0, 3) : []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHotels(false));

    // Packages — public endpoint
    fetch(`http://127.0.0.1:8000${API.packages.list}?limit=3`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const results = data.results ?? data;
          setPackages(Array.isArray(results) ? results.slice(0, 3) : []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPackages(false));

    // Dashboard stats — يعمل بدون login (أرقام عامة فقط)
    fetch(`http://127.0.0.1:8000${API.bookings.dashboardStats}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setStats({
            bookings: data.total_bookings ?? data.bookings_count ?? 0,
            packages: data.total_packages ?? data.packages_count ?? 0,
            hotels:   data.total_hotels   ?? data.hotels_count   ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  /* ── Search handler ─────────────────────────── */
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    onLogin(); // يفتح الـ login — لاحقاً يوجه لصفحة نتائج
  };

  return (
    <div className="min-h-screen bg-white" dir="ltr">

      {/* ══ NAVBAR ══════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-[#00566B]" style={{ fontFamily:"Georgia,serif" }}>
            You Need<span className="text-[#01869B]">Travel</span>
          </span>
          <ul className="hidden md:flex items-center gap-7 list-none m-0 p-0">
            {[
              { label:"Home",         href:"#"          },
              { label:"Hotels",       href:"#hotels"    },
              { label:"Packages",     href:"#packages"  },
              { label:"Why Us",       href:"#why-us"    },
              { label:"Contact",      href:"#contact"   },
            ].map(l => (
              <li key={l.label}>
                <a href={l.href}
                  className="text-[13px] font-medium text-gray-500 hover:text-[#01869B] transition-colors no-underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm"
              className="border-[#01869B] text-[#01869B] hover:bg-[#01869B] hover:text-white"
              onClick={onLogin}>Sign In</Button>
            <Button size="sm"
              className="bg-[#01869B] hover:bg-[#00566B] text-white"
              onClick={onLogin}>Book Now</Button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════ */}
      <section className="relative overflow-hidden"
        style={{ background:"linear-gradient(135deg,#005D71 0%,#01869B 45%,#00A8C8 100%)", minHeight:420 }}>
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-white/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-20 flex items-start justify-between gap-8">
          <div className="max-w-[560px] relative z-10">
            <span className="inline-block bg-white/15 border border-white/25 text-white/90 text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-widest mb-5">
              ✦ Malaysia&apos;s #1 Travel Platform
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily:"Georgia,serif" }}>
              Explore the World<br />Your Way
            </h1>
            <p className="text-white/75 text-[15px] leading-relaxed mb-7 max-w-md">
              Discover handpicked tours, luxury hotels, and unforgettable travel experiences
              across our curated destinations worldwide.
            </p>
            <div className="flex gap-3">
              <Button className="bg-white text-[#00566B] hover:bg-white/90 font-semibold px-6"
                onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior:"smooth" })}>
                Explore Packages
              </Button>
              <Button variant="outline"
                className="border-white/40 text-white bg-white/10 hover:bg-white/20 px-6"
                onClick={() => document.getElementById("hotels")?.scrollIntoView({ behavior:"smooth" })}>
                View Hotels
              </Button>
            </div>
          </div>
          {/* Stats — من API أو fallback */}
          <div className="hidden md:flex gap-3 self-center relative z-10 mt-8">
            {[
              { num: stats.packages > 0 ? `${stats.packages}+` : "20+",  label:"Tour Packages"   },
              { num: stats.hotels   > 0 ? `${stats.hotels}+`   : "50+",  label:"Hotels"          },
              { num: stats.bookings > 0 ? `${stats.bookings}+` : "500+", label:"Happy Travelers" },
            ].map(s => (
              <div key={s.label}
                className="bg-white/10 border border-white/20 rounded-xl p-4 min-w-[120px] text-white">
                <p className="text-2xl font-bold">{s.num}</p>
                <p className="text-[11px] text-white/70 uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SEARCH BAR ══════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative -mt-7 bg-white rounded-xl border border-gray-200 shadow-xl p-5">
          {/* tabs */}
          <div className="absolute -top-9 left-0 flex">
            {SEARCH_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-[12px] font-medium transition-all border-0 cursor-pointer
                  ${activeTab === tab.id ? "bg-white text-[#00566B]" : "bg-white/15 text-white/80 hover:bg-white/25"}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center divide-x divide-gray-200">
            <div className="flex-1 px-3">
              <p className="text-[10px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">
                {activeTab === "hotels" ? "Hotel Name / City" : activeTab === "packages" ? "Destination / Package" : "Service Name"}
              </p>
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === "hotels" ? "Search hotels..." : activeTab === "packages" ? "Search packages..." : "Search services..."}
                className="border-0 p-0 text-[13px] focus-visible:ring-0 h-auto shadow-none placeholder:text-gray-300"
                onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="flex-1 px-3">
              <p className="text-[10px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">Check In</p>
              <Input type="date" className="border-0 p-0 text-[13px] focus-visible:ring-0 h-auto shadow-none text-gray-500"/>
            </div>
            <div className="flex-1 px-3">
              <p className="text-[10px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">Check Out</p>
              <Input type="date" className="border-0 p-0 text-[13px] focus-visible:ring-0 h-auto shadow-none text-gray-500"/>
            </div>
            <div className="flex-1 px-3">
              <p className="text-[10px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">Travelers</p>
              <Input placeholder="2 Adults, 1 Child"
                className="border-0 p-0 text-[13px] focus-visible:ring-0 h-auto shadow-none placeholder:text-gray-300"/>
            </div>
            <div className="pl-4">
              <Button onClick={handleSearch}
                className="bg-[#01869B] hover:bg-[#00566B] w-11 h-11 p-0 rounded-lg">
                <Search size={18}/>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ HOTELS ══════════════════════════════ */}
      <section id="hotels" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">Accommodation</p>
            <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily:"Georgia,serif" }}>Featured Hotels</h2>
            <p className="text-gray-500 text-[13px] mt-1">Hand-picked hotels from our curated collection.</p>
          </div>
          <button onClick={onLogin}
            className="flex items-center gap-1 text-[13px] text-[#01869B] font-medium border border-gray-200 px-4 py-2 rounded-lg hover:border-[#01869B] transition-colors bg-transparent cursor-pointer">
            Browse All Hotels <ChevronRight size={14}/>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {loadingHotels
            ? [1,2,3].map(i => <CardSkeleton key={i}/>)
            : hotels.length > 0
              ? hotels.map(h => <HotelCard key={h.id} hotel={h}/>)
              : (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  <Hotel size={40} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-[14px]">No hotels available yet. <button onClick={onLogin} className="text-[#01869B] underline cursor-pointer bg-transparent border-0">Sign in</button> to explore more.</p>
                </div>
              )
          }
        </div>
      </section>

      {/* ══ PACKAGES ════════════════════════════ */}
      <section id="packages" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">Packages</p>
              <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily:"Georgia,serif" }}>Tour Packages</h2>
              <p className="text-gray-500 text-[13px] mt-1">All-inclusive deals curated by our travel consultants.</p>
            </div>
            <button onClick={onLogin}
              className="flex items-center gap-1 text-[13px] text-[#01869B] font-medium border border-gray-200 px-4 py-2 rounded-lg hover:border-[#01869B] transition-colors bg-transparent cursor-pointer">
              Browse All <ChevronRight size={14}/>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {loadingPackages
              ? [1,2,3].map(i => <CardSkeleton key={i}/>)
              : packages.length > 0
                ? packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg}/>)
                : (
                  <div className="col-span-3 text-center py-12 text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30"/>
                    <p className="text-[14px]">No packages available yet. <button onClick={onLogin} className="text-[#01869B] underline cursor-pointer bg-transparent border-0">Sign in</button> to explore more.</p>
                  </div>
                )
            }
          </div>
        </div>
      </section>

      {/* ══ WHY US ══════════════════════════════ */}
      <section id="why-us" className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">Why Choose Us</p>
          <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily:"Georgia,serif" }}>Travel with Confidence</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {WHY_US.map((w, i) => {
            const icons = [CheckCircle, Shield, Phone, Tag];
            const Icon  = icons[i];
            return (
              <div key={w.title}
                className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-[#01869B] hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-[#E6F6F9] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-[#01869B]"/>
                </div>
                <h3 className="font-semibold text-gray-800 text-[14px] mb-2">{w.title}</h3>
                <p className="text-gray-500 text-[12px] leading-relaxed">{w.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ REVIEWS ═════════════════════════════ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-[11px] font-semibold text-[#01869B] uppercase tracking-widest mb-1">Reviews</p>
            <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily:"Georgia,serif" }}>What Travelers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STATIC_REVIEWS.map(r => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex mb-3"><Stars rating={r.rating} size={13}/></div>
                <p className="text-gray-500 text-[13px] leading-relaxed italic mb-4">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E6F6F9] border-2 border-[#01869B] flex items-center justify-center text-[12px] font-semibold text-[#00566B]">
                    {r.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-700">{r.name}</p>
                    <p className="text-[11px] text-gray-400">{r.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════ */}
      <section id="contact" className="max-w-7xl mx-auto px-6 py-10">
        <div className="relative overflow-hidden rounded-2xl p-12 flex flex-col md:flex-row items-center justify-between gap-8"
          style={{ background:"linear-gradient(135deg,#005D71 0%,#01869B 100%)" }}>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily:"Georgia,serif" }}>
              Ready to Start Your Adventure?
            </h2>
            <p className="text-white/70 text-[14px]">
              Subscribe to get exclusive deals and travel inspiration.
            </p>
          </div>
          <div className="relative z-10 flex gap-3 w-full md:w-auto">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="bg-white/15 border-white/30 text-white placeholder:text-white/50 w-full md:w-60 focus-visible:ring-white/50"/>
            <Button className="bg-white text-[#00566B] hover:bg-white/90 font-semibold whitespace-nowrap flex items-center gap-2">
              <Mail size={15}/>Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════ */}
      <footer className="bg-[#00384A] pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="text-xl font-bold text-white mb-3" style={{ fontFamily:"Georgia,serif" }}>
                YouNeedTravel
              </p>
              <p className="text-[13px] text-white/40 leading-relaxed max-w-[240px]">
                Malaysia&apos;s trusted travel platform — connecting explorers with extraordinary destinations.
              </p>
            </div>
            {[
              { title:"Explore", links:[
                { label:"Hotels",   action:"hotels"   },
                { label:"Packages", action:"packages" },
              ]},
              { title:"Account", links:[
                { label:"Sign In",   action:"login"    },
                { label:"Register",  action:"login"    },
                { label:"Dashboard", action:"login"    },
              ]},
              { title:"Support", links:[
                { label:"Help Center",    action:"" },
                { label:"Contact Us",     action:"" },
                { label:"Privacy Policy", action:"" },
                { label:"Terms",          action:"" },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold text-[#00A8C8] uppercase tracking-widest mb-4">{col.title}</h4>
                {col.links.map(l => (
                  <button key={l.label}
                    onClick={() => l.action === "login" ? onLogin() : l.action ? document.getElementById(l.action)?.scrollIntoView({ behavior:"smooth" }) : undefined}
                    className="block text-[13px] text-white/45 hover:text-white/85 mb-2 transition-colors bg-transparent border-0 cursor-pointer p-0 text-left">
                    {l.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-5 flex items-center justify-between">
            <p className="text-[12px] text-white/30">© 2026 You Need Travel Sdn. Bhd. All rights reserved.</p>
            <div className="flex gap-2">
              {["FB","IG","TW","YT"].map(s => (
                <button key={s}
                  className="w-8 h-8 border border-white/15 rounded-lg text-[11px] font-semibold text-white/40 hover:border-[#00A8C8] hover:text-[#00A8C8] transition-colors bg-transparent cursor-pointer">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
