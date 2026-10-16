import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, PhoneCall, Volume2, VolumeX, Eye, Menu, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSOS: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenSOS }) => {
  const { language, setLanguage, highContrast, setHighContrast, isSpeaking, stopSpeaking, speakText, t } = useLanguage();
  const { role, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'home', label: language === 'ta' ? 'முகப்பு' : 'Overview' },
    { id: 'map', label: language === 'ta' ? 'வரைபடம்' : 'Live Map' },
    { id: 'relief', label: language === 'ta' ? 'முகாம்கள்' : 'Relief Camps' },
    { id: 'medical', label: language === 'ta' ? 'மருத்துவம்' : 'Medical Aid' },
    { id: 'safety', label: language === 'ta' ? 'வழிகாட்டல்' : 'Safety Guide' },
  ];

  // Dynamic role-specific link
  if (role === 'rescue_team') {
    navLinks.splice(3, 0, { id: 'rescue', label: language === 'ta' ? 'மீட்புப் பணி' : 'Rescue Tasks' });
  } else if (role === 'volunteer') {
    navLinks.splice(3, 0, { id: 'volunteer', label: language === 'ta' ? 'தன்னார்வலர்' : 'Volunteers' });
  } else if (role === 'district_officer' || role === 'state_admin') {
    navLinks.splice(3, 0, { id: 'admin', label: language === 'ta' ? 'கட்டுப்பாட்டகம்' : 'Command' });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => handleNavClick('home')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <span className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            SDR
          </span>
          <span className="flex flex-col">
            <span className="text-slate-900 leading-tight">Smart Disaster Rescue</span>
            <span className="text-[10px] text-slate-500 font-normal">Tamil Nadu State Disaster Cell</span>
          </span>
        </button>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.slice(0, 5).map(link => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  isActive
                    ? 'text-rose-600 font-semibold border-b-2 border-rose-600'
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Compact Accessibility Tools */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center rounded-md border border-slate-200 p-0.5 text-xs font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'ta' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="தமிழ்"
            >
              தமிழ்
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`p-2 rounded-lg border text-xs transition-colors hidden sm:flex items-center gap-1 ${
              highContrast ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle High Contrast Display"
            aria-label="Toggle High Contrast"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* TTS Read Speaker */}
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speakText(
                  language === 'ta'
                    ? 'ஸ்மார்ட் பேரிடர் மீட்பு அமைப்பிற்கு வருக. உடனடி உதவிக்கு சிவப்பு நிற எஸ் ஓ எஸ் பொத்தானை அழுத்தவும்.'
                    : 'Welcome to Smart Disaster Rescue platform. For immediate help, press the red SOS Emergency button.'
                );
              }
            }}
            className={`p-2 rounded-lg border text-xs transition-colors hidden sm:flex items-center ${
              isSpeaking ? 'bg-rose-100 border-rose-300 text-rose-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={isSpeaking ? 'Stop voice reading' : 'Read screen aloud'}
            aria-label="Read screen aloud"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Primary Action Button: SOS Emergency */}
          <button
            onClick={onOpenSOS}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ring-2 ring-rose-500/20"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>{t('sosButton')}</span>
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Open Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium ${
                activeTab === link.id ? 'bg-rose-50 text-rose-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Universal Helpline:</span>
            <a href="tel:112" className="font-bold text-rose-600 flex items-center gap-1">
              <PhoneCall className="w-3 h-3" /> Dial 112
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
