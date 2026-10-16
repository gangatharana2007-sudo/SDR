import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DisasterReport, ReliefCentre, MedicalFacility, SOSRequest } from '../types';
import { Filter, Layers, Navigation, Search, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DisasterMapProps {
  reports?: DisasterReport[];
  reliefCentres?: ReliefCentre[];
  medicalFacilities?: MedicalFacility[];
  sosRequests?: SOSRequest[];
  height?: string;
}

export const DisasterMap: React.FC<DisasterMapProps> = ({
  reports: propReports,
  reliefCentres: propReliefCentres,
  medicalFacilities: propMedicalFacilities,
  sosRequests: propSosRequests,
  height = '540px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const { language } = useLanguage();
  const { role, isAdmin } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  // Data states
  const [reports, setReports] = useState<DisasterReport[]>(propReports || []);
  const [reliefCentres, setReliefCentres] = useState<ReliefCentre[]>(propReliefCentres || []);
  const [medicalFacilities, setMedicalFacilities] = useState<MedicalFacility[]>(propMedicalFacilities || []);
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>(propSosRequests || []);

  const fetchData = async () => {
    try {
      const [repRes, rcRes, medRes, sosRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/relief-centres'),
        fetch('/api/medical/facilities'),
        fetch('/api/sos'),
      ]);
      if (repRes.ok) setReports(await repRes.json());
      if (rcRes.ok) setReliefCentres(await rcRes.json());
      if (medRes.ok) setMedicalFacilities(await medRes.json());
      if (sosRes.ok) setSosRequests(await sosRes.json());
    } catch (e) {
      console.warn('Map data fetch fallback to props/local', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Centered at Chennai / Tamil Nadu coastal zone
    const map = L.map(mapContainerRef.current, {
      center: [13.0428, 80.2341],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SDR National Safety GIS',
      maxZoom: 18,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render markers whenever data or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Disaster Reports Markers
    reports.forEach(rep => {
      if (categoryFilter !== 'all' && categoryFilter !== rep.category && categoryFilter !== 'incidents') return;
      if (searchQuery && !rep.title.toLowerCase().includes(searchQuery.toLowerCase()) && !rep.location.address?.toLowerCase().includes(searchQuery.toLowerCase())) return;

      const isVerified = rep.verificationStatus === 'VERIFIED';
      // Only authorized personnel see pending or rejected
      if (!isVerified && !isAdmin && role !== 'rescue_team') return;

      const color = isVerified ? (rep.priority === 'critical' ? '#e11d48' : '#f59e0b') : '#94a3b8';
      const iconHtml = `
        <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white; font-size: 14px; font-weight: bold;">
          !
        </div>
      `;
      const customIcon = L.divIcon({ html: iconHtml, className: 'custom-disaster-marker', iconSize: [28, 28], iconAnchor: [14, 14] });

      const marker = L.marker([rep.location.lat, rep.location.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="min-width: 220px; font-family: system-ui, sans-serif; font-size: 12px;">
          <div style="font-weight: bold; color: ${color}; margin-bottom: 4px; text-transform: uppercase;">
            ${rep.category.replace('_', ' ')} · ${rep.priority}
          </div>
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${rep.title}</div>
          <div style="color: #64748b; margin-bottom: 6px;">${rep.location.address || 'Reported Location'}</div>
          <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 4px; font-size: 11px; margin-bottom: 6px;">
            Status: <strong>${rep.verificationStatus}</strong> ${rep.verifiedBy ? `(${rep.verifiedBy})` : ''}
          </div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${rep.location.lat},${rep.location.lng}" target="_blank" style="display: inline-block; background: #0f172a; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold;">Get Directions</a>
        </div>
      `);
      marker.on('click', () => setSelectedIncident(rep));
      markersLayerRef.current?.addLayer(marker);
      bounds.extend([rep.location.lat, rep.location.lng]);
    });

    // 2. Relief Centres Markers
    if (categoryFilter === 'all' || categoryFilter === 'relief_camps') {
      reliefCentres.forEach(rc => {
        if (searchQuery && !rc.name.toLowerCase().includes(searchQuery.toLowerCase()) && !rc.district.toLowerCase().includes(searchQuery.toLowerCase())) return;

        const iconHtml = `
          <div style="background-color: #2563eb; width: 28px; height: 28px; border-radius: 8px; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white; font-size: 13px; font-weight: bold;">
            R
          </div>
        `;
        const rcIcon = L.divIcon({ html: iconHtml, className: 'rc-marker', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([rc.location.lat, rc.location.lng], { icon: rcIcon });
        marker.bindPopup(`
          <div style="min-width: 230px; font-family: system-ui, sans-serif; font-size: 12px;">
            <div style="font-weight: bold; color: #2563eb; text-transform: uppercase;">Relief Shelter</div>
            <div style="font-size: 13px; font-weight: 600; margin: 2px 0 4px;">${rc.name}</div>
            <div style="color: #475569; margin-bottom: 4px;">${rc.address}</div>
            <div style="background: #eff6ff; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
              Occupancy: <strong>${rc.currentOccupancy} / ${rc.totalCapacity}</strong> beds
              <br/>Drinking Water: ${rc.inventory.cleanWaterLiters}L · Food Packs: ${rc.inventory.foodRationPacks}
            </div>
            <div style="display: flex; gap: 6px;">
              <a href="tel:${rc.phone}" style="background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px;">Call Camp</a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${rc.location.lat},${rc.location.lng}" target="_blank" style="background: #0f172a; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px;">Directions</a>
            </div>
          </div>
        `);
        markersLayerRef.current?.addLayer(marker);
        bounds.extend([rc.location.lat, rc.location.lng]);
      });
    }

    // 3. Medical Facilities Markers
    if (categoryFilter === 'all' || categoryFilter === 'medical') {
      medicalFacilities.forEach(med => {
        if (searchQuery && !med.name.toLowerCase().includes(searchQuery.toLowerCase())) return;

        const iconHtml = `
          <div style="background-color: #16a34a; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white; font-size: 14px; font-weight: bold;">
            +
          </div>
        `;
        const medIcon = L.divIcon({ html: iconHtml, className: 'med-marker', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([med.location.lat, med.location.lng], { icon: medIcon });
        marker.bindPopup(`
          <div style="min-width: 220px; font-family: system-ui, sans-serif; font-size: 12px;">
            <div style="font-weight: bold; color: #16a34a; text-transform: uppercase;">Medical Facility</div>
            <div style="font-size: 13px; font-weight: 600; margin: 2px 0 4px;">${med.name}</div>
            <div style="color: #475569; margin-bottom: 4px;">${med.address}</div>
            <div style="background: #f0fdf4; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
              Active Ambulances: <strong>${med.ambulanceAvailableCount}</strong> · Trauma Care: ${med.hasTraumaCare ? 'Yes' : 'No'}
            </div>
            <a href="tel:${med.emergencyPhone}" style="display: inline-block; background: #16a34a; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold;">Emergency Line: ${med.emergencyPhone}</a>
          </div>
        `);
        markersLayerRef.current?.addLayer(marker);
        bounds.extend([med.location.lat, med.location.lng]);
      });
    }

    // 4. Critical Active SOS Markers (for Rescue & Admin only)
    if (isAdmin || role === 'rescue_team') {
      sosRequests.filter(s => s.status !== 'RESOLVED' && s.status !== 'CANCELLED').forEach(sos => {
        const iconHtml = `
          <div style="background-color: #dc2626; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(220, 38, 38, 0.8); color: white; font-size: 11px; font-weight: 900; animation: pulse 1.5s infinite;">
            SOS
          </div>
        `;
        const sosIcon = L.divIcon({ html: iconHtml, className: 'sos-marker', iconSize: [32, 32], iconAnchor: [16, 16] });
        const marker = L.marker([sos.location.lat, sos.location.lng], { icon: sosIcon });
        marker.bindPopup(`
          <div style="min-width: 230px; font-family: system-ui, sans-serif; font-size: 12px;">
            <div style="font-weight: 900; color: #dc2626; text-transform: uppercase;">EMERGENCY SOS: ${sos.id}</div>
            <div style="font-weight: bold; margin: 2px 0;">Victim: ${sos.citizenName} (${sos.peopleCount} people)</div>
            <div style="color: #475569; margin-bottom: 4px;">Phone: <strong>${sos.citizenPhone}</strong></div>
            <div style="color: #64748b; margin-bottom: 4px;">${sos.location.address || 'Address'}</div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
              Status: <strong>${sos.status}</strong> · ${sos.hasUrgentMedical ? '⚠️ Medical Emergency' : 'Standard Evacuation'}
            </div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${sos.location.lat},${sos.location.lng}" target="_blank" style="display: block; text-align: center; background: #dc2626; color: white; padding: 4px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold;">Launch Rescue Navigation</a>
          </div>
        `);
        markersLayerRef.current?.addLayer(marker);
        bounds.extend([sos.location.lat, sos.location.lng]);
      });
    }

    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [reports, reliefCentres, medicalFacilities, sosRequests, categoryFilter, searchQuery, role, isAdmin]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Map Control Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {language === 'ta' ? 'நேரலை பேரிடர் GIS வரைபடம்' : 'Live Disaster GIS Operational Map'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            (OpenStreetMap & SDR GeoJSON)
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ta' ? 'இடத்தைத் தேடுக...' : 'Search location or camp...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white w-40 sm:w-52"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-700"
          >
            <option value="all">All Layers & Points</option>
            <option value="incidents">Disaster Incidents Only</option>
            <option value="relief_camps">Relief Shelters</option>
            <option value="medical">Hospitals & Paramedics</option>
            <option value="flood">Flooding Only</option>
            <option value="blocked_road">Blocked Roads Only</option>
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />

        {/* Floating Legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md border border-slate-300 p-2.5 rounded-lg shadow-md text-[11px] space-y-1.5 hidden sm:block">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">Map Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
            <span>Critical Incident / Active SOS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>High Priority / Waterlogging</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span>Relief Camp & Food Ration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span>Hospital / Mobile Triage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
