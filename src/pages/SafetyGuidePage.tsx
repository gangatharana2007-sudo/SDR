import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Volume2, VolumeX, ShieldCheck, AlertTriangle, Droplets, Wind, Flame, Zap, PhoneCall } from 'lucide-react';

export const SafetyGuidePage: React.FC = () => {
  const { language, speakText, isSpeaking, stopSpeaking } = useLanguage();

  const guides = [
    {
      id: 'flood',
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      titleEn: 'Floods & Inundation Safety Protocol',
      titleTa: 'வெள்ளப்பெருக்கு பாதுகாப்பு விதிமுறைகள்',
      rulesEn: [
        'Move immediately to designated high-ground concrete shelters or rooftop if water enters lower floors.',
        'Turn off main electricity switches and gas cylinders before evacuating.',
        'Never walk, swim, or drive through moving water. 6 inches of swift water can knock you down.',
        'Keep drinking water stored in sealed plastic cans above flood level.',
        'Beware of displaced snakes, reptiles, and submerged sharp debris.',
      ],
      rulesTa: [
        'தண்ணீர் வீட்டிற்குள் புகுந்தால் உடனடியாக மேடான கான்கிரீட் கட்டிடங்கள் அல்லது மொட்டை மாடிக்குச் செல்லவும்.',
        'வெளியேறும் முன் பிரதான மின் இணைப்பு (Main Switch) மற்றும் எரிவாயு சிலிண்டரை அணைக்கவும்.',
        'ஓடும் தண்ணீரில் நடக்கவோ வாகனங்களை இயக்கவோ கூடாது. 6 அங்குல வேகமான தண்ணீர் மனிதனை சாய்க்கும்.',
        'குடிநீரை மூடிய பிளாஸ்டிக் பாட்டில்களில் உயரமான இடத்தில் வைக்கவும்.',
        'தண்ணீரில் அடித்து வரப்படும் பாம்புகள் மற்றும் விஷப் பூச்சிகள் குறித்து விழிப்புடன் இருக்கவும்.',
      ],
    },
    {
      id: 'cyclone',
      icon: Wind,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      titleEn: 'Cyclone & Extreme Gale Wind Survival',
      titleTa: 'புயல் மற்றும் சூறாவளி காற்று முன்னெச்சரிக்கை',
      rulesEn: [
        'Stay indoors in the strongest central room away from glass windows and loose roof sheets.',
        'Keep emergency battery lamps, charged powerbanks, and essential medicines sealed in polythene bags.',
        'Do not go outside during the "eye of the storm" (temporary calm); severe reverse winds will resume.',
        'Stay clear of old banyan trees, electric poles, and advertising hoardings.',
      ],
      rulesTa: [
        'கண்ணாடி ஜன்னல்கள் மற்றும் ஆஸ்பெஸ்டாஸ் கூரைகளை விட்டு விலகி, வீட்டின் வலுவான உட்புற அறையில் இருக்கவும்.',
        'அவசர விளக்குகள், பவர்பேங்க் மற்றும் அத்தியாவசிய மருந்துகளை பிளாஸ்டிக் பைகளில் மூடி வைக்கவும்.',
        'புயலின் மையம் (Eye of Storm) கடக்கும் போது ஏற்படும் தற்காலிக அமைதியைக் கண்டு வெளியே வர வேண்டாம்.',
        'பழைய மரங்கள், மின்கம்பங்கள் மற்றும் விளம்பர பலகைகள் அருகில் நிற்க வேண்டாம்.',
      ],
    },
    {
      id: 'electric',
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      titleEn: 'Electrical Safety in Waterlogged Areas',
      titleTa: 'நீர் தேங்கிய பகுதிகளில் மின்சார பாதுகாப்பு',
      rulesEn: [
        'Assume all fallen electrical cables, lampposts, and flooded junction boxes are LIVE and lethal.',
        'Maintain a minimum distance of at least 10 meters (33 feet) from dangling or severed wires.',
        'Do not touch electrical appliances, plugs, or switches with wet hands or wet feet.',
        'Report snapped wires immediately to TANGEDCO emergency / 112.',
      ],
      rulesTa: [
        'அறுந்து கிடக்கும் அனைத்து மின்கம்பிகளும் மின்சாரம் பாயக்கூடியவை என கருதி விலகி இருக்கவும்.',
        'அறுந்த மின்கம்பிகளிலிருந்து குறைந்தது 10 மீட்டர் (33 அடி) தூரம் தள்ளி இருக்கவும்.',
        'ஈரமான கைகளுடனோ அல்லது ஈரமான தரையில் நின்றுகொண்டோ மின்விசிறி, சுவிட்சுகளை இயக்க வேண்டாம்.',
        'மின்கம்பி அறுந்து கிடந்தால் உடனடியாக 112 அல்லது மின்வாரியத்திற்கு தகவல் தெரிவிக்கவும்.',
      ],
    },
    {
      id: 'collapse',
      icon: Flame,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      titleEn: 'Building Structural Cracks & Trapped Protocols',
      titleTa: 'கட்டிட இடிபாடுகள் மற்றும் சிக்கியவர்களுக்கான வழிகாட்டல்',
      rulesEn: [
        'If trapped under debris: Protect your mouth and nose with cloth or clothing to avoid dust suffocation.',
        'Make rhythmic tapping sounds on metal pipes or walls so acoustic search sensors can detect you.',
        'Shout only when you hear rescuers nearby to conserve oxygen and stamina.',
        'Do not light matches or lighters due to possible ruptured cooking gas lines.',
      ],
      rulesTa: [
        'இடிபாடுகளில் சிக்கினால்: புழுதி மூச்சுக்குழாய்க்குள் செல்லாமல் இருக்க வாயையும் மூக்கையும் துணியால் மூடவும்.',
        'மீட்புக் கருவிகள் கண்டறிய ஏதுவாக உலோகக் குழாய்கள் அல்லது சுவர்களில் தட்டி சத்தம் எழுப்பவும்.',
        'ஆக்ஸிஜனை சேமிக்க தொடர்ந்து கத்தாமல், மீட்புக் குரல் கேட்கும் போது மட்டும் சத்தம் எழுப்பவும்.',
        'எரிவாயு கசிவு இருக்கக்கூடும் என்பதால் தீக்குச்சிகள் அல்லது லைட்டர்களைப் பயன்படுத்த வேண்டாம்.',
      ],
    },
  ];

  const handleReadSection = (title: string, rules: string[]) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const fullText = `${title}. ${rules.join('. ')}`;
      speakText(fullText);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-600 text-white uppercase">
              Official Safety Manual
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-300">NDMA & TNSDMA Approved</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'ta' ? 'பேரிடர் உயிர் பாதுகாப்பு வழிகாட்டி' : 'Disaster Life Safety & Survival Manual'}
          </h1>
          <p className="text-xs text-slate-400">
            Plain language actionable instructions reviewed against official disaster management guidelines
          </p>
        </div>

        <a
          href="tel:112"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call 112 (Emergency)</span>
        </a>
      </div>

      {/* Guide Cards */}
      <div className="space-y-4">
        {guides.map(g => {
          const title = language === 'ta' ? g.titleTa : g.titleEn;
          const rules = language === 'ta' ? g.rulesTa : g.rulesEn;
          const Icon = g.icon;

          return (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${g.bgColor} ${g.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">
                    {title}
                  </h3>
                </div>

                <button
                  onClick={() => handleReadSection(title, rules)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                  title="Read aloud via Speech Synthesis"
                >
                  <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>{language === 'ta' ? 'குரலில் கேள்' : 'Listen'}</span>
                </button>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
