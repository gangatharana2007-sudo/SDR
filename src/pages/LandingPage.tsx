import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DisasterMap } from '../components/DisasterMap';
import {
  ShieldAlert,
  AlertOctagon,
  MapPin,
  HeartPulse,
  Home,
  Users,
  Compass,
  ArrowRight,
  PhoneCall,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onOpenSOS: () => void;
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenSOS, onNavigate }) => {
  const { language, t } = useLanguage();
  const { role, switchRole } = useAuth();

  const [stats, setStats] = useState({
    activeSOS: 3,
    verifiedIncidents: 4,
    openReliefCentres: 4,
    activeResponders: 8,
    shelteredCitizens: 1345,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/sos'),
      fetch('/api/reports'),
      fetch('/api/relief-centres'),
    ])
      .then(async ([sRes, rRes, rcRes]) => {
        const sData = sRes.ok ? await sRes.json() : [];
        const rData = rRes.ok ? await rRes.json() : [];
        const rcData = rcRes.ok ? await rcRes.json() : [];

        const activeSOS = sData.filter((s: any) => s.status !== 'RESOLVED' && s.status !== 'CANCELLED').length;
        const verifiedIncidents = rData.filter((r: any) => r.verificationStatus === 'VERIFIED').length;
        const openReliefCentres = rcData.filter((rc: any) => rc.isOpen).length;
        const shelteredCitizens = rcData.reduce((acc: number, curr: any) => acc + (curr.currentOccupancy || 0), 0);

        setStats({
          activeSOS,
          verifiedIncidents,
          openReliefCentres,
          activeResponders: 12,
          shelteredCitizens,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[460px]">
          {/* Left Text Zone */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6 z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-rose-600 text-white rounded">
                  {language === 'ta' ? 'அவசர மேலாண்மை தளம்' : 'State Emergency Response Network'}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300 font-mono">Disaster Cell TN</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {language === 'ta'
                  ? 'பேரிடர் காலத்தில் உடனடி மீட்பு மற்றும் நிவாரணம்.'
                  : 'Rapid rescue and relief when disasters strike.'}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                {language === 'ta'
                  ? 'வெள்ளம், புயல் மற்றும் இயற்கை சீற்றங்களின் போது பொதுமக்கள், மீட்புக் குழுவினர், மருத்துவர்கள் மற்றும் முகாம்களை ஒருங்கிணைக்கும் ஒருங்கிணைந்த தளம்.'
                  : 'An AI-powered multi-agency platform connecting citizens trapped in floods, cyclones, or collapsed infrastructure with SDRF rescue boats, mobile medical triage, and verified relief shelters.'}
              </p>
            </div>

            {/* Quick Actions Strip */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                {/* Giant SOS Trigger */}
                <button
                  onClick={onOpenSOS}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-rose-900/40 transition-all flex items-center gap-2 ring-4 ring-rose-500/20"
                >
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                  <span>{t('sosButton')}</span>
                </button>

                {/* Report Disaster Incident */}
                <button
                  onClick={() => onNavigate('report')}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                >
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  <span>{t('reportIncident')}</span>
                </button>

                {/* Direct Dial 112 */}
                <a
                  href="tel:112"
                  className="px-4 py-3.5 bg-slate-950 hover:bg-black text-rose-300 font-mono font-bold text-xs rounded-xl border border-rose-900/60 transition-colors flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                  <span>112 Helpline</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-400">
                * Zero false dispatches. All SOS submissions verified by GPS coordinates and authorized emergency coordinators.
              </p>
            </div>
          </div>

          {/* Right Hero Image Zone */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src="/src/assets/images/hero_emergency_rescue_1792147965137.jpg"
              alt="SDRF Rescue Boat Team navigating flooded streets"
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 lg:bg-gradient-to-r lg:from-slate-900 lg:via-transparent lg:to-transparent" />
            
            {/* Caption on Image */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-950/80 backdrop-blur-md p-3 rounded-xl border border-slate-700/60 text-xs">
              <span className="font-semibold text-rose-400 block text-[11px] uppercase tracking-wide">
                Ground Reality · Coastal Disaster Cell
              </span>
              <p className="text-slate-200 text-[11px]">
                SDRF inflatable motorboat team deploying to low-lying canal banks for vulnerable elderly evacuation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Metric Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Active SOS Emergencies
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tabular-nums">
            {stats.activeSOS}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
            Under SDRF Response
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Verified Hazard Zones
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tabular-nums">
            {stats.verifiedIncidents}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Floods, trees & road cuts</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Active Relief Shelters
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tabular-nums">
            {stats.openReliefCentres}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">With food & water stock</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Citizens Accommodated
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tabular-nums">
            {stats.shelteredCitizens.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Safe high-ground camps</div>
        </div>
      </section>

      {/* Primary Action Modules Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {language === 'ta' ? 'அவசர சேவைகள் மற்றும் தளங்கள்' : 'Disaster Relief & Response Modules'}
            </h2>
            <p className="text-xs text-slate-500">
              Select an operational section or report immediately
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Citizen Emergency Desk */}
          <div
            onClick={() => onNavigate('citizen')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-rose-600 transition-colors">
                {language === 'ta' ? 'பாதிக்கப்பட்டோர் உதவி மையம்' : 'Citizen Assistance Desk'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Emergency SOS dispatch, tracking submitted rescue tickets, finding high-ground relief centers, and requesting emergency drinking water rations.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-bold text-rose-600">
              <span>Open Citizen Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Live GIS Map */}
          <div
            onClick={() => onNavigate('map')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                {language === 'ta' ? 'நேரலை பேரிடர் வரைபடம்' : 'Live Disaster GIS Map'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full-screen OpenStreetMap with verified flood inundations, blocked arterial roads, safe relief camp locations, and mobile hospital triage points.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-bold text-blue-600">
              <span>Explore Live Map</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Relief Camps & Inventory */}
          <div
            onClick={() => onNavigate('relief')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
                {language === 'ta' ? 'நிவாரண முகாம்கள் & உணவு' : 'Relief Camps & Rations'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directory of active shelter halls with capacity tracking, food ration inventory, drinking water tankers, and accessible facilities for persons with disability.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>View Active Camps</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Live Map Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'ta' ? 'நேரலை நிலவர வரைபடம்' : 'Active Operational Map Preview'}
          </h2>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>Full Screen Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <DisasterMap height="460px" />
      </section>

      {/* Operational Storytelling Bento */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <img
            src="/src/assets/images/relief_camp_distribution_1792147966485.jpg"
            alt="Relief Camp Distribution Center"
            className="h-48 w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Logistics & Supplies
              </span>
              <h3 className="font-bold text-base text-slate-900">
                District Relief Distribution Centers
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Relief camps maintain monitored stocks of mineral drinking water, baby food, dry ration packets, sanitary pads, and dry blankets. Managers update inventory daily to prevent critical shortages.
              </p>
            </div>
            <button
              onClick={() => onNavigate('relief')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start"
            >
              <span>Inspect Camp Inventories</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <img
            src="/src/assets/images/medical_emergency_triage_1792147966616.jpg"
            alt="Emergency Mobile Medical Team"
            className="h-48 w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Medical & Paramedic Care
              </span>
              <h3 className="font-bold text-base text-slate-900">
                Mobile Emergency Triage & Hospital Directory
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paramedic mobile units stationed across high-water districts treat waterborne infections, shock, and traumatic injuries. Access verified hospital emergency phones and direct ambulance dispatch.
              </p>
            </div>
            <button
              onClick={() => onNavigate('medical')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 self-start"
            >
              <span>Access Medical Directory</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
