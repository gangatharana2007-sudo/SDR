import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DisasterAlert } from '../types';
import { AlertOctagon, Volume2, ChevronDown, ChevronUp, BellRing } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  const { language, playEmergencySiren } = useLanguage();
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data.filter(a => a.isActive));
        }
      })
      .catch(() => {});
  }, []);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[activeAlertIndex] || alerts[0];
  const title = language === 'ta' && currentAlert.titleTa ? currentAlert.titleTa : currentAlert.title;
  const summary = language === 'ta' && currentAlert.summaryTa ? currentAlert.summaryTa : currentAlert.summary;
  const action = language === 'ta' && currentAlert.actionInstructionsTa ? currentAlert.actionInstructionsTa : currentAlert.actionInstructions;

  return (
    <div className="bg-rose-700 text-white border-b border-rose-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 bg-white text-rose-700 rounded-md shrink-0 animate-pulse">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider bg-rose-900/70 border border-rose-600 px-1.5 py-0.5 rounded shrink-0">
                {currentAlert.severity}
              </span>
              <p className="text-xs sm:text-sm font-semibold truncate">
                {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Siren Alert Sound Button */}
            <button
              onClick={playEmergencySiren}
              className="px-2 py-1 text-xs font-semibold bg-rose-900/60 hover:bg-rose-900 border border-rose-500 rounded flex items-center gap-1.5 transition-colors"
              title="Test Emergency Siren Chime"
            >
              <BellRing className="w-3.5 h-3.5 text-rose-300 animate-bounce" />
              <span className="hidden sm:inline">
                {language === 'ta' ? 'எச்சரிக்கை ஒலி' : 'Sound Siren'}
              </span>
            </button>

            {/* Toggle Details */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-rose-200 hover:text-white rounded hover:bg-rose-800/80 text-xs flex items-center gap-0.5"
            >
              <span className="hidden sm:inline text-xs font-medium">
                {expanded ? (language === 'ta' ? 'மறைக்க' : 'Hide') : (language === 'ta' ? 'விவரங்கள்' : 'Details')}
              </span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Details Pane */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-rose-600/70 text-xs space-y-2">
            <p className="leading-relaxed text-rose-50">{summary}</p>
            <div className="bg-rose-950/40 p-2.5 rounded border border-rose-500/40">
              <span className="font-bold text-amber-200 block mb-0.5">
                {language === 'ta' ? 'உடனடி பாதுகாப்பு வழிகாட்டல்:' : 'Immediate Action Required:'}
              </span>
              <p className="text-rose-100">{action}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-rose-200 pt-1">
              <span>Authority: <strong className="text-white">{currentAlert.issuingAuthority}</strong></span>
              <span>Districts: <strong className="text-white">{currentAlert.districtsAffected.join(', ')}</strong></span>
              <span>Valid Until: <span className="font-mono text-white">{new Date(currentAlert.expiresAt).toLocaleTimeString()}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
