import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SOSRequest, SOSStatus } from '../types';
import {
  LifeBuoy,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Navigation,
  FileCheck,
  Send,
  XCircle,
  Shield,
  Layers,
} from 'lucide-react';

export const RescueTeamDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser, role } = useAuth();

  const [assignedCases, setAssignedCases] = useState<SOSRequest[]>([]);
  const [selectedCase, setSelectedCase] = useState<SOSRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update form states
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    fetchAssignedCases();
  }, [currentUser]);

  const fetchAssignedCases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sos');
      if (res.ok) {
        const all: SOSRequest[] = await res.json();
        // Restrict to assigned to this team or unassigned critical cases in their district
        const relevant = all.filter(
          s =>
            s.assignedTeamId === currentUser?.id ||
            s.assignedTeamName?.includes('SDRF') ||
            (s.status === 'SUBMITTED' && s.priority === 'critical')
        );
        setAssignedCases(relevant);
        if (relevant.length > 0 && !selectedCase) {
          setSelectedCase(relevant[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch assigned cases', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: SOSStatus, reason?: string) => {
    if (!selectedCase) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/sos/${selectedCase.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: statusUpdateNote.trim() || undefined,
          declineReason: reason || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data.request);
        setStatusUpdateNote('');
        setShowDeclineModal(false);
        await fetchAssignedCases();
      } else {
        alert('Failed to update status.');
      }
    } catch (e) {
      alert('Network error while updating rescue task.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-600 text-white uppercase">
              SDRF Active Responder Terminal
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-300">{currentUser?.badgeNumber || 'SDRF-TN-401'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser?.name || 'Rescue Officer'}
          </h1>
          <p className="text-xs text-slate-400">
            Unit: {currentUser?.organization || 'Tamil Nadu State Disaster Response Force (SDRF Alpha)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssignedCases}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            Refresh Dispatch Queue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Assigned Cases Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <LifeBuoy className="w-3.5 h-3.5 text-rose-600" />
              <span>Assigned Incidents ({assignedCases.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Live Sync</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Fetching cases...</div>
          ) : assignedCases.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl p-4">
              No pending rescue tasks currently assigned to your team.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {assignedCases.map(item => {
                const isSelected = selectedCase?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCase(item)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-1 ring-rose-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">{item.id}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                          item.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {item.citizenName} · {item.disasterType} ({item.peopleCount} ppl)
                    </div>

                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.location.address || 'Address'}</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                      <span>Status: <strong className="text-slate-700">{item.status}</strong></span>
                      <span className="font-mono">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Tactical Mission Action Console (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {selectedCase ? (
            <div className="space-y-6">
              {/* Mission Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {selectedCase.id}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold uppercase text-slate-700">
                      {selectedCase.disasterType} Emergency
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedCase.citizenName} ({selectedCase.peopleCount} Individuals Trapped)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedCase.citizenPhone}`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Victim: {selectedCase.citizenPhone}</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCase.location.lat},${selectedCase.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-rose-400" />
                    <span>Launch GPS Navigation</span>
                  </a>
                </div>
              </div>

              {/* Vulnerabilities & Special Medical Flags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className={`p-2.5 rounded-xl border text-xs ${selectedCase.hasUrgentMedical ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  Medical Critical: {selectedCase.hasUrgentMedical ? 'YES (Oxygen/Trauma)' : 'No'}
                </div>
                <div className={`p-2.5 rounded-xl border text-xs ${selectedCase.hasChildren ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  Children: {selectedCase.hasChildren ? 'Present' : 'None'}
                </div>
                <div className={`p-2.5 rounded-xl border text-xs ${selectedCase.hasElderly ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  Elderly: {selectedCase.hasElderly ? 'Present' : 'None'}
                </div>
                <div className={`p-2.5 rounded-xl border text-xs ${selectedCase.hasDisability ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  Disability: {selectedCase.hasDisability ? 'Wheelchair / Bed' : 'None'}
                </div>
              </div>

              {/* Exact Location & Landmark */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Target Coordinate & Address:</span>
                </div>
                <p className="text-slate-900 font-medium">{selectedCase.location.address}</p>
                {selectedCase.location.landmark && (
                  <p className="text-slate-600">Landmark: <strong>{selectedCase.location.landmark}</strong></p>
                )}
                <div className="text-slate-500 font-mono text-[11px]">
                  GPS Lat/Lng: {selectedCase.location.lat}, {selectedCase.location.lng} · District: {selectedCase.location.district || 'Chennai'}
                </div>
              </div>

              {/* Victim Notes */}
              {selectedCase.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900">Victim's Emergency Notes:</span>
                  <p className="text-amber-950">{selectedCase.notes}</p>
                </div>
              )}

              {/* Operational Status Action Bar */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Update Mission Operational State
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('ASSIGNED')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      selectedCase.status === 'ASSIGNED'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    1. Accept Assignment
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('TEAM_DISPATCHED')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      selectedCase.status === 'TEAM_DISPATCHED'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    2. Boat / Team Dispatched
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('ASSISTANCE_PROVIDED')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      selectedCase.status === 'ASSISTANCE_PROVIDED'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    3. On-Site Assistance Provided
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      selectedCase.status === 'RESOLVED'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    4. Evacuation Resolved
                  </button>

                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 ml-auto"
                  >
                    Decline Assignment (With Reason)
                  </button>
                </div>

                {/* Status Notes Input */}
                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Record Situational Update / Access Restrictions / Evacuation Log
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Inflatable boat deployed through south canal; elderly patient secured with lifejacket."
                      value={statusUpdateNote}
                      onChange={e => setStatusUpdateNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => handleUpdateStatus(selectedCase.status)}
                      disabled={isUpdating || !statusUpdateNote.trim()}
                      className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Log Note</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              Select an incident from the assigned queue to view tactical telemetry and update status.
            </div>
          )}
        </div>
      </div>

      {/* Decline Assignment Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Decline Rescue Assignment</h3>
            <p className="text-xs text-slate-600">
              State the operational constraint preventing response (e.g. water draft too shallow for heavy boat, unit engaged in higher priority trauma):
            </p>
            <textarea
              rows={3}
              placeholder="State explicit reason for operational audit log..."
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus('SUBMITTED', declineReason)}
                disabled={!declineReason.trim()}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Confirm Decline & Re-queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
