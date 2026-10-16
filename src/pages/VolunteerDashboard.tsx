import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { VolunteerTask, VolunteerProfile } from '../types';
import {
  Users,
  CheckCircle,
  Clock,
  MapPin,
  ShieldCheck,
  Award,
  ArrowRight,
  HandHeart,
  PlusCircle,
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [activeVolunteer, setActiveVolunteer] = useState<VolunteerProfile | null>(null);
  const [joiningTaskId, setJoiningTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchVolunteers();
  }, [currentUser]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/volunteers/tasks');
      if (res.ok) setTasks(await res.json());
    } catch (e) {}
  };

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/volunteers');
      if (res.ok) {
        const list: VolunteerProfile[] = await res.json();
        setVolunteers(list);
        const match = list.find(v => v.userId === currentUser?.id || v.phone === currentUser?.phone);
        setActiveVolunteer(match || list[0] || null);
      }
    } catch (e) {}
  };

  const handleJoinTask = async (taskId: string) => {
    if (!activeVolunteer) return;
    setJoiningTaskId(taskId);
    try {
      const res = await fetch(`/api/volunteers/tasks/${taskId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: activeVolunteer.id }),
      });
      if (res.ok) {
        await fetchTasks();
        alert('You have successfully enrolled for this volunteer relief mission!');
      } else {
        alert('Could not join task.');
      }
    } catch (e) {
      alert('Network failure');
    } finally {
      setJoiningTaskId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-600 text-white uppercase">
              Civil Protection Volunteer Force
            </span>
            <span className="text-xs text-indigo-300">·</span>
            <span className="text-xs font-mono text-indigo-200">Red Cross & Civil Defense</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'ta' ? 'தன்னார்வலர் மேலாண்மை தளம்' : 'Disaster Relief Volunteer Corps'}
          </h1>
          <p className="text-xs text-indigo-200">
            Coordinating verified volunteers for relief packaging, shelter assistance, and logistics
          </p>
        </div>

        {activeVolunteer && (
          <div className="bg-indigo-900/60 border border-indigo-700/60 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center font-bold text-white text-sm">
              {activeVolunteer.name[0]}
            </div>
            <div className="text-xs">
              <div className="font-bold text-white flex items-center gap-1">
                <span>{activeVolunteer.name}</span>
                {activeVolunteer.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="text-indigo-300 font-mono">
                {activeVolunteer.completedTasksCount} Missions Completed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Volunteer Profile & Skills Overview */}
      {activeVolunteer && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-900">Registered Volunteer:</span>
              <span className="font-semibold text-slate-700">{activeVolunteer.name}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">District: {activeVolunteer.district}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Identity Verified by District Officer
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Certified Capabilities:</span>
            {activeVolunteer.skills.map((s, idx) => (
              <span key={idx} className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Open Volunteer Tasks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Open Field Assignments ({tasks.length})
            </h3>
            <p className="text-xs text-slate-500">
              Select an open task to deploy with local distribution and support teams
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tasks.map(task => {
            const isEnrolled = activeVolunteer && task.assignedVolunteerIds.includes(activeVolunteer.id);
            const spotsLeft = Math.max(0, task.volunteersNeeded - task.assignedVolunteerIds.length);

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {task.district} · {task.urgency.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 font-mono">
                      {task.assignedVolunteerIds.length} / {task.volunteersNeeded} Enrolled
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 leading-snug">
                    {task.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {task.description}
                  </p>

                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{task.location.address}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {spotsLeft > 0 ? `${spotsLeft} spots available` : 'Capacity Reached'}
                  </span>

                  {isEnrolled ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinTask(task.id)}
                      disabled={spotsLeft === 0 || joiningTaskId === task.id}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{joiningTaskId === task.id ? 'Joining...' : 'Enroll in Mission'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
