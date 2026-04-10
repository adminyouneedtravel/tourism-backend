import { useState, useEffect } from 'react';
import {
  Calendar, Users, DollarSign, CheckCircle2,
  Clock, XCircle, TrendingUp, Package, Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiFetch } from '../auth/apiFetch';
import type { AuthUser } from '../auth/authService';

interface Props { user: AuthUser; }

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  total_persons: number;
  adults: number;
  children: number;
  infants: number;
  total_revenue: number;
  commission_rate: number;
  commission_earned: number;
  currency: string;
}

interface WeekDay { date: string; label: string; count: number; }

interface RecentBooking {
  id: number;
  reference_number: string;
  client_name: string;
  client_phone: string;
  status: string;
  booking_type: string;
  adults: number;
  children: number;
  infants: number;
  total_price: string | null;
  currency: string;
  created_at: string;
  package__name: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'معلق',   color: 'text-amber-600',  bg: 'bg-amber-50' },
  confirmed: { label: 'مؤكد',   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cancelled: { label: 'ملغي',   color: 'text-red-600',    bg: 'bg-red-50' },
  completed: { label: 'مكتمل',  color: 'text-blue-600',   bg: 'bg-blue-50' },
};

const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

export function AgencyDashboard({ user }: Props) {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [recent, setRecent]   = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 صباح الخير';
    if (h < 17) return '☀️ مساء النور';
    return '🌙 مساء الخير';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('/api/v1/bookings/dashboard-stats/');
        if (!res.ok) { setError('فشل تحميل البيانات'); return; }
        const data = await res.json();
        setStats(data.stats);
        setWeekData(data.week_data);
        setRecent(data.recent);
      } catch { setError('تعذّر الاتصال بالخادم'); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <p className="text-gray-500">جاري تحميل بياناتك...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertTriangle className="w-12 h-12 text-amber-400" />
      <p className="text-gray-600">{error}</p>
    </div>
  );

  if (!stats) return null;

  const pieData = [
    { name: 'معلقة',  value: stats.pending   },
    { name: 'مؤكدة',  value: stats.confirmed },
    { name: 'ملغاة',  value: stats.cancelled },
    { name: 'مكتملة', value: stats.completed },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6" dir="rtl">

      {/* Greeting */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{greeting()}، {fullName}</h2>
        <p className="text-blue-100 text-sm">
          {user.agency_name && `وكالة ${user.agency_name} — `}
          هذا ملخص نشاط وكالتك السياحية
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            عمولة {stats.commission_rate}%
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
            {stats.currency}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الحجوزات', value: stats.total,     icon: <Calendar className="w-6 h-6 text-blue-600" />,    color: 'bg-blue-50',    sub: `${stats.pending} معلق للمراجعة` },
          { label: 'إجمالي المسافرين', value: stats.total_persons, icon: <Users className="w-6 h-6 text-purple-600" />, color: 'bg-purple-50',  sub: `بالغون وأطفال ورضع` },
          { label: 'حجوزات مؤكدة',    value: stats.confirmed, icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-50', sub: `من أصل ${stats.total} طلب` },
          { label: 'عمولة محققة',     value: `${stats.commission_earned.toLocaleString()} ${stats.currency}`, icon: <DollarSign className="w-6 h-6 text-amber-600" />, color: 'bg-amber-50', sub: `${stats.commission_rate}% من الإيرادات` },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">الحجوزات — آخر 7 أيام</h3>
          <p className="text-sm text-gray-400 mb-4">عدد طلبات الحجز يومياً</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="الحجوزات" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">توزيع الحجوزات</h3>
          <p className="text-sm text-gray-400 mb-4">حسب الحالة</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300">
              <p className="text-sm">لا توجد حجوزات بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'معلقة',  value: stats.pending,   icon: <Clock className="w-5 h-5" />,        ...STATUS_CONFIG.pending },
          { label: 'مؤكدة',  value: stats.confirmed, icon: <CheckCircle2 className="w-5 h-5" />, ...STATUS_CONFIG.confirmed },
          { label: 'مكتملة', value: stats.completed, icon: <TrendingUp className="w-5 h-5" />,   ...STATUS_CONFIG.completed },
          { label: 'ملغاة',  value: stats.cancelled, icon: <XCircle className="w-5 h-5" />,      ...STATUS_CONFIG.cancelled },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 border flex items-center gap-3 ${s.bg}`}>
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-600">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold text-gray-900">آخر الحجوزات</h3>
          <p className="text-sm text-gray-400">أحدث طلبات الحجز من وكالتك</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['#', 'العميل', 'الباقة', 'الأفراد', 'الحالة', 'التاريخ'].map(h => (
                  <th key={h} className="px-5 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">لا توجد حجوزات بعد</td></tr>
              ) : recent.map(b => {
                const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs font-mono text-gray-500">{b.reference_number}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{b.client_name}</p>
                      <p className="text-xs text-gray-400" dir="ltr">{b.client_phone}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {b.package__name || (b.booking_type === 'custom' ? 'باقة مخصصة' : '—')}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {b.adults + b.children + b.infants} فرد
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(b.created_at).toLocaleDateString('ar-SA')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persons Breakdown */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">توزيع المسافرين</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'بالغون',  value: stats.adults,   color: 'bg-blue-500' },
            { label: 'أطفال',   value: stats.children, color: 'bg-emerald-500' },
            { label: 'رضّع',    value: stats.infants,  color: 'bg-amber-500' },
          ].map((p, i) => (
            <div key={i} className="text-center p-4 rounded-2xl bg-gray-50">
              <div className={`w-3 h-3 rounded-full ${p.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{p.value}</p>
              <p className="text-sm text-gray-500">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}