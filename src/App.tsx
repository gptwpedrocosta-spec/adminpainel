import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Drivers } from './pages/Drivers';
import { Rides } from './pages/Rides';
import { Deliveries } from './pages/Deliveries';
import { Financial } from './pages/Financial';
import { LiveMap } from './pages/LiveMap';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Registrations } from './pages/Registrations';
import { Security } from './pages/Security';
import { AuditLogs } from './pages/AuditLogs';
import { BackupSecurity } from './pages/BackupSecurity';
import { LoginView } from './components/LoginView';
import { NewRideModal } from './components/NewRideModal';
import { ProtectedRoute } from './components/ProtectedRoute';

// Firestore real-time subscriptions
import { 
  subscribeToUsers, 
  subscribeToDrivers, 
  subscribeToRides, 
  subscribeToDeliveries, 
  subscribeToWallets, 
  subscribeToTransactions 
} from './services/dbService';

// Types
import { User, Driver, Ride, DeliveryDetails, Wallet, Transaction } from './types';

function InnerApp() {
  const { user, loading: authLoading } = useAuth();
  
  // App views and menus state
  const [currentView, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewRideModal, setShowNewRideModal] = useState(false);

  // Firestore Collections State
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryDetails[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  // Subscribe to real-time updates when user is authenticated
  useEffect(() => {
    if (!user) {
      setCollectionsLoading(false);
      return;
    }

    setCollectionsLoading(true);

    // Set up subscribers
    const unsubUsers = subscribeToUsers((data) => setUsers(data));
    const unsubDrivers = subscribeToDrivers((data) => setDrivers(data));
    const unsubRides = subscribeToRides((data) => setRides(data));
    const unsubDeliveries = subscribeToDeliveries((data) => setDeliveries(data));
    const unsubWallets = subscribeToWallets((data) => {
      setWallets(data);
      setCollectionsLoading(false);
    }, (err) => {
      // If collection permission denied/empty, stop loading
      setCollectionsLoading(false);
    });
    const unsubTxs = subscribeToTransactions((data) => setTransactions(data));

    return () => {
      unsubUsers();
      unsubDrivers();
      unsubRides();
      unsubDeliveries();
      unsubWallets();
      unsubTxs();
    };
  }, [user]);

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-display font-bold text-xl animate-bounce shadow-lg shadow-amber-500/20">
          M
        </div>
        <h3 className="font-display font-bold mt-4 text-sm tracking-wider uppercase text-amber-400">MotoJá Admin</h3>
        <p className="text-xs text-slate-400 font-mono mt-1">Carregando chaves de segurança...</p>
      </div>
    );
  }

  // Not logged in -> Show login view (as fallback, ProtectedRoute handles this first)
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar Nav */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          onNewRideClick={() => setShowNewRideModal(true)}
          activeView={currentView}
        />

        {/* Dynamic Page Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {collectionsLoading ? (
            /* Loading skeletons while onSnapshot connects */
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-28 bg-white border border-slate-100 rounded-2xl p-5" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-72 bg-white border border-slate-100 rounded-2xl lg:col-span-2" />
                <div className="h-72 bg-white border border-slate-100 rounded-2xl" />
              </div>
            </div>
          ) : (
            /* Render active view with transition block */
            <div className="fade-in duration-300">
              {currentView === 'dashboard' && (
                <Dashboard 
                  users={users} 
                  drivers={drivers} 
                  rides={rides} 
                  wallets={wallets} 
                  setView={setView}
                />
              )}
              {currentView === 'users' && <Users users={users} wallets={wallets} rides={rides} />}
              {currentView === 'drivers' && <Drivers drivers={drivers} wallets={wallets} rides={rides} />}
              {currentView === 'rides' && <Rides rides={rides} />}
              {currentView === 'deliveries' && <Deliveries deliveries={deliveries} rides={rides} />}
              {currentView === 'financial' && <Financial wallets={wallets} transactions={transactions} />}
              {currentView === 'map' && <LiveMap drivers={drivers} rides={rides} users={users} />}
              {currentView === 'registrations' && <Registrations />}
              {currentView === 'security' && <Security />}
              {currentView === 'audit_logs' && <AuditLogs />}
              {currentView === 'backup_security' && <BackupSecurity />}
              {currentView === 'notifications' && <Notifications />}
              {currentView === 'settings' && <Settings />}
            </div>
          )}
        </main>
      </div>

      {/* New Ride simulation modal */}
      {showNewRideModal && (
        <NewRideModal 
          onClose={() => setShowNewRideModal(false)} 
          users={users}
          drivers={drivers}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <InnerApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}
