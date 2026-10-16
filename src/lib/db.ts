import fs from 'fs';
import path from 'path';
import {
  User,
  SOSRequest,
  DisasterReport,
  ReliefCentre,
  MedicalFacility,
  VolunteerProfile,
  VolunteerTask,
  DisasterAlert,
  AuditLog,
  SOSStatus,
  ReportVerificationStatus,
  PriorityLevel,
} from '../types';
import {
  SEED_USERS,
  SEED_ALERTS,
  SEED_SOS,
  SEED_REPORTS,
  SEED_RELIEF_CENTRES,
  SEED_MEDICAL_FACILITIES,
  SEED_VOLUNTEERS,
  SEED_VOLUNTEER_TASKS,
  SEED_AUDIT_LOGS,
} from '../data/seedData';

interface DatabaseSchema {
  users: User[];
  alerts: DisasterAlert[];
  sosRequests: SOSRequest[];
  reports: DisasterReport[];
  reliefCentres: ReliefCentre[];
  medicalFacilities: MedicalFacility[];
  volunteers: VolunteerProfile[];
  volunteerTasks: VolunteerTask[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [...SEED_USERS],
          alerts: parsed.alerts || [...SEED_ALERTS],
          sosRequests: parsed.sosRequests || [...SEED_SOS],
          reports: parsed.reports || [...SEED_REPORTS],
          reliefCentres: parsed.reliefCentres || [...SEED_RELIEF_CENTRES],
          medicalFacilities: parsed.medicalFacilities || [...SEED_MEDICAL_FACILITIES],
          volunteers: parsed.volunteers || [...SEED_VOLUNTEERS],
          volunteerTasks: parsed.volunteerTasks || [...SEED_VOLUNTEER_TASKS],
          auditLogs: parsed.auditLogs || [...SEED_AUDIT_LOGS],
        };
      }
    } catch (e) {
      console.warn('Could not read existing db.json, initializing from seed:', e);
    }

    const initial: DatabaseSchema = {
      users: [...SEED_USERS],
      alerts: [...SEED_ALERTS],
      sosRequests: [...SEED_SOS],
      reports: [...SEED_REPORTS],
      reliefCentres: [...SEED_RELIEF_CENTRES],
      medicalFacilities: [...SEED_MEDICAL_FACILITIES],
      volunteers: [...SEED_VOLUNTEERS],
      volunteerTasks: [...SEED_VOLUNTEER_TASKS],
      auditLogs: [...SEED_AUDIT_LOGS],
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // --- Audit Logs ---
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    this.saveData();
    return entry;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByPhone(phone: string): User | undefined {
    return this.data.users.find(u => u.phone === phone);
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  public updateUserApproval(userId: string, isApproved: boolean, adminUser: User): User | null {
    const u = this.getUserById(userId);
    if (!u) return null;
    u.isApproved = isApproved;
    this.addAuditLog({
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: isApproved ? 'APPROVE_USER' : 'REVOKE_USER',
      targetType: 'user',
      targetId: u.id,
      details: `${isApproved ? 'Approved' : 'Revoked approval for'} user ${u.name} (${u.role})`,
    });
    this.saveData();
    return u;
  }

  // --- SOS Requests ---
  public getSOSRequests(): SOSRequest[] {
    return this.data.sosRequests;
  }

  public getSOSById(id: string): SOSRequest | undefined {
    return this.data.sosRequests.find(s => s.id === id);
  }

  public createSOSRequest(req: Omit<SOSRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): { request: SOSRequest; isDuplicateWarning?: boolean } {
    // Duplicate prevention: check if same phone or near-identical coordinates submitted within 3 minutes
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const existingRecent = this.data.sosRequests.find(
      s => s.citizenPhone === req.citizenPhone && s.createdAt > threeMinAgo && s.status !== 'RESOLVED' && s.status !== 'CANCELLED'
    );

    const newId = `SOS-${new Date().getFullYear()}-${req.location.district ? req.location.district.slice(0, 3).toUpperCase() : 'DIS'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSos: SOSRequest = {
      ...req,
      id: newId,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingRecent) {
      newSos.statusNotes = `Note: User submitted earlier emergency request #${existingRecent.id} within 3 minutes.`;
    }

    this.data.sosRequests.unshift(newSos);
    this.saveData();

    return { request: newSos, isDuplicateWarning: Boolean(existingRecent) };
  }

  public updateSOSStatus(
    id: string,
    status: SOSStatus,
    actor: { id: string; name: string; role: any },
    notes?: string,
    declineReason?: string
  ): SOSRequest | null {
    const item = this.getSOSById(id);
    if (!item) return null;

    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (notes) item.statusNotes = notes;
    if (declineReason) item.declineReason = declineReason;
    if (status === 'RESOLVED') item.resolvedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: `SOS_STATUS_${status}`,
      targetType: 'sos_request',
      targetId: item.id,
      details: `SOS #${item.id} status changed to ${status}. Notes: ${notes || 'N/A'}${declineReason ? ` Reason: ${declineReason}` : ''}`,
    });

    this.saveData();
    return item;
  }

  public assignSOSTeam(
    id: string,
    teamId: string,
    teamName: string,
    teamPhone: string,
    actor: { id: string; name: string; role: any }
  ): SOSRequest | null {
    const item = this.getSOSById(id);
    if (!item) return null;

    item.assignedTeamId = teamId;
    item.assignedTeamName = teamName;
    item.assignedTeamPhone = teamPhone;
    item.status = 'ASSIGNED';
    item.updatedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ASSIGN_RESCUE_TEAM',
      targetType: 'sos_request',
      targetId: item.id,
      details: `Assigned rescue team ${teamName} (${teamPhone}) to SOS #${item.id}`,
    });

    this.saveData();
    return item;
  }

  // --- Disaster Reports ---
  public getReports(): DisasterReport[] {
    return this.data.reports;
  }

  public getReportById(id: string): DisasterReport | undefined {
    return this.data.reports.find(r => r.id === id);
  }

  public createReport(rep: Omit<DisasterReport, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus'>): DisasterReport {
    const newId = `REP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newRep: DisasterReport = {
      ...rep,
      id: newId,
      verificationStatus: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.reports.unshift(newRep);
    this.saveData();
    return newRep;
  }

  public verifyReport(
    id: string,
    status: ReportVerificationStatus,
    notes: string,
    priority: PriorityLevel,
    actor: { id: string; name: string; role: any }
  ): DisasterReport | null {
    const rep = this.getReportById(id);
    if (!rep) return null;

    rep.verificationStatus = status;
    rep.verificationNotes = notes;
    rep.priority = priority;
    rep.verifiedBy = actor.name;
    rep.updatedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: `VERIFY_REPORT_${status}`,
      targetType: 'disaster_report',
      targetId: rep.id,
      details: `Report #${rep.id} marked ${status} with priority ${priority}. ${notes}`,
    });

    this.saveData();
    return rep;
  }

  // --- Relief Centres & Inventory ---
  public getReliefCentres(): ReliefCentre[] {
    return this.data.reliefCentres;
  }

  public getReliefCentreById(id: string): ReliefCentre | undefined {
    return this.data.reliefCentres.find(r => r.id === id);
  }

  public updateReliefInventory(
    id: string,
    inventory: Partial<ReliefCentre['inventory']>,
    occupancyDelta: number,
    actor: { id: string; name: string; role: any }
  ): ReliefCentre | null {
    const centre = this.getReliefCentreById(id);
    if (!centre) return null;

    centre.inventory = {
      ...centre.inventory,
      ...inventory,
    };
    if (occupancyDelta !== 0) {
      centre.currentOccupancy = Math.max(0, Math.min(centre.totalCapacity, centre.currentOccupancy + occupancyDelta));
    }
    centre.lastInventoryUpdate = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE_INVENTORY',
      targetType: 'relief_centre',
      targetId: centre.id,
      details: `Updated inventory for ${centre.name}. Occupancy: ${centre.currentOccupancy}/${centre.totalCapacity}`,
    });

    this.saveData();
    return centre;
  }

  // --- Medical Facilities ---
  public getMedicalFacilities(): MedicalFacility[] {
    return this.data.medicalFacilities;
  }

  // --- Volunteer Management ---
  public getVolunteers(): VolunteerProfile[] {
    return this.data.volunteers;
  }

  public getVolunteerTasks(): VolunteerTask[] {
    return this.data.volunteerTasks;
  }

  public assignVolunteerToTask(taskId: string, volunteerId: string): VolunteerTask | null {
    const task = this.data.volunteerTasks.find(t => t.id === taskId);
    if (!task) return null;
    if (!task.assignedVolunteerIds.includes(volunteerId)) {
      task.assignedVolunteerIds.push(volunteerId);
      if (task.assignedVolunteerIds.length >= task.volunteersNeeded) {
        task.status = 'IN_PROGRESS';
      }
      this.saveData();
    }
    return task;
  }

  // --- Alerts ---
  public getAlerts(): DisasterAlert[] {
    return this.data.alerts;
  }

  public createAlert(alert: Omit<DisasterAlert, 'id' | 'issuedAt' | 'isActive'>, actor: { id: string; name: string; role: any }): DisasterAlert {
    const newAlert: DisasterAlert = {
      ...alert,
      id: `alt-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      issuedAt: new Date().toISOString(),
      isActive: true,
    };
    this.data.alerts.unshift(newAlert);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'BROADCAST_ALERT',
      targetType: 'alert',
      targetId: newAlert.id,
      details: `Broadcasted ${newAlert.severity} alert: "${newAlert.title}" across districts: ${newAlert.districtsAffected.join(', ')}`,
    });

    this.saveData();
    return newAlert;
  }
}

export const db = new DatabaseStore();
