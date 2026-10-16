import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { Shield, UserCheck, AlertTriangle } from 'lucide-react';

const ROLES: { role: UserRole; labelEn: string; labelTa: string }[] = [
  { role: 'citizen', labelEn: 'Citizen', labelTa: 'குடிமகன்' },
  { role: 'rescue_team', labelEn: 'Rescue Team', labelTa: 'மீட்புக் குழு' },
  { role: 'medical_team', labelEn: 'Medical Unit', labelTa: 'மருத்துவக் குழு' },
  { role: 'volunteer', labelEn: 'Volunteer', labelTa: 'தன்னார்வலர்' },
  { role: 'relief_manager', labelEn: 'Relief Manager', labelTa: 'முகாம் மேலாளர்' },
  { role: 'district_officer', labelEn: 'District Officer', labelTa: 'மாவட்ட அதிகாரி' },
  { role: 'state_admin', labelEn: 'State Admin', labelTa: 'மாநில நிர்வாகி' },
];

export const RoleSwitcherBar: React.FC = () => {
  const { role, switchRole, currentUser } = useAuth();
  const { language } = useLanguage();

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="font-semibold text-white tracking-wide">
            {language === 'ta' ? 'பங்கு நிலை சோதனை:' : 'Operational Role:'}
          </span>
          <span className="text-rose-300 font-mono font-medium bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
            {currentUser?.name} · {role.replace('_', ' ').toUpperCase()}
          </span>
          {!currentUser?.isApproved && (
            <span className="text-amber-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" /> (Pending Verification)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-slate-400 mr-1 hidden sm:inline">
            {language === 'ta' ? 'மாற்றுக:' : 'Switch:'}
          </span>
          {ROLES.map(r => {
            const isActive = role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => switchRole(r.role)}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={`Switch active test session to ${r.labelEn}`}
              >
                {language === 'ta' ? r.labelTa : r.labelEn}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
