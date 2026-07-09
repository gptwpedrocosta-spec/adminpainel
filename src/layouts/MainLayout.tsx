import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { NewRideModal } from '../components/NewRideModal';
import { useAuth } from '../contexts/AuthContext';
import { User, Driver } from '../types';

interface MainLayoutProps {
  currentView: string;
  setView: (view: string) => void;
  onSeedDatabase: () => void;
  isSeeding: boolean;
  users: User[];
  drivers: Driver[];
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentView,
  setView,
  onSeedDatabase,
  isSeeding,
  users,
  drivers,
  children
}) => {
  const { adminProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewRideModal, setShowNewRideModal] = useState(false);

  return (
    <div className="flex h-screen bg-[#f5f6fa] overflow-hidden text-slate-800 font-sans">
      {/* Sidebar - fixed left */}
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        onSeedDatabase={onSeedDatabase}
        isSeeding={isSeeding}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header - fixed top */}
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          onNewRideClick={() => setShowNewRideModal(true)}
          activeView={currentView}
        />

        {/* Dynamic Content Scroll Window */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Quick New Ride simulator overlay modal */}
      {showNewRideModal && (
        <NewRideModal 
          onClose={() => setShowNewRideModal(false)} 
          users={users}
          drivers={drivers}
        />
      )}
    </div>
  );
};
