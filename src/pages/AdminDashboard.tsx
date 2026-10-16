import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SOSRequest, DisasterReport, ReliefCentre, AuditLog, User, DisasterAlert } from '../types';
import {
  ShieldAlert,
  AlertOctagon,
  Users,
  CheckCircle,
  FileCheck,
  Download,
  BellRing,
  Filter,
  Layers,
  Clock,
  Shield,
  Activity,
  UserCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser, role, availableUsers, refreshUsers } = useAuth();

  const [sosList, setSosList] = useState<SOSRequest[]>([]);
  const [reportsList, setReportsList] = useState<DisasterReport[]>([]);
  const [reliefList, setReliefList] = useState<ReliefCentre[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'sos' | 'reports' | 'users' | 'alerts' | 'audit'>('overview');

  // Verify Report Modal / Action
  const [verifyingReportId, setVerifyingReportId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'REJECTED' | 'FLAGGED_DUPLICATE'>('VERIFIED');

  // Assign Team Modal / Action
  const [assigningSosId, setAssigningSosId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('usr-res-1');

  // Issue Alert Form
  const [alertTitle, setAlertTitle] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'CRITICAL' | 'WARNING' | 'WATCH'>('WARNING');
  const [alertCategory, setAlertCategory] = useState<any>('flood');
  const [alertDistricts, setAlertDistricts] = useState('Chennai, Cuddalore');
  const [alertSummary, setAlertSummary] = useState('');
  const [alertAction, setAlertAction] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [sRes, rRes, rcRes, aRes] = await Promise.all([
        fetch('/api/sos'),
        fetch('/api/reports'),
        fetch('/api/relief-centres'),
        fetch('/api/audit-logs'),
      ]);
      if (sRes.ok) setSosList(await sRes.json());
      if (rRes.ok) setReportsList(await rRes.json());
      if (rcRes.ok) setReliefList(await rcRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
    } catch (e) {
      console.warn('Admin fetch error', e);
    }
  };

  const handleVerifyReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
        },
        body: JSON.stringify({
          verificationStatus: verifyStatus,
          notes: verifyNotes.trim() || 'Verified by District Operations Command',
          priority: 'high',
        }),
      });
      if (res.ok) {
        setVerifyingReportId(null);
        setVerifyNotes('');
        await fetchAll();
      } else {
        alert('Failed to verify report');
      }
    } catch (e) {
      alert('Verification error');
    }
  };

  const handleAssignTeam = async (sosId: string) => {
    const teamUser = availableUsers.find(u => u.id === selectedTeamId) || {
      id: 'usr-res-1',
      name: 'Capt. Sundar Raman (SDRF Alpha)',
      phone: '9444101010',
    };

    try {
      const res = await fetch(`/api/sos/${sosId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
        },
        body: JSON.stringify({
          teamId: teamUser.id,
          teamName: teamUser.name,
          teamPhone: teamUser.phone,
        }),
      });
      if (res.ok) {
        setAssigningSosId(null);
        await fetchAll();
      } else {
        alert('Failed to assign team');
      }
    } catch (e) {
      alert('Assign error');
    }
  };

  const handleApproveUser = async (userId: string, isApproved: boolean) => {
    try {
      const res = await fetch('/api/auth/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
        },
        body: JSON.stringify({ targetUserId: userId, isApproved }),
      });
      if (res.ok) {
        await refreshUsers();
        await fetchAll();
      } else {
        alert('Failed to update approval status.');
      }
    } catch (e) {
      alert('Approval update error');
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle || !alertSummary || !alertAction) {
      alert('Please fill all required alert fields.');
      return;
    }

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
        },
        body: JSON.stringify({
          title: alertTitle,
          severity: alertSeverity,
          category: alertCategory,
          districtsAffected: alertDistricts.split(',').map(s => s.trim()),
          summary: alertSummary,
          actionInstructions: alertAction,
        }),
      });
      if (res.ok) {
        alert('Disaster Warning Alert Broadcasted to Public Channels.');
        setAlertTitle('');
        setAlertSummary('');
        setAlertAction('');
        await fetchAll();
      }
    } catch (e) {
      alert('Alert broadcast failed');
    }
  };

  // Metrics computation
  const filteredSos = sosList.filter(s => selectedDistrict === 'all' || s.location.district?.toLowerCase() === selectedDistrict.toLowerCase());
  const filteredReports = reportsList.filter(r => selectedDistrict === 'all' || r.location.district?.toLowerCase() === selectedDistrict.toLowerCase());

  const activeSOSCount = filteredSos.filter(s => s.status !== 'RESOLVED' && s.status !== 'CANCELLED').length;
  const criticalSOSCount = filteredSos.filter(s => s.priority === 'critical' && s.status !== 'RESOLVED').length;
  const unverifiedReportsCount = filteredReports.filter(r => r.verificationStatus === 'PENDING_VERIFICATION').length;
  const totalBeds = reliefList.reduce((acc, c) => acc + c.totalCapacity, 0);
  const occupiedBeds = reliefList.reduce((acc, c) => acc + c.currentOccupancy, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-600 text-white uppercase">
              Operational Command Console
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-300">
              {currentUser?.role === 'state_admin' ? 'State Disaster Commissioner' : 'District Disaster Management Authority (DDMA)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser?.name || 'Disaster Commander'}
          </h1>
          <p className="text-xs text-slate-400">
            Multi-agency coordination, incident verification, SDRF asset dispatch, and public warnings
          </p>
        </div>

        {/* CSV Export & District Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white"
          >
            <option value="all">All Districts (Statewide)</option>
            <option value="chennai">Chennai District</option>
            <option value="cuddalore">Cuddalore District</option>
            <option value="nagapattinam">Nagapattinam District</option>
          </select>

          <a
            href="/api/export/sos"
            download
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SOS CSV</span>
          </a>

          <a
            href="/api/export/reports"
            download
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Reports CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active SOS</div>
          <div className="text-2xl font-black text-rose-600 font-mono tabular-nums mt-1">{activeSOSCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{criticalSOSCount} Life-Threatening</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Reports</div>
          <div className="text-2xl font-black text-amber-600 font-mono tabular-nums mt-1">{unverifiedReportsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting Verification</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Relief Capacity</div>
          <div className="text-2xl font-black text-blue-600 font-mono tabular-nums mt-1">
            {occupiedBeds} / {totalBeds}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Shelter Occupancy</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verified Responders</div>
          <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums mt-1">
            {availableUsers.filter(u => u.isApproved && u.role !== 'citizen').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">SDRF, Medical, Relief</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Audit Trail Logs</div>
          <div className="text-2xl font-black text-slate-800 font-mono tabular-nums mt-1">{auditLogs.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Logged Operations</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Incident Triage Queue
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Report Verification ({unverifiedReportsCount} Pending)
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Responder Approvals & Roles
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'alerts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Broadcast Disaster Alert
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Administrative Audit Log
        </button>
      </div>

      {/* Tab 1: SOS Incidents Triage & Team Assignment */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Active SOS Emergency Requests ({filteredSos.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">Live Responder Dispatch</span>
          </div>

          <div className="space-y-3">
            {filteredSos.map(sos => (
              <div
                key={sos.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-900">
                      {sos.id}
                    </span>
                    <span className="text-xs font-bold uppercase text-slate-700">
                      {sos.disasterType} · {sos.peopleCount} Affected
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        sos.priority === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sos.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase text-slate-600">
                      Status: {sos.status}
                    </span>
                    <button
                      onClick={() => setAssigningSosId(sos.id)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Assign Rescue Team
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    Citizen: <strong className="text-slate-900">{sos.citizenName}</strong> · Phone:{' '}
                    <a href={`tel:${sos.citizenPhone}`} className="text-rose-600 font-mono font-bold">
                      {sos.citizenPhone}
                    </a>
                  </div>
                  <div>
                    Location: <strong className="text-slate-800">{sos.location.address}</strong>
                  </div>
                </div>

                {sos.aiSummary && (
                  <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded text-[11px] text-indigo-900">
                    <strong>AI Advisory Summary:</strong> {sos.aiSummary}
                  </div>
                )}

                {sos.assignedTeamName && (
                  <div className="text-xs text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 p-2 rounded">
                    Assigned Unit: <strong>{sos.assignedTeamName}</strong> ({sos.assignedTeamPhone})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Report Verification */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            Disaster Reports Moderation & Verification ({filteredReports.length})
          </h3>

          <div className="space-y-3">
            {filteredReports.map(rep => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-900">
                      {rep.id}
                    </span>
                    <span className="text-xs font-bold uppercase text-slate-800">
                      {rep.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        rep.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rep.verificationStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rep.verificationStatus}
                    </span>
                  </div>

                  <button
                    onClick={() => setVerifyingReportId(rep.id)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Moderate & Verify
                  </button>
                </div>

                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{rep.title}</h4>
                <p className="text-xs text-slate-600">{rep.description}</p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Location: {rep.location.address} · Reported by {rep.reporterName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Responder Accounts Approval */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            Authorized Personnel & Official Account Approvals
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Organization / Badge</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {availableUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-3 font-mono uppercase text-slate-700">{u.role}</td>
                    <td className="p-3 font-mono">{u.phone}</td>
                    <td className="p-3">{u.district}</td>
                    <td className="p-3 text-slate-500">{u.organization || u.badgeNumber || 'Civilian'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                          u.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.isApproved ? (
                        <button
                          onClick={() => handleApproveUser(u.id, false)}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveUser(u.id, true)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                        >
                          Approve Account
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Broadcast Alert */}
      {activeTab === 'alerts' && (
        <form onSubmit={handleCreateAlert} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">Broadcast Public Disaster Alert</h3>
            <p className="text-xs text-slate-500">
              Broadcast high-priority warning to web alerts, civil notification banners, and SMS gateways
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alert Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. RED ALERT: Chembarambakkam Dam Discharge Exceeds 15,000 cusecs"
              value={alertTitle}
              onChange={e => setAlertTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Severity *</label>
              <select
                value={alertSeverity}
                onChange={e => setAlertSeverity(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="CRITICAL">CRITICAL (Red Alert)</option>
                <option value="WARNING">WARNING (Orange Alert)</option>
                <option value="WATCH">WATCH (Yellow Alert)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Districts (comma separated)</label>
              <input
                type="text"
                value={alertDistricts}
                onChange={e => setAlertDistricts(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Summary Description *</label>
            <textarea
              rows={2}
              required
              placeholder="Brief meteorological or hydrological situation..."
              value={alertSummary}
              onChange={e => setAlertSummary(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Action Instructions for Public *</label>
            <textarea
              rows={2}
              required
              placeholder="Evacuation steps, electricity shutdown notice, emergency camp directions..."
              value={alertAction}
              onChange={e => setAlertAction(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <BellRing className="w-4 h-4" />
              <span>Broadcast Public Alert</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Administrative & Operational Audit Trail ({auditLogs.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Immutable Compliance Log</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">
                      By {log.actorName} ({log.actorRole})
                    </span>
                  </div>
                  <p className="text-slate-500">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verify Report Modal */}
      {verifyingReportId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Moderate Disaster Report</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Verification Status</label>
              <select
                value={verifyStatus}
                onChange={e => setVerifyStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
              >
                <option value="VERIFIED">VERIFIED (Authentic incident - Show on Public Map)</option>
                <option value="FLAGGED_DUPLICATE">FLAGGED DUPLICATE</option>
                <option value="REJECTED">REJECTED (Irrelevant / False)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Operational Verification Notes</label>
              <input
                type="text"
                placeholder="e.g. Confirmed with Fire station control; water pumps dispatched."
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setVerifyingReportId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyReport(verifyingReportId)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Commit Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Team Modal */}
      {assigningSosId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Dispatch Rescue Team</h3>
            <p className="text-xs text-slate-600">
              Select authorized responder unit to assign to SOS request #{assigningSosId}:
            </p>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              {availableUsers
                .filter(u => u.role === 'rescue_team' || u.role === 'medical_team')
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.organization || u.role}) - {u.phone}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAssigningSosId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignTeam(assigningSosId)}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
              >
                Confirm Dispatch Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
