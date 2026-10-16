import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SOSRequest, DisasterAlert, ReliefCentre } from '../types';
import {
  ShieldAlert,
  AlertOctagon,
  MapPin,
  HeartPulse,
  Droplets,
  Home,
  FileText,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react';

interface CitizenDashboardProps {
  onOpenSOS: () => void;
  onNavigate: (tab: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onOpenSOS, onNavigate }) => {
  const { language, t } = useLanguage();
  const { currentUser } = useAuth();

  const [myRequests, setMyRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyCamps, setNearbyCamps] = useState<ReliefCentre[]>([]);

  useEffect(() => {
    fetchRequests();
    fetch('/api/relief-centres')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setNearbyCamps(data.slice(0, 3));
      })
      .catch(() => {});
  }, [currentUser]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sos');
      if (res.ok) {
        const data: SOSRequest[] = await res.json();
        // If current user is logged in, show their requests or recent
        if (currentUser?.phone) {
          const filtered = data.filter(s => s.citizenPhone === currentUser.phone || s.citizenId === currentUser.id);
          setMyRequests(filtered.length > 0 ? filtered : data.slice(0, 3));
        } else {
          setMyRequests(data.slice(0, 3));
        }
      }
    } catch (e) {
      console.warn('Could not fetch requests', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Card with Giant SOS Emergency Button */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded">
              {language === 'ta' ? 'குடிமக்கள் உதவி முகப்பு' : 'Citizen Assistance Portal'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              {language === 'ta'
                ? `வணக்கம், ${currentUser?.name || 'நண்பரே'}`
                : `Welcome, ${currentUser?.name || 'Citizen'}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {language === 'ta'
                ? 'அவசர உதவிக்கு கீழே உள்ள பெரிய சிவப்பு பொத்தானை அழுத்தவும் அல்லது 112 ஐ அழைக்கவும்.'
                : 'Need immediate rescue, food, or medical evacuation? Press the red SOS Emergency button below.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:112"
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm rounded-xl border border-rose-200 transition-colors flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>{language === 'ta' ? 'அவசர எண் 112' : 'Direct Helpline 112'}</span>
            </a>
          </div>
        </div>

        {/* The Big Accessible SOS Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onOpenSOS}
            className="w-full sm:w-auto flex-1 py-5 px-6 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-lg sm:text-2xl rounded-2xl shadow-xl shadow-rose-900/30 transition-all flex items-center justify-center gap-3 ring-4 ring-rose-500/20"
          >
            <ShieldAlert className="w-8 h-8 animate-pulse text-white" />
            <div className="text-left">
              <div className="leading-tight">{t('sosButton')}</div>
              <div className="text-xs font-normal text-rose-100 font-sans">
                {language === 'ta' ? 'உடனடி மீட்புக் குழுவை அழைக்க அழுத்தவும்' : 'Dispatch SDRF Boats & Evacuation Teams'}
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('report')}
            className="w-full sm:w-auto py-5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base sm:text-lg rounded-2xl shadow-md transition-all flex items-center justify-center gap-3"
          >
            <AlertOctagon className="w-6 h-6 text-amber-400" />
            <div className="text-left">
              <div className="leading-tight">{language === 'ta' ? 'பாதிப்பைப் பதிவு செய்க' : 'Report Incident'}</div>
              <div className="text-xs font-normal text-slate-300">
                {language === 'ta' ? 'வெள்ளம், மரம் விழுந்தது, மின்தடை' : 'Waterlogging, Tree Falls, Cut Lines'}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Accessible Quick Needs Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {language === 'ta' ? 'துரித உதவி கோரிக்கைகள்' : 'Direct Assistance Requests'}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={onOpenSOS}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900">
              {language === 'ta' ? 'மீட்பு படகு உதவி' : 'Rescue Assistance'}
            </div>
            <p className="text-[11px] text-slate-500">
              Trapped in flood waters or isolated rooftops
            </p>
          </button>

          <button
            onClick={() => onNavigate('medical')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900">
              {language === 'ta' ? 'மருத்துவ உதவி' : 'Medical Assistance'}
            </div>
            <p className="text-[11px] text-slate-500">
              Urgent medicines, trauma care & ambulances
            </p>
          </button>

          <button
            onClick={() => onNavigate('relief')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900">
              {language === 'ta' ? 'உணவு & குடிநீர்' : 'Food & Water Rations'}
            </div>
            <p className="text-[11px] text-slate-500">
              Drinking water crates and baby food packets
            </p>
          </button>

          <button
            onClick={() => onNavigate('relief')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900">
              {language === 'ta' ? 'நிவாரண முகாம்கள்' : 'Find Relief Camps'}
            </div>
            <p className="text-[11px] text-slate-500">
              Locate nearby operational shelter halls
            </p>
          </button>
        </div>
      </section>

      {/* Track My Requests Section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>{t('trackRequests')}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Real-time multi-stage status of your registered emergency tickets
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            Refresh Status
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading requests...</div>
        ) : myRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
            No active emergency tickets found for this device. If you need help, press the SOS button above.
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map(req => {
              const isResolved = req.status === 'RESOLVED';
              const isAssigned = req.status === 'ASSIGNED' || req.status === 'TEAM_DISPATCHED';

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {req.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 uppercase">
                        {req.disasterType} ({req.peopleCount} {req.peopleCount === 1 ? 'person' : 'people'})
                      </span>
                      {req.hasUrgentMedical && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          Medical Priority
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded font-mono uppercase ${
                        req.status === 'SUBMITTED'
                          ? 'bg-amber-100 text-amber-900'
                          : req.status === 'ASSIGNED'
                          ? 'bg-blue-100 text-blue-900'
                          : req.status === 'TEAM_DISPATCHED'
                          ? 'bg-indigo-100 text-indigo-900'
                          : req.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Location: <strong className="text-slate-800">{req.location.address || `${req.location.lat}, ${req.location.lng}`}</strong>
                    {req.location.landmark ? ` (Near ${req.location.landmark})` : ''}
                  </p>

                  {req.statusNotes && (
                    <div className="p-2.5 bg-blue-50/60 border border-blue-200/60 rounded text-xs text-blue-900 space-y-0.5">
                      <span className="font-bold block text-[11px]">Command Dispatch Notes:</span>
                      <p>{req.statusNotes}</p>
                    </div>
                  )}

                  {req.assignedTeamName && (
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                      <span>Assigned Responders:</span>
                      <strong className="text-slate-900">{req.assignedTeamName}</strong>
                      {req.assignedTeamPhone && (
                        <a href={`tel:${req.assignedTeamPhone}`} className="text-rose-600 font-bold ml-1">
                          ({req.assignedTeamPhone})
                        </a>
                      )}
                    </div>
                  )}

                  {/* 6-stage Visual Workflow Bar */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-6 gap-1 text-[9px] sm:text-[10px] text-center font-mono">
                      <div className={`p-1 rounded ${req.status !== 'CANCELLED' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200'}`}>
                        SUBMITTED
                      </div>
                      <div className={`p-1 rounded ${['UNDER_REVIEW', 'ASSIGNED', 'TEAM_DISPATCHED', 'ASSISTANCE_PROVIDED', 'RESOLVED'].includes(req.status) ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>
                        REVIEW
                      </div>
                      <div className={`p-1 rounded ${['ASSIGNED', 'TEAM_DISPATCHED', 'ASSISTANCE_PROVIDED', 'RESOLVED'].includes(req.status) ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>
                        ASSIGNED
                      </div>
                      <div className={`p-1 rounded ${['TEAM_DISPATCHED', 'ASSISTANCE_PROVIDED', 'RESOLVED'].includes(req.status) ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>
                        DISPATCH
                      </div>
                      <div className={`p-1 rounded ${['ASSISTANCE_PROVIDED', 'RESOLVED'].includes(req.status) ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>
                        ON-SITE
                      </div>
                      <div className={`p-1 rounded ${req.status === 'RESOLVED' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>
                        RESOLVED
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Nearby Relief Camps Quick Peek */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {language === 'ta' ? 'அருகிலுள்ள நிவாரண முகாம்கள்' : 'Nearby Operational Relief Camps'}
          </h2>
          <button
            onClick={() => onNavigate('relief')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>{t('findReliefCamps')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {nearbyCamps.map(camp => (
            <div key={camp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {camp.district}
                </span>
                <span className="text-xs font-bold text-emerald-700">Open Shelter</span>
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                {camp.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1">{camp.address}</p>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Occupancy: <strong className="font-mono text-slate-900">{camp.currentOccupancy} / {camp.totalCapacity}</strong></span>
                <a
                  href={`tel:${camp.phone}`}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Call Camp
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
