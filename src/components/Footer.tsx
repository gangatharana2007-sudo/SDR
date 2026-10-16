import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PhoneCall, ShieldAlert, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16">
      {/* Official Emergency Contact Strip */}
      <div className="bg-slate-950 py-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{language === 'ta' ? 'அதிகாரப்பூர்வ அவசர உதவி எண்கள்' : 'Official Emergency Numbers'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <a href="tel:112" className="flex items-center gap-1.5 text-white bg-rose-600/30 hover:bg-rose-600 px-2.5 py-1 rounded transition-colors">
                <PhoneCall className="w-3 h-3 text-rose-400" />
                <span className="font-bold">112</span> (National Emergency)
              </a>
              <a href="tel:1070" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors">
                <span className="font-bold text-white">1070</span> (SDMA State Control)
              </a>
              <a href="tel:1077" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors">
                <span className="font-bold text-white">1077</span> (District Collectorate)
              </a>
              <a href="tel:108" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors">
                <span className="font-bold text-white">108</span> (Medical Ambulance)
              </a>
              <a href="tel:101" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors">
                <span className="font-bold text-white">101</span> (Fire & Rescue)
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center font-black text-white text-xs">
                SDR
              </div>
              <span className="text-base font-bold text-white tracking-tight">Smart Disaster Rescue</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              {language === 'ta'
                ? 'வெள்ளம், புயல் மற்றும் இயற்கை பேரிடர்களின் போது பொதுமக்கள், மீட்புக் குழுவினர், மருத்துவர்கள் மற்றும் அரசு அதிகாரிகளை ஒருங்கிணைக்கும் அவசர மீட்பு தளம்.'
                : 'Centralized emergency dispatch and civil relief coordination platform connecting affected residents, SDRF rescue teams, medical triage units, volunteers, and district authorities.'}
            </p>
            <div className="pt-2 text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-lg">
              <strong className="block font-semibold mb-0.5">
                {language === 'ta' ? 'சட்டரீதியான அவசர அறிவிப்பு:' : 'Statutory Operational Notice:'}
              </strong>
              {language === 'ta'
                ? 'இந்த தளம் அவசர மீட்புப் பணிகளை ஒருங்கிணைக்க உதவுகிறது. உடனடி உயிர் ஆபத்து நிலைகளில் அதிகாரப்பூர்வ 112 அவசர எண்ணையும் தொடர்பு கொள்ளவும்.'
                : 'This platform supports and coordinates multi-agency disaster operations. In imminent life-threatening peril, always dial national helpline 112 directly on your mobile device.'}
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {language === 'ta' ? 'அத்தியாவசிய சேவைகள்' : 'Essential Modules'}
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>• SOS Emergency Dispatch</li>
              <li>• Live Disaster GIS Incident Map</li>
              <li>• Verified Relief Camps & Stock</li>
              <li>• Paramedic & Hospital Directory</li>
              <li>• Disaster Safety & Evacuation Manual</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {language === 'ta' ? 'பாதுகாப்பு & கொள்கை' : 'Security & Governance'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict privacy protection: Personal location coordinates and vulnerable citizen details are exclusively accessible to verified incident commanders. No personal biometric or Aadhaar data collected.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 font-mono">
              Complies with NDMA & SDMA Disaster Management Framework
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
          <p>© 2026 Smart Disaster Rescue Platform. Built for Public Safety & Disaster Preparedness.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Server Time: <span className="font-mono text-slate-400">2026-10-16 03:51 IST</span></span>
            <span>·</span>
            <span>Zero-Data-Leakage Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
