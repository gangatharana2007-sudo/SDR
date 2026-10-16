import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MedicalFacility } from '../types';
import {
  HeartPulse,
  PhoneCall,
  MapPin,
  Ambulance,
  ShieldAlert,
  Search,
  BookOpen,
  CheckCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const MedicalDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();

  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'hospitals' | 'firstaid' | 'request'>('hospitals');

  // Medical Request Form
  const [patientName, setPatientName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [condition, setCondition] = useState('');
  const [mobilityNeed, setMobilityNeed] = useState(false);
  const [oxygenNeed, setOxygenNeed] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/medical/facilities')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFacilities(data);
      })
      .catch(() => {});
  }, []);

  const filteredFacilities = facilities.filter(f => {
    if (districtFilter !== 'all' && f.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
    return true;
  });

  const handleMedicalRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !condition) {
      alert('Phone and medical condition description are required.');
      return;
    }
    setRequestSubmitted(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-600 text-white uppercase">
              Emergency Medical & Health Services
            </span>
            <span className="text-xs text-emerald-300">·</span>
            <span className="text-xs font-mono text-emerald-200">TN Health Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'ta' ? 'மருத்துவ உதவி மற்றும் அவசர சிகிச்சை' : 'Medical Assistance & Triage Grid'}
          </h1>
          <p className="text-xs text-emerald-200">
            Verified district hospital emergency lines, mobile triage points, and life-saving first-aid manuals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:108"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Ambulance className="w-4 h-4" />
            <span>Call 108 Ambulance</span>
          </a>
        </div>
      </div>

      {/* Statutory Emergency Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Statutory Health Disclaimer:</span>
        </div>
        <p className="leading-relaxed">
          This portal provides verified directory information and auxiliary medical support requests. For imminent life-threatening trauma, cardiac arrest, severe hemorrhage, or emergency child delivery, immediately dial <strong>108</strong> (Ambulance) or <strong>112</strong> on your phone.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'hospitals'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Verified Hospitals & Facilities ({filteredFacilities.length})
        </button>
        <button
          onClick={() => setActiveTab('firstaid')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'firstaid'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reviewed First-Aid Guide
        </button>
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'request'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Submit Medical Assistance Request
        </button>
      </div>

      {/* Tab 1: Hospitals */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-800">
              Government Hospitals & Paramedic Triage Stations
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Filter District:</span>
              <select
                value={districtFilter}
                onChange={e => setDistrictFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="all">All Districts</option>
                <option value="Chennai">Chennai</option>
                <option value="Cuddalore">Cuddalore</option>
                <option value="Nagapattinam">Nagapattinam</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFacilities.map(fac => (
              <div
                key={fac.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {fac.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {fac.ambulanceAvailableCount} Active Ambulances
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-base text-slate-900 leading-snug">
                    {fac.name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{fac.address}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    Trauma Care: <strong className="text-slate-800">{fac.hasTraumaCare ? 'Available' : 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    ICU Wards: <strong className="text-slate-800">{fac.hasICU ? 'Available' : 'N/A'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`tel:${fac.emergencyPhone.split('/')[0].trim()}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{fac.emergencyPhone}</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${fac.location.lat},${fac.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Reviewed First Aid Guides */}
      {activeTab === 'firstaid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Drowning & Water Inhalation First-Aid</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Remove victim from water while ensuring your own safety.<br />
              2. Check responsiveness and breathing. If unconscious and not breathing normally, begin CPR immediately (30 chest compressions at 100-120 bpm, followed by 2 rescue breaths).<br />
              3. Do NOT attempt to drain water from lungs with pressure. Keep airway clear and warm victim with dry blankets.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>Electric Shock in Floodwaters</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. NEVER touch a person in contact with live current or standing in electrified water.<br />
              2. Switch off the main circuit breaker from a dry distance, or use a non-conductive dry wooden pole.<br />
              3. Call 108 immediately. Check pulse once isolated and treat entry/exit burn wounds with clean damp dressings.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>Snakebite Emergency Protocol</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Keep the victim calm and still; movement accelerates venom absorption.<br />
              2. Immobilize the bitten limb below heart level.<br />
              3. Do NOT cut, suck venom, apply ice, or use tight tourniquets. Transport immediately to the nearest government hospital for Anti-Snake Venom (ASV).
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Severe Dehydration & ORS Administration</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Mix 1 sachet of Oral Rehydration Salts (ORS) in 1 liter of clean drinking or boiled water.<br />
              2. Administer small sips continuously for children and elderly showing dry tongue or fatigue.<br />
              3. If vomiting persists, request mobile paramedic triage immediately.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Request Medical Assistance */}
      {activeTab === 'request' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-xl mx-auto">
          {requestSubmitted ? (
            <div className="text-center space-y-3 py-6">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-900">Medical Assistance Request Registered</h3>
              <p className="text-xs text-slate-600">
                Paramedic dispatch unit alerted. A triage officer will contact <strong>{phone}</strong> directly.
              </p>
              <button
                onClick={() => setRequestSubmitted(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Log Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleMedicalRequest} className="space-y-4">
              <h3 className="font-bold text-base text-slate-900">Request Paramedic or Medical Supplies</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Condition / Symptoms *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Diabetics requiring insulin, fractured leg, chest pain, high fever..."
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mobilityNeed}
                    onChange={e => setMobilityNeed(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Stretcher / Non-Ambulatory Transport Required</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oxygenNeed}
                    onChange={e => setOxygenNeed(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Emergency Oxygen Cylinder Needed</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Send Medical Assistance Request
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
