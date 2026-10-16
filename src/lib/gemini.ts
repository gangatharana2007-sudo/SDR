import { GoogleGenAI } from '@google/genai';
import { DisasterCategory, PriorityLevel } from '../types';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface AIAnalysisResult {
  source: 'gemini_ai' | 'rule_based_fallback';
  category: DisasterCategory;
  priority: PriorityLevel;
  summary: string;
  summaryTa: string;
  urgentNeedsDetected: string[];
  vulnerableGroupsDetected: string[];
  safetyGuidanceEn: string;
  safetyGuidanceTa: string;
  isDuplicateSuspect: boolean;
  duplicateNotes?: string;
  confidenceScore: number;
}

// Configurable documented rules for transparent classification
export function analyzeWithRules(
  description: string,
  categoryInput?: DisasterCategory,
  hasMedical?: boolean,
  hasChildren?: boolean,
  hasElderly?: boolean,
  hasDisability?: boolean,
  peopleCount?: number,
  existingReports: Array<{ id: string; description: string; category: string; location?: { address?: string } }> = []
): AIAnalysisResult {
  const lower = (description || '').toLowerCase();
  
  // Category inference
  let category: DisasterCategory = categoryInput || 'other';
  if (lower.includes('flood') || lower.includes('water') || lower.includes('submerged') || lower.includes('வெள்ளம்')) {
    category = 'flood';
  } else if (lower.includes('cyclone') || lower.includes('wind') || lower.includes('storm') || lower.includes('gale') || lower.includes('புயல்')) {
    category = 'cyclone';
  } else if (lower.includes('collapse') || lower.includes('rubble') || lower.includes('trapped') || lower.includes('இடிந்து')) {
    category = 'building_collapse';
  } else if (lower.includes('landslide') || lower.includes('mudslide') || lower.includes('நிலச்சரிவு')) {
    category = 'landslide';
  } else if (lower.includes('fire') || lower.includes('smoke') || lower.includes('தீ')) {
    category = 'fire';
  } else if (lower.includes('wire') || lower.includes('electric') || lower.includes('power') || lower.includes('மின்சாரம்')) {
    category = 'power_outage';
  } else if (lower.includes('road') || lower.includes('tree') || lower.includes('blocked') || lower.includes('சாலை')) {
    category = 'blocked_road';
  }

  // Priority detection: objective threat-to-life assessment
  let priority: PriorityLevel = 'medium';
  const urgentNeeds: string[] = [];
  const vulnerableGroups: string[] = [];

  if (hasMedical || lower.includes('heart') || lower.includes('bleeding') || lower.includes('oxygen') || lower.includes('unconscious') || lower.includes('trapped underwater')) {
    priority = 'critical';
    urgentNeeds.push('Immediate Emergency Medical Support');
  } else if (category === 'building_collapse' || (category === 'flood' && lower.includes('rising') && (peopleCount || 0) > 4)) {
    priority = 'critical';
    urgentNeeds.push('Search and Rescue Evacuation Boat');
  } else if (category === 'fire' || category === 'cyclone' || category === 'landslide') {
    priority = 'high';
    urgentNeeds.push('Hazard Containment and Safe Shelter Evacuation');
  } else if (hasChildren || hasElderly || hasDisability) {
    priority = 'high';
  }

  if (hasChildren) vulnerableGroups.push('Infants / Children');
  if (hasElderly) vulnerableGroups.push('Senior Citizens');
  if (hasDisability) vulnerableGroups.push('Persons with Disabilities');

  // Check potential duplicate text similarity
  let isDuplicate = false;
  let duplicateNotes: string | undefined;
  for (const rep of existingReports) {
    const repLower = (rep.description || '').toLowerCase();
    const commonWords = lower.split(/\s+/).filter(w => w.length > 4 && repLower.includes(w));
    if (commonWords.length >= 4) {
      isDuplicate = true;
      duplicateNotes = `Possible overlap detected with Incident ${rep.id} (${commonWords.slice(0, 3).join(', ')})`;
      break;
    }
  }

  // Safety advice
  let safetyEn = 'Move to higher ground if floodwaters are rising. Disconnect electrical switches and call 112 for direct dispatch.';
  let safetyTa = 'வெள்ள நீர் உயர்ந்தால் உயரமான இடத்திற்குச் செல்லவும். மின் இணைப்பை அணைக்கவும். 112-ஐ அழைக்கவும்.';

  if (category === 'cyclone') {
    safetyEn = 'Stay indoors away from glass windows. Keep emergency lamp and mobile phone fully charged. Avoid touching fallen power lines.';
    safetyTa = 'கண்ணாடி ஜன்னல்களை விட்டு விலகி பாதுகாப்பான அறையில் இருக்கவும். அறுந்து கிடக்கும் மின்கம்பிகளைத் தொடாதீர்கள்.';
  } else if (category === 'building_collapse') {
    safetyEn = 'Cover your head and mouth. Tap on pipes or metal to signal rescuers; do not shout continuously to conserve oxygen.';
    safetyTa = 'தலையையும் வாயையும் மூடிக்கொள்ளவும். மீட்புக் குழுவிற்கு சமிக்ஞை செய்ய உலோகக் குழாய்களைத் தட்டவும்.';
  }

  return {
    source: 'rule_based_fallback',
    category,
    priority,
    summary: `${category.toUpperCase().replace('_', ' ')} incident reported. ${peopleCount ? `${peopleCount} people affected.` : ''} ${urgentNeeds.length ? `Urgent: ${urgentNeeds.join(', ')}.` : ''}`,
    summaryTa: `${category} அவசர அறிக்கை. ${peopleCount ? `${peopleCount} பேர் பாதிக்கப்பட்டுள்ளனர்.` : ''}`,
    urgentNeedsDetected: urgentNeeds,
    vulnerableGroupsDetected: vulnerableGroups,
    safetyGuidanceEn: safetyEn,
    safetyGuidanceTa: safetyTa,
    isDuplicateSuspect: isDuplicate,
    duplicateNotes,
    confidenceScore: 0.88,
  };
}

export async function analyzeIncidentWithAI(
  description: string,
  categoryInput?: DisasterCategory,
  hasMedical?: boolean,
  hasChildren?: boolean,
  hasElderly?: boolean,
  hasDisability?: boolean,
  peopleCount?: number,
  existingReports: Array<{ id: string; description: string; category: string; location?: { address?: string } }> = []
): Promise<AIAnalysisResult> {
  const client = getGenAI();
  if (!client) {
    return analyzeWithRules(description, categoryInput, hasMedical, hasChildren, hasElderly, hasDisability, peopleCount, existingReports);
  }

  try {
    const prompt = `You are an AI assistant for a State Disaster Management Authority emergency rescue system.
Analyze the following emergency disaster incident report:

Incident Description: "${description}"
User Selected Category: "${categoryInput || 'Not specified'}"
Medical Emergency Flagged: ${hasMedical ? 'Yes' : 'No'}
Children Present: ${hasChildren ? 'Yes' : 'No'}
Elderly Present: ${hasElderly ? 'Yes' : 'No'}
Persons with Disability: ${hasDisability ? 'Yes' : 'No'}
Number of People Affected: ${peopleCount || 1}

Recent reports for duplicate comparison:
${existingReports.slice(0, 5).map(r => `- ID: ${r.id}, Category: ${r.category}, Summary: ${r.description.slice(0, 100)}`).join('\n')}

Instructions:
1. Classify the incident into one category: flood, cyclone, heavy_rainfall, landslide, fire, building_collapse, blocked_road, power_outage, medical_emergency, missing_person, other.
2. Suggest a priority level based on immediate life-threat risk: 'critical', 'high', 'medium', or 'low'. (Never downgrade assistance based on personal characteristics).
3. Provide a concise 1-2 sentence executive summary in English.
4. Provide the same 1-2 sentence executive summary in Tamil.
5. Provide actionable immediate safety guidance in English and Tamil.
6. Check if it resembles any of the recent reports.
Return ONLY valid JSON matching this structure:
{
  "category": "flood",
  "priority": "critical",
  "summary": "...",
  "summaryTa": "...",
  "urgentNeedsDetected": ["..."],
  "vulnerableGroupsDetected": ["..."],
  "safetyGuidanceEn": "...",
  "safetyGuidanceTa": "...",
  "isDuplicateSuspect": false,
  "duplicateNotes": "",
  "confidenceScore": 0.95
}`;

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    if (!text) {
      return analyzeWithRules(description, categoryInput, hasMedical, hasChildren, hasElderly, hasDisability, peopleCount, existingReports);
    }

    const parsed = JSON.parse(text);
    return {
      source: 'gemini_ai',
      category: parsed.category || categoryInput || 'other',
      priority: parsed.priority || 'medium',
      summary: parsed.summary || 'Incident processed by AI assistant.',
      summaryTa: parsed.summaryTa || 'அவசர அறிக்கை கணிக்கப்பட்டது.',
      urgentNeedsDetected: parsed.urgentNeedsDetected || [],
      vulnerableGroupsDetected: parsed.vulnerableGroupsDetected || [],
      safetyGuidanceEn: parsed.safetyGuidanceEn || 'Stay safe and follow official instructions.',
      safetyGuidanceTa: parsed.safetyGuidanceTa || 'பாதுகாப்பாக இருக்கவும், அதிகாரிகளின் வழிகாட்டுதலைப் பின்பற்றவும்.',
      isDuplicateSuspect: Boolean(parsed.isDuplicateSuspect),
      duplicateNotes: parsed.duplicateNotes || undefined,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.92,
    };
  } catch (err) {
    console.warn('Gemini API call fell back to rule-based analysis:', err);
    return analyzeWithRules(description, categoryInput, hasMedical, hasChildren, hasElderly, hasDisability, peopleCount, existingReports);
  }
}
