import { useState, useEffect } from 'react';
import { Sidebar }                from './components/Sidebar';
import { Header }                 from './components/Header';
import { DashboardContent }       from './components/DashboardContent';
import { AgencyDashboard }        from './components/AgencyDashboard';
import { BookingsManagement }     from './components/BookingsManagement';
import { AgenciesManagement }     from './components/AgenciesManagement';
import { CustomersManagement }    from './components/CustomersManagement';
import { PackagesManagement }     from './components/PackagesManagement';
import { DestinationsManagement } from './components/DestinationsManagement';
import { HotelsManagement }       from './components/HotelsManagement';
import { ServicesManagement }     from './components/ServicesManagement';
import { FinancialReports }       from './components/FinancialReports';
import { ExtranetManagement }     from './components/ExtranetManagement';
import { AnalyticsReports }       from './components/AnalyticsReports';
import { SettingsPage }           from './components/SettingsPage';
import { LoginPage }              from './auth/LoginPage';
import { getStoredUser, clearAuth } from './auth/authService';
import type { AuthUser }          from './auth/authService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    const token  = localStorage.getItem('access_token');
    if (stored && token) setUser(stored);
    setChecking(false);
  }, []);

  const handleLoginSuccess = (u: AuthUser) => setUser(u);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  if (user.role === 'agency' && user.agency === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">طلبك قيد المراجعة</h2>
          <p className="text-blue-200 text-sm mb-6 leading-relaxed">
            تم استلام طلب تسجيل وكالتك بنجاح. سيقوم فريقنا بمراجعة طلبك والتواصل معك قريباً.
          </p>
          <button onClick={handleLogout}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl py-3 text-sm transition-colors">
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isAdmin
          ? <DashboardContent />
          : <AgencyDashboard user={user} />;

      case 'bookings':
        return <BookingsManagement />;

      case 'packages':
        return <PackagesManagement user={user} />;

      case 'customers':
        return <CustomersManagement user={user} />;

      case 'financial':
        return <FinancialReports />;

      case 'settings':
        return <SettingsPage user={user} onLogout={handleLogout} onUserUpdate={u => setUser(u)} />;

      // ── Admin Only ────────────────────────────────────
      case 'destinations':
        return isAdmin ? <DestinationsManagement /> : null;

      case 'hotels':
        return isAdmin ? <HotelsManagement /> : null;
      case 'extranet':
        return isAdmin ? <ExtranetManagement /> : null;

      case 'services':
        return isAdmin ? <ServicesManagement /> : null;

      case 'agencies':
        return isAdmin ? <AgenciesManagement /> : null;

      case 'analytics':
        return isAdmin ? <AnalyticsReports /> : null;

      default:
        return isAdmin
          ? <DashboardContent />
          : <AgencyDashboard user={user} />;
    }
  };

  return (
    <div className="fixed inset-0 flex bg-background" dir="rtl">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          onLogout={handleLogout}
          onNavigate={setActiveTab}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
