import { useState, useEffect } from 'react';
import { apiFetch } from '../auth/apiFetch';
import {
  DollarSign, TrendingUp, TrendingDown, Download, ArrowUpRight,
  ArrowDownRight, Wallet, CreditCard, Loader2, RefreshCw,
  Lock, Unlock, CheckCircle2, XCircle, Clock, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface WalletData {
  id: number;
  agency: number;
  agency_name: string;
  balance: string;
  frozen_balance: string;
  available_balance: string;
  currency: string;
  is_active: boolean;
  updated_at: string;
}

interface Transaction {
  id: number;
  wallet: number;
  transaction_type: string;
  transaction_type_display: string;
  amount: string;
  currency: string;
  status: string;
  status_display: string;
  balance_before: string;
  balance_after: string;
  booking: number | null;
  reference: string;
  notes: string;
  created_at: string;
}

interface BookingStats {
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    total_revenue: number;
    commission_rate: number;
    commission_earned: number;
    currency: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────
const TX_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  credit:   { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ArrowUpRight },
  debit:    { color: 'text-red-600',     bg: 'bg-red-50',     icon: ArrowDownRight },
  freeze:   { color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Lock },
  unfreeze: { color: 'text-blue-600',    bg: 'bg-blue-50',    icon: Unlock },
  refund:   { color: 'text-purple-600',  bg: 'bg-purple-50',  icon: ArrowUpRight },
  charge:   { color: 'text-red-700',     bg: 'bg-red-50',     icon: CreditCard },
};

function fmt(val: string | number, currency = 'MYR') {
  return `${parseFloat(String(val)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ label, value, currency, sub, icon, color, iconBg }:
  { label: string; value: string; currency?: string; sub?: string; icon: any; color: string; iconBg: string }) {
  const Icon = icon;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {currency && <p className="text-xs text-gray-400 mt-0.5">{currency}</p>}
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Credit/Debit Modal ───────────────────────────────────
function CreditDebitModal({ wallet, type, onClose, onSuccess }:
  { wallet: WalletData; type: 'credit' | 'debit'; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { setError('أدخل مبلغاً صحيحاً'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiFetch(`/api/v1/wallets/${wallet.id}/${type}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, notes }),
      });
      if (res.ok) { onSuccess(); onClose(); }
      else {
        const d = await res.json();
        setError(d.detail || 'فشلت العملية');
      }
    } catch { setError('خطأ في الاتصال'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-bold mb-1">
          {type === 'credit' ? '💰 إيداع في المحفظة' : '💸 سحب من المحفظة'}
        </h3>
        <p className="text-sm text-gray-500 mb-5">{wallet.agency_name}</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">المبلغ ({wallet.currency})</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" min="1" step="0.01"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">ملاحظات (اختياري)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="سبب العملية..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          {type === 'debit' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              الرصيد المتاح: <strong>{fmt(wallet.available_balance, wallet.currency)}</strong>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSubmit} disabled={loading}
            className={`flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60
              ${type === 'credit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
            {type === 'credit' ? 'إيداع' : 'سحب'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export function FinancialReports() {
  const [wallets, setWallets]           = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats]               = useState<BookingStats['stats'] | null>(null);
  const [loading, setLoading]           = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [modalType, setModalType]       = useState<'credit' | 'debit' | null>(null);
  const [txFilter, setTxFilter]         = useState<string>('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [wRes, txRes, stRes] = await Promise.all([
        apiFetch('/api/v1/wallets/'),
        apiFetch('/api/v1/wallet-transactions/'),
        apiFetch('/api/v1/bookings/dashboard-stats/'),
      ]);
      if (wRes.ok)  { const d = await wRes.json();  setWallets(Array.isArray(d) ? d : d.results || []); }
      if (txRes.ok) { const d = await txRes.json(); setTransactions(Array.isArray(d) ? d : d.results || []); }
      if (stRes.ok) { const d = await stRes.json(); setStats(d.stats); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredTx = txFilter === 'all'
    ? transactions
    : transactions.filter(t => t.transaction_type === txFilter);

  const totalBalance  = wallets.reduce((s, w) => s + parseFloat(w.balance), 0);
  const totalFrozen   = wallets.reduce((s, w) => s + parseFloat(w.frozen_balance), 0);
  const totalAvailable = wallets.reduce((s, w) => s + parseFloat(w.available_balance), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin"/>
      <p className="text-gray-500">جاري تحميل التقارير المالية...</p>
    </div>
  );

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen -m-8 p-8" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">التقارير المالية</h1>
          <p className="text-gray-500 text-sm mt-0.5">إدارة المحافظ والعمليات المالية</p>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium hover:bg-gray-50">
          <RefreshCw className="w-4 h-4"/> تحديث
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الأرصدة"    value={totalBalance.toLocaleString('en-MY', {minimumFractionDigits:2})}
          currency="MYR" icon={Wallet}       color="text-blue-600"    iconBg="bg-blue-50"/>
        <StatCard label="رصيد مجمد (Escrow)" value={totalFrozen.toLocaleString('en-MY', {minimumFractionDigits:2})}
          currency="MYR" icon={Lock}         color="text-amber-600"   iconBg="bg-amber-50"/>
        <StatCard label="رصيد متاح"          value={totalAvailable.toLocaleString('en-MY', {minimumFractionDigits:2})}
          currency="MYR" icon={Unlock}       color="text-emerald-600" iconBg="bg-emerald-50"/>
        <StatCard label="إيرادات الحجوزات"   value={(stats?.total_revenue || 0).toLocaleString('en-MY', {minimumFractionDigits:2})}
          currency={stats?.currency || 'MYR'} icon={TrendingUp}      color="text-purple-600"  iconBg="bg-purple-50"/>
      </div>

      {/* Wallets */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">محافظ الوكالات</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{wallets.length} محفظة</span>
        </div>

        {wallets.length === 0
          ? <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Wallet className="w-12 h-12 mb-3 text-gray-200"/>
              <p className="text-sm">لا توجد محافظ</p>
              <p className="text-xs mt-1">تُنشأ المحفظة تلقائياً عند قبول الوكالة</p>
            </div>
          : <div className="divide-y divide-gray-50">
              {wallets.map(w => (
                <div key={w.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-blue-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{w.agency_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        مجمد: <span className="text-amber-600 font-medium">{fmt(w.frozen_balance, w.currency)}</span>
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">
                        متاح: <span className="text-emerald-600 font-medium">{fmt(w.available_balance, w.currency)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-blue-700">{fmt(w.balance, w.currency)}</p>
                    <p className="text-xs text-gray-400">الرصيد الكلي</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setSelectedWallet(w); setModalType('credit'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100">
                      <ArrowUpRight className="w-3.5 h-3.5"/> إيداع
                    </button>
                    <button onClick={() => { setSelectedWallet(w); setModalType('debit'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                      <ArrowDownRight className="w-3.5 h-3.5"/> سحب
                    </button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Booking Stats */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-800 mb-4">إحصاءات الحجوزات</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'معلقة',  val: stats.pending,   color: 'text-amber-600',  bg: 'bg-amber-50',   icon: Clock },
              { label: 'مؤكدة',  val: stats.confirmed, color: 'text-emerald-600',bg: 'bg-emerald-50', icon: CheckCircle2 },
              { label: 'ملغاة',  val: stats.cancelled, color: 'text-red-600',    bg: 'bg-red-50',     icon: XCircle },
              { label: 'مكتملة', val: stats.completed, color: 'text-blue-600',   bg: 'bg-blue-50',    icon: CheckCircle2 },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 ${s.bg} flex items-center gap-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`}/>
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">إجمالي الإيرادات</span>
              <span className="font-bold text-emerald-600">{fmt(stats.total_revenue, stats.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">العمولات المكتسبة ({stats.commission_rate}%)</span>
              <span className="font-bold text-purple-600">{fmt(stats.commission_earned, stats.currency)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">سجل العمليات</h2>
          <div className="flex gap-1">
            {['all','credit','debit','freeze','refund','charge'].map(f => (
              <button key={f} onClick={() => setTxFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${txFilter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {f === 'all' ? 'الكل' : f === 'credit' ? 'إيداع' : f === 'debit' ? 'سحب' :
                 f === 'freeze' ? 'تجميد' : f === 'refund' ? 'استرداد' : 'خصم نهائي'}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0
          ? <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CreditCard className="w-12 h-12 mb-3 text-gray-200"/>
              <p className="text-sm">لا توجد عمليات</p>
            </div>
          : <div className="divide-y divide-gray-50">
              {filteredTx.slice(0, 20).map(tx => {
                const cfg = TX_CONFIG[tx.transaction_type] || TX_CONFIG.credit;
                const TxIcon = cfg.icon;
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <TxIcon className={`w-4 h-4 ${cfg.color}`}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${cfg.color}`}>{tx.transaction_type_display}</p>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tx.status_display}</span>
                      </div>
                      {tx.notes && <p className="text-xs text-gray-400 truncate mt-0.5">{tx.notes}</p>}
                      {tx.booking && <p className="text-xs text-blue-500 mt-0.5">حجز #{tx.booking}</p>}
                    </div>
                    <div className="text-left shrink-0">
                      <p className={`font-bold text-sm ${cfg.color}`}>
                        {['credit','refund','unfreeze'].includes(tx.transaction_type) ? '+' : '-'}
                        {fmt(tx.amount, tx.currency)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </div>

      {/* Modal */}
      {selectedWallet && modalType && (
        <CreditDebitModal
          wallet={selectedWallet}
          type={modalType}
          onClose={() => { setSelectedWallet(null); setModalType(null); }}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
}
