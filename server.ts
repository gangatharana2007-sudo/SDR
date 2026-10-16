import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { db } from './src/lib/db';
import { analyzeIncidentWithAI } from './src/lib/gemini';
import { UserRole } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Helper for simple auth extraction (Bearer userId or x-user-id header)
function getRequester(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    return db.getUserById(userId) || null;
  }
  return null;
}

// --- Health ---
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    service: 'Smart Disaster Rescue Emergency API',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// --- Auth Endpoints ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { phone, password } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Find user by phone
  const user = db.getUserByPhone(phone.trim());
  if (!user) {
    return res.status(404).json({ error: 'Account not found. Please register or verify your phone number.' });
  }

  // Official roles check approval
  if (['rescue_team', 'medical_team', 'relief_manager', 'district_officer', 'state_admin'].includes(user.role) && !user.isApproved) {
    return res.status(403).json({
      error: 'Your official responder account is awaiting authorized administrator approval.',
      isPendingApproval: true,
      user,
    });
  }

  res.json({ success: true, user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, phone, role, district, email, badgeNumber, organization } = req.body;
  if (!name || !phone || !role || !district) {
    return res.status(400).json({ error: 'Name, phone, role, and district are mandatory.' });
  }

  const existing = db.getUserByPhone(phone.trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this phone number already exists.' });
  }

  const requiresApproval = ['rescue_team', 'medical_team', 'relief_manager', 'district_officer', 'state_admin'].includes(role);

  const newUser = db.createUser({
    name: name.trim(),
    phone: phone.trim(),
    role: role as UserRole,
    district: district.trim(),
    email: email?.trim(),
    badgeNumber: badgeNumber?.trim(),
    organization: organization?.trim(),
    isApproved: !requiresApproval,
  });

  db.addAuditLog({
    actorId: newUser.id,
    actorName: newUser.name,
    actorRole: newUser.role,
    action: 'USER_REGISTERED',
    targetType: 'user',
    targetId: newUser.id,
    details: `Registered new account ${newUser.name} with role ${newUser.role} (Approved: ${newUser.isApproved})`,
  });

  res.status(201).json({
    success: true,
    user: newUser,
    message: requiresApproval
      ? 'Account submitted for verification by District / State Disaster Administrator.'
      : 'Account created successfully.',
  });
});

app.get('/api/auth/users', (req: Request, res: Response) => {
  const users = db.getUsers();
  res.json(users);
});

app.post('/api/auth/approve', (req: Request, res: Response) => {
  const { targetUserId, isApproved } = req.body;
  const admin = getRequester(req);
  if (!admin || !['state_admin', 'district_officer'].includes(admin.role)) {
    return res.status(403).json({ error: 'Unauthorized: Admin privileges required.' });
  }

  const updated = db.updateUserApproval(targetUserId, Boolean(isApproved), admin);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user: updated });
});

// --- SOS Endpoints ---
app.get('/api/sos', (req: Request, res: Response) => {
  const { status, district, priority, citizenId } = req.query;
  let list = db.getSOSRequests();

  if (status) list = list.filter(s => s.status === status);
  if (district) list = list.filter(s => s.location.district?.toLowerCase() === (district as string).toLowerCase());
  if (priority) list = list.filter(s => s.priority === priority);
  if (citizenId) list = list.filter(s => s.citizenId === citizenId);

  res.json(list);
});

app.post('/api/sos', async (req: Request, res: Response) => {
  const {
    citizenId,
    citizenName,
    citizenPhone,
    disasterType,
    location,
    peopleCount,
    hasUrgentMedical,
    hasChildren,
    hasElderly,
    hasDisability,
    notes,
  } = req.body;

  if (!citizenPhone || !disasterType || !location) {
    return res.status(400).json({ error: 'Phone number, disaster type, and location are required.' });
  }

  // Pre-analyze with AI or rules for priority recommendation and safety summary
  const existing = db.getSOSRequests().map(s => ({
    id: s.id,
    description: s.notes || s.disasterType,
    category: s.disasterType,
    location: s.location,
  }));

  const aiResult = await analyzeIncidentWithAI(
    notes || `${disasterType} emergency affecting ${peopleCount || 1} people at ${location.address || 'location'}`,
    disasterType,
    Boolean(hasUrgentMedical),
    Boolean(hasChildren),
    Boolean(hasElderly),
    Boolean(hasDisability),
    Number(peopleCount) || 1,
    existing
  );

  const priority = aiResult.priority;

  const { request, isDuplicateWarning } = db.createSOSRequest({
    citizenId: citizenId || `anon-${Date.now()}`,
    citizenName: citizenName || 'Anonymous Citizen',
    citizenPhone: citizenPhone.trim(),
    disasterType,
    location,
    peopleCount: Number(peopleCount) || 1,
    hasUrgentMedical: Boolean(hasUrgentMedical),
    hasChildren: Boolean(hasChildren),
    hasElderly: Boolean(hasElderly),
    hasDisability: Boolean(hasDisability),
    notes: notes || '',
    priority,
    aiPrioritySuggestion: aiResult.priority,
    aiSummary: aiResult.summary,
  });

  db.addAuditLog({
    actorId: citizenId || request.id,
    actorName: citizenName || 'Citizen',
    actorRole: 'citizen',
    action: 'SOS_SUBMITTED',
    targetType: 'sos_request',
    targetId: request.id,
    details: `SOS Emergency submitted by ${citizenPhone} at ${location.address || 'GPS coords'}. Affected: ${peopleCount}. Priority: ${priority}`,
  });

  res.status(201).json({
    success: true,
    request,
    isDuplicateWarning,
    aiAnalysis: aiResult,
  });
});

app.patch('/api/sos/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes, declineReason } = req.body;
  const actor = getRequester(req) || { id: 'sys-operator', name: 'Duty Officer', role: 'district_officer' };

  const updated = db.updateSOSStatus(id, status, actor, notes, declineReason);
  if (!updated) {
    return res.status(404).json({ error: 'SOS request not found' });
  }
  res.json({ success: true, request: updated });
});

app.post('/api/sos/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { teamId, teamName, teamPhone } = req.body;
  const actor = getRequester(req) || { id: 'sys-commander', name: 'Command Dispatch', role: 'district_officer' };

  if (!teamId || !teamName) {
    return res.status(400).json({ error: 'Team ID and Team Name are required' });
  }

  const updated = db.assignSOSTeam(id, teamId, teamName, teamPhone || '', actor);
  if (!updated) {
    return res.status(404).json({ error: 'SOS request not found' });
  }
  res.json({ success: true, request: updated });
});

// --- Disaster Reports ---
app.get('/api/reports', (req: Request, res: Response) => {
  const { category, district, status } = req.query;
  let list = db.getReports();

  if (category) list = list.filter(r => r.category === category);
  if (district) list = list.filter(r => r.location.district?.toLowerCase() === (district as string).toLowerCase());
  if (status) list = list.filter(r => r.verificationStatus === status);

  res.json(list);
});

app.post('/api/reports', async (req: Request, res: Response) => {
  const {
    reporterId,
    reporterName,
    reporterPhone,
    category,
    title,
    description,
    location,
    incidentTime,
    imageUrl,
    peopleAffectedCount,
  } = req.body;

  if (!title || !description || !location) {
    return res.status(400).json({ error: 'Title, description, and location are required.' });
  }

  const existing = db.getReports().map(r => ({
    id: r.id,
    description: `${r.title} ${r.description}`,
    category: r.category,
    location: r.location,
  }));

  const aiResult = await analyzeIncidentWithAI(
    `${title}. ${description}`,
    category,
    false,
    false,
    false,
    false,
    Number(peopleAffectedCount) || 0,
    existing
  );

  const report = db.createReport({
    reporterId: reporterId || 'anon-reporter',
    reporterName: reporterName || 'Anonymous Citizen',
    reporterPhone,
    category: category || aiResult.category,
    title: title.trim(),
    description: description.trim(),
    location,
    incidentTime: incidentTime || new Date().toISOString(),
    imageUrl,
    peopleAffectedCount: Number(peopleAffectedCount) || undefined,
    priority: aiResult.priority,
    aiClassification: {
      category: aiResult.category,
      priority: aiResult.priority,
      confidence: aiResult.confidenceScore,
      summary: aiResult.summary,
      isDuplicateCandidate: aiResult.isDuplicateSuspect,
      duplicateReferenceId: aiResult.duplicateNotes,
    },
  });

  db.addAuditLog({
    actorId: reporterId || report.id,
    actorName: reporterName || 'Citizen Reporter',
    actorRole: 'citizen',
    action: 'REPORT_SUBMITTED',
    targetType: 'disaster_report',
    targetId: report.id,
    details: `Disaster report #${report.id} submitted for ${report.title} in ${location.district || 'district'}. Priority: ${aiResult.priority}`,
  });

  res.status(201).json({ success: true, report, aiAnalysis: aiResult });
});

app.patch('/api/reports/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { verificationStatus, notes, priority } = req.body;
  const actor = getRequester(req) || { id: 'admin-mod', name: 'Authorized Moderator', role: 'district_officer' };

  if (!['state_admin', 'district_officer', 'rescue_team'].includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized: Verification privileges required' });
  }

  const updated = db.verifyReport(id, verificationStatus, notes || '', priority || 'medium', actor);
  if (!updated) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json({ success: true, report: updated });
});

// --- Relief Centres & Inventory ---
app.get('/api/relief-centres', (req: Request, res: Response) => {
  const { district } = req.query;
  let list = db.getReliefCentres();
  if (district) {
    list = list.filter(r => r.district.toLowerCase() === (district as string).toLowerCase());
  }
  res.json(list);
});

app.patch('/api/relief-centres/:id/inventory', (req: Request, res: Response) => {
  const { id } = req.params;
  const { inventory, occupancyDelta } = req.body;
  const actor = getRequester(req) || { id: 'mgr-01', name: 'Relief Manager', role: 'relief_manager' };

  const updated = db.updateReliefInventory(id, inventory || {}, Number(occupancyDelta) || 0, actor);
  if (!updated) {
    return res.status(404).json({ error: 'Relief centre not found' });
  }
  res.json({ success: true, centre: updated });
});

// --- Medical Facilities ---
app.get('/api/medical/facilities', (req: Request, res: Response) => {
  const { district } = req.query;
  let list = db.getMedicalFacilities();
  if (district) {
    list = list.filter(m => m.district.toLowerCase() === (district as string).toLowerCase());
  }
  res.json(list);
});

// --- Volunteers & Tasks ---
app.get('/api/volunteers', (req: Request, res: Response) => {
  res.json(db.getVolunteers());
});

app.get('/api/volunteers/tasks', (req: Request, res: Response) => {
  res.json(db.getVolunteerTasks());
});

app.post('/api/volunteers/tasks/:id/join', (req: Request, res: Response) => {
  const { id } = req.params;
  const { volunteerId } = req.body;
  if (!volunteerId) return res.status(400).json({ error: 'volunteerId is required' });

  const updated = db.assignVolunteerToTask(id, volunteerId);
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true, task: updated });
});

// --- Alerts ---
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json(db.getAlerts());
});

app.post('/api/alerts', (req: Request, res: Response) => {
  const actor = getRequester(req) || { id: 'admin-alert', name: 'Command Duty Officer', role: 'state_admin' };
  if (!['state_admin', 'district_officer'].includes(actor.role)) {
    return res.status(403).json({ error: 'Unauthorized to issue disaster warnings' });
  }

  const {
    title,
    titleTa,
    severity,
    category,
    districtsAffected,
    issuingAuthority,
    expiresAt,
    summary,
    summaryTa,
    actionInstructions,
    actionInstructionsTa,
  } = req.body;

  if (!title || !severity || !category || !districtsAffected || !actionInstructions) {
    return res.status(400).json({ error: 'Title, severity, category, districts, and actions are required.' });
  }

  const alert = db.createAlert(
    {
      title,
      titleTa,
      severity,
      category,
      districtsAffected: Array.isArray(districtsAffected) ? districtsAffected : [districtsAffected],
      issuingAuthority: issuingAuthority || 'State Disaster Management Authority (SDMA)',
      expiresAt: expiresAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      summary: summary || '',
      summaryTa: summaryTa || '',
      actionInstructions,
      actionInstructionsTa,
    },
    actor
  );

  res.status(201).json({ success: true, alert });
});

// --- Audit Logs ---
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const user = getRequester(req);
  if (user && !['state_admin', 'district_officer'].includes(user.role)) {
    return res.status(403).json({ error: 'Access restricted to authorized administrators' });
  }
  res.json(db.getAuditLogs());
});

// --- AI Incident Analysis Endpoint ---
app.post('/api/ai/analyze-incident', async (req: Request, res: Response) => {
  const { description, category, hasMedical, hasChildren, hasElderly, hasDisability, peopleCount } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const existing = db.getReports().map(r => ({
    id: r.id,
    description: `${r.title} ${r.description}`,
    category: r.category,
  }));

  const result = await analyzeIncidentWithAI(
    description,
    category,
    Boolean(hasMedical),
    Boolean(hasChildren),
    Boolean(hasElderly),
    Boolean(hasDisability),
    Number(peopleCount) || 1,
    existing
  );

  res.json(result);
});

// --- Data Export (CSV / JSON) ---
app.get('/api/export/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const user = getRequester(req);
  if (user && !['state_admin', 'district_officer'].includes(user.role)) {
    return res.status(403).json({ error: 'Export restricted to authorized officers.' });
  }

  if (type === 'sos') {
    const list = db.getSOSRequests();
    const csvHeaders = 'ID,CitizenName,Phone,DisasterType,District,Address,PeopleCount,UrgentMedical,Status,Priority,CreatedAt\n';
    const csvRows = list
      .map(
        s =>
          `"${s.id}","${s.citizenName}","${s.citizenPhone}","${s.disasterType}","${s.location.district || ''}","${(s.location.address || '').replace(/"/g, '""')}",${s.peopleCount},${s.hasUrgentMedical},"${s.status}","${s.priority}","${s.createdAt}"`
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sos_emergency_records.csv"');
    return res.send(csvHeaders + csvRows);
  }

  if (type === 'reports') {
    const list = db.getReports();
    const csvHeaders = 'ID,Reporter,Category,Title,District,AffectedCount,VerificationStatus,Priority,CreatedAt\n';
    const csvRows = list
      .map(
        r =>
          `"${r.id}","${r.reporterName}","${r.category}","${r.title.replace(/"/g, '""')}","${r.location.district || ''}",${r.peopleAffectedCount || 0},"${r.verificationStatus}","${r.priority}","${r.createdAt}"`
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="disaster_incident_reports.csv"');
    return res.send(csvHeaders + csvRows);
  }

  res.status(400).json({ error: 'Unsupported export type' });
});

// --- Vite Middleware or Static Production Serving ---
async function start() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Disaster Rescue] Server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
