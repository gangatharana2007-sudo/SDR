import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DisasterCategory, SOSRequest, LocationCoordinates } from '../types';
import {
  AlertTriangle,
  MapPin,
  Users,
  HeartPulse,
  Baby,
  UserCheck,
  Accessibility,
  PhoneCall,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Mic,
  X,
} from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSOSCreated?: (request: SOSRequest) => void;
}

const CATEGORIES: { id: DisasterCategory; labelEn: string; labelTa: string }[] = [
  { id: 'flood', labelEn: 'Flood / Water Submerged', labelTa: 'வெள்ளம் / நீர் சூழ்ந்துள்ளது' },
  { id: 'building_collapse', labelEn: 'Building Collapse / Trapped', labelTa: 'கட்டிட இடிபாடு / சிக்கியுள்ளோம்' },
  { id: 'cyclone', labelEn: 'Cyclone / Severe Storm', labelTa: 'புயல் / சூறாவளி காற்று' },
  { id: 'medical_emergency', labelEn: 'Critical Medical Emergency', labelTa: 'தீவிர மருத்துவ அவசரம்' },
  { id: 'fire', labelEn: 'Fire Hazard / Smoke', labelTa: 'தீ விபத்து / புகை' },
  { id: 'landslide', labelEn: 'Landslide / Rockfall', labelTa: 'நிலச்சரிவு' },
  { id: 'other', labelEn: 'Other Life Threat', labelTa: 'இதர ஆபத்து' },
];

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, onSOSCreated }) => {
  const { language, t, startVoiceInput, isListening, playEmergencySiren } = useLanguage();
  const { currentUser } = useAuth();

  // Form State
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [disasterType, setDisasterType] = useState<DisasterCategory>('flood');
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [hasUrgentMedical, setHasUrgentMedical] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [district, setDistrict] = useState(currentUser?.district || 'Chennai');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');

  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<LocationCoordinates>({
    lat: 13.0827,
    lng: 80.2707,
    district: 'Chennai',
  });
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Submission response
  const [submittedRequest, setSubmittedRequest] = useState<SOSRequest | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setSubmittedRequest(null);
      detectLocation();
    }
  }, [isOpen]);

  const detectLocation = () => {
    setGpsLoading(true);
    setGpsError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            district: district || 'Chennai',
          });
          setGpsVerified(true);
          setGpsLoading(false);
        },
        err => {
          console.warn('Geolocation error:', err.message);
          setGpsError('Could not acquire GPS coordinates automatically. Please specify location manually below.');
          setGpsVerified(false);
          setGpsLoading(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setGpsError('GPS not supported by device. Please enter address manually.');
      setGpsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      alert('Contact phone number is required so rescue teams can coordinate.');
      return;
    }

    setStep('submitting');
    playEmergencySiren();

    const payload = {
      citizenId: currentUser?.id || `cit-${Date.now()}`,
      citizenName: name.trim() || 'Citizen Requester',
      citizenPhone: phone.trim(),
      disasterType,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        district: district.trim(),
        address: address.trim() || `${district} - GPS (${coords.lat}, ${coords.lng})`,
        landmark: landmark.trim(),
      },
      peopleCount: Number(peopleCount) || 1,
      hasUrgentMedical,
      hasChildren,
      hasElderly,
      hasDisability,
      notes: notes.trim(),
    };

    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedRequest(data.request);
        setDuplicateWarning(Boolean(data.isDuplicateWarning));
        setAiAnalysis(data.aiAnalysis);
        setStep('success');
        if (onSOSCreated) onSOSCreated(data.request);
      } else {
        alert(data.error || 'Failed to submit SOS request. Please dial 112 directly.');
        setStep('form');
      }
    } catch (err) {
      console.error('SOS submission failed:', err);
      // Fallback offline object
      const offlineReq: SOSRequest = {
        id: `SOS-OFFLINE-${Date.now().toString().slice(-4)}`,
        citizenId: currentUser?.id || 'offline-cit',
        citizenName: name || 'Citizen',
        citizenPhone: phone,
        disasterType,
        location: payload.location,
        peopleCount,
        hasUrgentMedical,
        hasChildren,
        hasElderly,
        hasDisability,
        notes,
        status: 'SUBMITTED',
        priority: hasUrgentMedical ? 'critical' : 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusNotes: 'Queued offline. Call 112 directly.',
      };
      setSubmittedRequest(offlineReq);
      setStep('success');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Strip */}
        <div className="bg-rose-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl tracking-tight leading-tight">
                {language === 'ta' ? 'SOS அவசர மீட்பு கோரிக்கை' : 'Emergency SOS Rescue Request'}
              </h3>
              <p className="text-xs text-rose-100 font-medium">
                {language === 'ta' ? 'மாநில பேரிடர் கட்டுப்பாட்டு மையத்திற்கு அனுப்பப்படும்' : 'Direct Dispatch to State & District Response Units'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 112 Call Out Banner */}
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-900">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Immediate life danger?</span>
          </span>
          <a
            href="tel:112"
            className="inline-flex items-center gap-1 font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded-md shadow-sm transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112 Now</span>
          </a>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. {language === 'ta' ? 'பேரிடர் வகை' : 'Emergency Category'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => {
                  const isSel = disasterType === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setDisasterType(c.id)}
                      className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                        isSel
                          ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {language === 'ta' ? c.labelTa : c.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* People Count & Vulnerabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. {language === 'ta' ? 'பாதிக்கப்பட்டோர் எண்ணிக்கை' : 'People Needing Rescue'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={peopleCount}
                    onChange={e => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold font-mono"
                  />
                  <span className="text-xs text-slate-500">
                    {language === 'ta' ? 'நபர்கள்' : 'individuals'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {language === 'ta' ? 'தொடர்பு தொலைபேசி' : 'Contact Phone'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9840123456"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            {/* Vulnerabilities Checklist */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. {language === 'ta' ? 'சிறப்பு கவனிப்பு / உடனடி தேவைகள்' : 'Vulnerabilities & Urgent Medical Needs'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${hasUrgentMedical ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold' : 'border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={hasUrgentMedical}
                    onChange={e => setHasUrgentMedical(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{language === 'ta' ? 'அவசர சிகிச்சை தேவை' : 'Critical Medical / Oxygen / Bleeding'}</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${hasChildren ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold' : 'border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={e => setHasChildren(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <Baby className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{language === 'ta' ? 'குழந்தைகள் உள்ளனர்' : 'Infants / Small Children'}</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${hasElderly ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold' : 'border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={hasElderly}
                    onChange={e => setHasElderly(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{language === 'ta' ? 'முதியவர்கள் உள்ளனர்' : 'Elderly / Senior Citizens'}</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${hasDisability ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold' : 'border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={hasDisability}
                    onChange={e => setHasDisability(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <Accessibility className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{language === 'ta' ? 'மாற்றுத்திறனாளிகள்' : 'Persons with Disabilities'}</span>
                </label>
              </div>
            </div>

            {/* Location & GPS */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>4. {language === 'ta' ? 'இருப்பிடம் மற்றும் முகவரி' : 'Location Details'} *</span>
                </label>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={gpsLoading}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  {gpsLoading ? 'Detecting GPS...' : 'Refresh GPS'}
                </button>
              </div>

              {gpsVerified ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded text-xs flex items-center justify-between font-mono">
                  <span>GPS: {coords.lat}, {coords.lng}</span>
                  <span className="text-[11px] font-sans font-semibold text-emerald-700">✓ Verified</span>
                </div>
              ) : gpsError ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded text-xs">
                  {gpsError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">District</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Cuddalore">Cuddalore</option>
                    <option value="Kanchipuram">Kanchipuram</option>
                    <option value="Nagapattinam">Nagapattinam</option>
                    <option value="Tiruvallur">Tiruvallur</option>
                    <option value="Kanyakumari">Kanyakumari</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Salem">Salem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Bus Stand / School / Water Tank"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Street Address / Floor Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Door No 14, 2nd Floor, Anna Nagar Main Road"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>

              {/* Notes / Voice Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Additional Situation Details
                  </label>
                  <button
                    type="button"
                    onClick={() => startVoiceInput(text => setNotes(prev => prev ? `${prev} ${text}` : text))}
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      isListening ? 'text-rose-600 animate-pulse' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{isListening ? t('listening') : t('voiceInput')}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Water reached 4 feet. No power. Trapped on rooftop."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{language === 'ta' ? 'SOS மீட்புக் கோரிக்கையை அனுப்பு' : 'Submit SOS Emergency'}</span>
              </button>
            </div>
          </form>
        )}

        {step === 'submitting' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h4 className="text-base font-bold text-slate-900">
              {language === 'ta' ? 'அவசர கோரிக்கை கட்டுப்பாட்டு அறைக்கு அனுப்பப்படுகிறது...' : 'Transmitting Emergency Coordinates to Command Center...'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Categorizing situation, verifying duplicates, and alerting district rescue officers.
            </p>
          </div>
        )}

        {step === 'success' && submittedRequest && (
          <div className="p-6 space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">
                {language === 'ta' ? 'அவசர கோரிக்கை வெற்றிகரமாகப் பெறப்பட்டது' : 'Emergency Request Confirmed & Logged'}
              </h4>
              <p className="text-xs text-emerald-800">
                Unique Tracking ID: <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-300">{submittedRequest.id}</span>
              </p>
              <p className="text-xs text-slate-600">
                Logged at <span className="font-mono">{new Date(submittedRequest.createdAt).toLocaleTimeString()}</span> · Status: <span className="font-bold text-rose-700">{submittedRequest.status}</span>
              </p>
            </div>

            {duplicateWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Duplicate Safeguard:</strong> {submittedRequest.statusNotes || 'Recent emergency report recognized from this contact. Rescue officers consolidated this ticket.'}
                </div>
              </div>
            )}

            {aiAnalysis && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-indigo-100 text-indigo-800 rounded">
                      {aiAnalysis.source === 'gemini_ai' ? 'Gemini AI Advisory' : 'System Rule Triage'}
                    </span>
                    <span>Triage Summary</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    aiAnalysis.priority === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Priority: {aiAnalysis.priority}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {language === 'ta' && aiAnalysis.summaryTa ? aiAnalysis.summaryTa : aiAnalysis.summary}
                </p>
                <div className="pt-1 text-[11px] text-slate-500 italic">
                  * {language === 'ta' ? 'அதிகாரிகளின் நேரடி முடிவே இறுதியானது.' : 'Advisory suggestion for incident commanders. Final dispatch authorized by human duty officer.'}
                </div>
              </div>
            )}

            {/* Workflow Progress Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Response Workflow Status
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px] text-center font-medium">
                <div className="p-1.5 bg-emerald-600 text-white rounded font-bold">1. SUBMITTED</div>
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded">2. REVIEW</div>
                <div className="p-1.5 bg-slate-100 text-slate-500 rounded">3. ASSIGNED</div>
                <div className="p-1.5 bg-slate-100 text-slate-500 rounded">4. DISPATCH</div>
                <div className="p-1.5 bg-slate-100 text-slate-500 rounded">5. ON-SITE</div>
                <div className="p-1.5 bg-slate-100 text-slate-500 rounded">6. RESOLVED</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 112 Helpline</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close & Track Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
