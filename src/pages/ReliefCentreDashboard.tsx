import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ReliefCentre } from '../types';
import {
  Home,
  Droplets,
  PackageCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export const ReliefCentreDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser, role } = useAuth();

  const [centres, setCentres] = useState<ReliefCentre[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<ReliefCentre | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Inventory state
  const [waterDelta, setWaterDelta] = useState(0);
  const [foodDelta, setFoodDelta] = useState(0);
  const [firstAidDelta, setFirstAidDelta] = useState(0);
  const [occupancyChange, setOccupancyChange] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/relief-centres');
      if (res.ok) {
        const data: ReliefCentre[] = await res.json();
        setCentres(data);
        if (data.length > 0 && !selectedCentre) {
          setSelectedCentre(data[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch relief centres', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async () => {
    if (!selectedCentre) return;
    setIsUpdating(true);

    const updatedInv = {
      cleanWaterLiters: Math.max(0, selectedCentre.inventory.cleanWaterLiters + Number(waterDelta)),
      foodRationPacks: Math.max(0, selectedCentre.inventory.foodRationPacks + Number(foodDelta)),
      firstAidKits: Math.max(0, selectedCentre.inventory.firstAidKits + Number(firstAidDelta)),
    };

    try {
      const res = await fetch(`/api/relief-centres/${selectedCentre.id}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
        },
        body: JSON.stringify({
          inventory: updatedInv,
          occupancyDelta: Number(occupancyChange),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedCentre(data.centre);
        setWaterDelta(0);
        setFoodDelta(0);
        setFirstAidDelta(0);
        setOccupancyChange(0);
        await fetchCentres();
        alert('Inventory and occupancy counts updated successfully.');
      } else {
        alert('Failed to update inventory.');
      }
    } catch (e) {
      alert('Network error while saving inventory.');
    } finally {
      setIsUpdating(false);
    }
  };

  const isReliefManager = role === 'relief_manager' || role === 'state_admin' || role === 'district_officer';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-blue-900 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-600 text-white uppercase">
              Civil Relief Shelter & Ration Cell
            </span>
            <span className="text-xs text-blue-300">·</span>
            <span className="text-xs font-mono text-blue-200">District Coordination</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'ta' ? 'நிவாரண முகாம்கள் மற்றும் உணவுப் பங்கீடு' : 'Relief Centers & Supply Inventory'}
          </h1>
          <p className="text-xs text-blue-200">
            Shelter bed capacity, drinking water reserves, food rations, and medical supply audits
          </p>
        </div>

        <button
          onClick={fetchCentres}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold border border-blue-700 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Inventory</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Centre List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              <span>Operational Shelters ({centres.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Verified Grid</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading centres...</div>
          ) : (
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto">
              {centres.map(rc => {
                const isSelected = selectedCentre?.id === rc.id;
                const occupancyPercent = Math.round((rc.currentOccupancy / rc.totalCapacity) * 100);
                const isWaterLow = rc.inventory.cleanWaterLiters < 2000;
                const isFoodLow = rc.inventory.foodRationPacks < 300;

                return (
                  <div
                    key={rc.id}
                    onClick={() => setSelectedCentre(rc)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {rc.district} · {rc.id}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Open
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                      {rc.name}
                    </h4>

                    {/* Occupancy Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                        <span>Beds: {rc.currentOccupancy} / {rc.totalCapacity}</span>
                        <span>{occupancyPercent}% Occupied</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${occupancyPercent > 85 ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Low Stock Warning */}
                    {(isWaterLow || isFoodLow) && (
                      <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Low Stock: {isWaterLow ? 'Drinking Water (<2000L) ' : ''}{isFoodLow ? 'Food Packs (<300)' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Centre Details & Manager Stock Intake (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {selectedCentre ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {selectedCentre.id}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedCentre.district}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedCentre.name}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCentre.address}</span>
                  </p>
                </div>

                <a
                  href={`tel:${selectedCentre.phone}`}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Manager: {selectedCentre.phone}</span>
                </a>
              </div>

              {/* Current Monitored Inventory Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Audited Supply Stocks
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Last update: {new Date(selectedCentre.lastInventoryUpdate).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Drinking Water</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {selectedCentre.inventory.cleanWaterLiters.toLocaleString()} L
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Food Rations</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {selectedCentre.inventory.foodRationPacks.toLocaleString()} pkts
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">First-Aid Kits</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {selectedCentre.inventory.firstAidKits} units
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Blankets</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {selectedCentre.inventory.blankets}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">ORS Hydration</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {selectedCentre.inventory.orsPackets} pkts
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Sanitation Kits</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {selectedCentre.inventory.sanitationKits}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager Actions: Update Stocks */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-700" />
                    <span>Manager Stock Update & Census Audit</span>
                  </h4>
                  {!isReliefManager && (
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-medium">
                      Simulating as Manager
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Add Water (Liters)</label>
                    <input
                      type="number"
                      step="100"
                      value={waterDelta}
                      onChange={e => setWaterDelta(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Add Food Packs</label>
                    <input
                      type="number"
                      step="50"
                      value={foodDelta}
                      onChange={e => setFoodDelta(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Add First Aid Kits</label>
                    <input
                      type="number"
                      value={firstAidDelta}
                      onChange={e => setFirstAidDelta(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Occupancy (+/-)</label>
                    <input
                      type="number"
                      placeholder="e.g. +15 or -10"
                      value={occupancyChange}
                      onChange={e => setOccupancyChange(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateInventory}
                    disabled={isUpdating}
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {isUpdating ? 'Saving Update...' : 'Commit Stock & Census Audit'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              Select a relief shelter on the left to inspect supplies and update inventory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
