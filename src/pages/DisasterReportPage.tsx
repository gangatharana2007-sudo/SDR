import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DisasterCategory, DisasterReport } from '../types';
import {
  AlertOctagon,
  MapPin,
  Camera,
  Users,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface DisasterReportPageProps {
  onBack: () => void;
  onReportCreated?: (report: DisasterReport) => void;
}

const REPORT_CATEGORIES: { id: DisasterCategory; labelEn: string; labelTa: string }[] = [
  { id: 'flood', labelEn: 'Flooding & Waterlogging', labelTa: 'வெள்ளப்பெருக்கு & நீர் தேக்கம்' },
  { id: 'cyclone', labelEn: 'Cyclone & Wind Impact', labelTa: 'புயல் & காற்று சேதம்' },
  { id: 'blocked_road', labelEn: 'Blocked Road / Fallen Trees', labelTa: 'சாலை அடைப்பு / விழுந்த மரம்' },
  { id: 'building_collapse', labelEn: 'Structural / Wall Collapse', labelTa: 'கட்டிடம் / சுவர் இடிபாடு' },
  { id: 'landslide', labelEn: 'Landslide / Hill Mudflow', labelTa: 'நிலச்சரிவு' },
  { id: 'fire', labelEn: 'Fire Hazard / Sparks', labelTa: 'தீ விபத்து / புகை' },
  { id: 'power_outage', labelEn: 'Substation Inundation / Power Cut', labelTa: 'மின் விநியோகத் தடை' },
  { id: 'medical_emergency', labelEn: 'Casualties / Medical Aid Needed', labelTa: 'மருத்துவ சிகிச்சை தேவை' },
  { id: 'missing_person', labelEn: 'Missing Person Concern', labelTa: 'காணாமல் போனவர்கள்' },
  { id: 'other', labelEn: 'Other Public Hazard', labelTa: 'இதர ஆபத்துக்கள்' },
];

export const DisasterReportPage: React.FC<DisasterReportPageProps> = ({ onBack, onReportCreated }) => {
  const { language, t } = useLanguage();
  const { currentUser } = useAuth();

  const [category, setCategory] = useState<DisasterCategory>('flood');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState(currentUser?.district || 'Chennai');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [peopleAffected, setPeopleAffected] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // GPS
  const [lat, setLat] = useState<number>(13.0827);
  const [lng, setLng] = useState<number>(80.2707);
  const [gpsVerified, setGpsVerified] = useState(false);

  // AI Pre-Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<DisasterReport | null>(null);

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(Number(pos.coords.latitude.toFixed(5)));
          setLng(Number(pos.coords.longitude.toFixed(5)));
          setGpsVerified(true);
        },
        () => {
          alert('GPS permission not available. Enter address manually below.');
        }
      );
    }
  };

  const runAiAnalysis = async () => {
    if (!description && !title) {
      alert('Please enter a title or description first.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `${title}. ${description}`,
          category,
          peopleCount: peopleAffected || 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiPreview(data);
      }
    } catch (e) {
      console.warn('AI analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        setImagePreview(ev.target?.result as string);
        setImageUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Title and incident description are required.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      reporterId: currentUser?.id || `cit-${Date.now()}`,
      reporterName: currentUser?.name || 'Citizen Reporter',
      reporterPhone: currentUser?.phone,
      category,
      title: title.trim(),
      description: description.trim(),
      location: {
        lat,
        lng,
        district,
        address: address.trim() || `${district} - (${lat}, ${lng})`,
        landmark: landmark.trim(),
      },
      incidentTime: new Date().toISOString(),
      peopleAffectedCount: peopleAffected ? Number(peopleAffected) : undefined,
      imageUrl,
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedReport(data.report);
        if (onReportCreated) onReportCreated(data.report);
      } else {
        alert(data.error || 'Failed to submit report. Please retry.');
      }
    } catch (e) {
      alert('Network failure during submission. Your report draft has been preserved locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {language === 'ta' ? 'பேரிடர் பாதிப்பைப் பதிவு செய்' : 'Report a Disaster Incident'}
          </h1>
          <p className="text-xs text-slate-500">
            Submit verified hazards, flooding, road closures, or power breakdowns to the State Disaster Cell
          </p>
        </div>
      </div>

      {submittedReport ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ta' ? 'அறிக்கை வெற்றிகரமாகப் பதிவு செய்யப்பட்டது' : 'Disaster Report Logged Successfully'}
          </h2>
          <p className="text-xs text-slate-600">
            Assigned Incident Tracking ID: <span className="font-mono font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-900">{submittedReport.id}</span>
          </p>
          <div className="max-w-md mx-auto p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
            <div>Category: <strong className="uppercase">{submittedReport.category}</strong></div>
            <div>Location: <strong>{submittedReport.location.address}</strong></div>
            <div>Verification Status: <span className="text-amber-700 font-bold">{submittedReport.verificationStatus}</span></div>
            <p className="text-[11px] text-slate-500 pt-1">
              District disaster moderators and quick response teams have received your report notification.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedReport(null);
                setTitle('');
                setDescription('');
                setAddress('');
                setAiPreview(null);
                setImagePreview(null);
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Submit Another Report
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Back to Overview
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Incident Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REPORT_CATEGORIES.map(c => {
                const isSelected = category === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      isSelected
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

          {/* Title & Description */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                2. Incident Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 4ft Waterlogging with stalled buses at Velachery Main Road"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                3. Detailed Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe current water height, road condition, fallen trees or electric wires, trapped people..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            {/* AI Assistant Analysis Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isAnalyzing ? 'Analyzing via Gemini AI...' : 'Pre-Analyze Report with AI'}</span>
              </button>
              <span className="text-[11px] text-slate-400">
                Detects urgent life threats & duplicate reports
              </span>
            </div>

            {aiPreview && (
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>AI Advisory Assessment ({aiPreview.source})</span>
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-indigo-200 text-indigo-900">
                    Suggested Priority: {aiPreview.priority}
                  </span>
                </div>
                <p className="text-slate-800">{aiPreview.summary}</p>
                {aiPreview.isDuplicateSuspect && (
                  <div className="text-amber-800 font-semibold text-[11px] bg-amber-100/70 p-1.5 rounded">
                    ⚠️ {aiPreview.duplicateNotes}
                  </div>
                )}
                <div className="text-[11px] text-slate-600">
                  Safety Guidance: {aiPreview.safetyGuidanceEn}
                </div>
              </div>
            )}
          </div>

          {/* Location & Photo */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>4. Location Coordinates & Address *</span>
              </label>
              <button
                type="button"
                onClick={detectLocation}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold"
              >
                {gpsVerified ? 'GPS Coordinates Locked ✓' : 'Detect Current GPS'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">District *</label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Chennai">Chennai</option>
                  <option value="Cuddalore">Cuddalore</option>
                  <option value="Kanchipuram">Kanchipuram</option>
                  <option value="Nagapattinam">Nagapattinam</option>
                  <option value="Tiruvallur">Tiruvallur</option>
                  <option value="Kanyakumari">Kanyakumari</option>
                  <option value="Salem">Salem</option>
                  <option value="Madurai">Madurai</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Estimated Affected People</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={peopleAffected}
                  onChange={e => setPeopleAffected(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Street Address / Area Landmark *</label>
              <input
                type="text"
                required
                placeholder="e.g. Near Saidapet Bridge, Grand Southern Trunk Road"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                5. Photographic Evidence (Optional)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-4 text-center cursor-pointer relative bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-medium text-slate-600 block">
                  Click to upload scene photo from mobile camera or gallery
                </span>
                <span className="text-[10px] text-slate-400">JPG, PNG up to 5MB</span>
              </div>

              {imagePreview && (
                <div className="mt-2 relative w-36 h-28 rounded-lg overflow-hidden border border-slate-200">
                  <img src={imagePreview} alt="Incident Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageUrl(''); }}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting to Command...' : 'Submit Incident Report'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
