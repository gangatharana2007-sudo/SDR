import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { WifiOff, Wifi, PhoneCall } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDismiss, setShowDismiss] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowDismiss(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowDismiss(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showDismiss) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl p-3 shadow-lg border text-xs transition-all ${
        !isOnline
          ? 'bg-amber-950/95 border-amber-600 text-amber-100 backdrop-blur-md'
          : 'bg-emerald-950/95 border-emerald-600 text-emerald-100 backdrop-blur-md'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-black/20 shrink-0">
          {!isOnline ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-white">
            {!isOnline
              ? language === 'ta'
                ? 'இணைய இணைப்பு இல்லை (ஆஃப்லைன் பயன்முறை)'
                : 'Offline Mode Detected'
              : language === 'ta'
              ? 'இணைய இணைப்பு மீட்கப்பட்டது'
              : 'Network Connection Restored'}
          </p>
          <p className="text-[11px] text-amber-200/90 leading-tight">
            {!isOnline
              ? language === 'ta'
                ? 'சேமிக்கப்பட்ட வழிகாட்டல்கள் காட்டப்படுகின்றன. உடனடி உதவிக்கு 112 ஐ டயல் செய்யவும்.'
                : 'Using cached emergency data. If internet is down, immediately call 112 for direct voice dispatch.'
              : language === 'ta'
              ? 'அனைத்து நேரலை தரவுகளும் புதுப்பிக்கப்படுகின்றன.'
              : 'Syncing emergency updates with command center.'}
          </p>
          {!isOnline && (
            <a
              href="tel:112"
              className="inline-flex items-center gap-1 font-bold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded mt-1 shadow-sm"
            >
              <PhoneCall className="w-3 h-3" /> Call 112 Directly
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
