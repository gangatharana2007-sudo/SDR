import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SOSModal } from './components/SOSModal';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { DisasterMap } from './components/DisasterMap';
import { DisasterReportPage } from './pages/DisasterReportPage';
import { RescueTeamDashboard } from './pages/RescueTeamDashboard';
import { MedicalDashboard } from './pages/MedicalDashboard';
import { ReliefCentreDashboard } from './pages/ReliefCentreDashboard';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SafetyGuidePage } from './pages/SafetyGuidePage';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const { role } = useAuth();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Quick Role Switcher Bar for Seamless Role Simulation */}
      <RoleSwitcherBar />

      {/* 2. Real-time Emergency Warning Banner with Audio Siren */}
      <EmergencyBanner />

      {/* 3. Top Header adhering strictly to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSOS={() => setIsSOSOpen(true)}
      />

      {/* 4. Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        {activeTab === 'home' && (
          <LandingPage
            onOpenSOS={() => setIsSOSOpen(true)}
            onNavigate={tab => setActiveTab(tab)}
          />
        )}

        {activeTab === 'citizen' && (
          <CitizenDashboard
            onOpenSOS={() => setIsSOSOpen(true)}
            onNavigate={tab => setActiveTab(tab)}
          />
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {language === 'ta' ? 'முழுமையான நேரலை பேரிடர் வரைபடம்' : 'Full GIS Operational Incident Map'}
                </h1>
                <p className="text-xs text-slate-500">
                  Real-time Leaflet & OpenStreetMap layers with verified flood zones, relief shelters, and active ambulances
                </p>
              </div>
            </div>
            <DisasterMap height="650px" />
          </div>
        )}

        {activeTab === 'report' && (
          <DisasterReportPage
            onBack={() => setActiveTab('home')}
            onReportCreated={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'rescue' && <RescueTeamDashboard />}

        {activeTab === 'medical' && <MedicalDashboard />}

        {activeTab === 'relief' && <ReliefCentreDashboard />}

        {activeTab === 'volunteer' && <VolunteerDashboard />}

        {activeTab === 'admin' && <AdminDashboard />}

        {activeTab === 'safety' && <SafetyGuidePage />}
      </main>

      {/* 5. SOS Emergency Modal */}
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

      {/* 6. Offline / Low Network Indicator */}
      <OfflineIndicator />

      {/* 7. Public Safety Footer with Official Helplines */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
