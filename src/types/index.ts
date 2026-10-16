export type UserRole =
  | 'citizen'
  | 'rescue_team'
  | 'medical_team'
  | 'volunteer'
  | 'relief_manager'
  | 'district_officer'
  | 'state_admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  district: string;
  email?: string;
  isApproved: boolean; // required for official roles
  badgeNumber?: string;
  organization?: string;
  createdAt: string;
}

export type DisasterCategory =
  | 'flood'
  | 'cyclone'
  | 'heavy_rainfall'
  | 'landslide'
  | 'fire'
  | 'building_collapse'
  | 'blocked_road'
  | 'power_outage'
  | 'medical_emergency'
  | 'missing_person'
  | 'other';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'pending';

export type SOSStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'TEAM_DISPATCHED'
  | 'ASSISTANCE_PROVIDED'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'DUPLICATE';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
  landmark?: string;
}

export interface SOSRequest {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  disasterType: DisasterCategory;
  location: LocationCoordinates;
  peopleCount: number;
  hasUrgentMedical: boolean;
  hasChildren: boolean;
  hasElderly: boolean;
  hasDisability: boolean;
  notes?: string;
  status: SOSStatus;
  priority: PriorityLevel;
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedTeamPhone?: string;
  statusNotes?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  aiPrioritySuggestion?: PriorityLevel;
  aiSummary?: string;
}

export type ReportVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'FLAGGED_DUPLICATE' | 'REJECTED';

export interface DisasterReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterPhone?: string;
  category: DisasterCategory;
  title: string;
  description: string;
  location: LocationCoordinates;
  incidentTime: string;
  imageUrl?: string;
  peopleAffectedCount?: number;
  verificationStatus: ReportVerificationStatus;
  verificationNotes?: string;
  priority: PriorityLevel;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  aiClassification?: {
    category: DisasterCategory;
    priority: PriorityLevel;
    confidence: number;
    summary: string;
    isDuplicateCandidate?: boolean;
    duplicateReferenceId?: string;
  };
}

export interface ReliefInventory {
  cleanWaterLiters: number;
  foodRationPacks: number;
  firstAidKits: number;
  blankets: number;
  orsPackets: number;
  sanitationKits: number;
}

export interface ReliefCentre {
  id: string;
  name: string;
  district: string;
  address: string;
  location: LocationCoordinates;
  contactPerson: string;
  phone: string;
  totalCapacity: number;
  currentOccupancy: number;
  isOpen: boolean;
  hasMedicalAid: boolean;
  hasDrinkingWater: boolean;
  hasFood: boolean;
  hasAccessibleToilets: boolean;
  inventory: ReliefInventory;
  lastInventoryUpdate: string;
  verifiedByAdmin: boolean;
}

export interface MedicalFacility {
  id: string;
  name: string;
  type: 'government_hospital' | 'primary_health_center' | 'mobile_triage_unit' | 'private_partner';
  district: string;
  address: string;
  location: LocationCoordinates;
  emergencyPhone: string;
  ambulanceAvailableCount: number;
  hasTraumaCare: boolean;
  hasICU: boolean;
  operationalStatus: 'operational' | 'strained' | 'inaccessible';
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  district: string;
  skills: string[];
  languages: string[];
  isAvailable: boolean;
  isVerified: boolean;
  completedTasksCount: number;
  emergencyContact: string;
}

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  district: string;
  location: LocationCoordinates;
  requiredSkills: string[];
  volunteersNeeded: number;
  assignedVolunteerIds: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  urgency: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface DisasterAlert {
  id: string;
  title: string;
  titleTa?: string;
  severity: 'WARNING' | 'CRITICAL' | 'WATCH' | 'ADVISORY';
  category: DisasterCategory;
  districtsAffected: string[];
  issuingAuthority: string;
  issuedAt: string;
  expiresAt: string;
  summary: string;
  summaryTa?: string;
  actionInstructions: string;
  actionInstructionsTa?: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'sos_request' | 'disaster_report' | 'relief_centre' | 'user' | 'alert' | 'volunteer_task';
  targetId: string;
  details: string;
}
