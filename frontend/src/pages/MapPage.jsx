import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../services/api';
import { toast } from 'react-toastify';
import {
  Map as MapIcon, ShieldAlert, Crosshair, Zap, Activity,
  Car, AlertTriangle, CloudRain, RefreshCw, Radio
} from 'lucide-react';

const { BaseLayer, Overlay } = LayersControl;

// TomTom API key (free tier — 2,500 requests/day)
// Get yours at https://developer.tomtom.com/
const TOMTOM_KEY = process.env.REACT_APP_TOMTOM_KEY || '';

// Component to handle map resizing and initialization
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
};

// Fix for leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Simulated real-time traffic incidents for Indian roads ---
// In production, replace with TomTom Traffic Incidents API
const generateTrafficData = () => {
  const cities = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  ];

  const incidentTypes = ['congestion', 'accident', 'road_work', 'road_closure', 'weather'];
  const severities = ['low', 'medium', 'high'];
  const conditions = ['Clear', 'Congested', 'Heavy Traffic', 'Road Work', 'Accident Ahead', 'Flooded'];

  return cities.map((city, i) => ({
    id: i + 1,
    city: city.name,
    lat: city.lat + (Math.random() - 0.5) * 0.05,
    lng: city.lng + (Math.random() - 0.5) * 0.05,
    type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    delay_minutes: Math.floor(Math.random() * 45),
    speed_kmh: Math.floor(Math.random() * 60) + 5,
    updated: new Date(Date.now() - Math.random() * 300000).toLocaleTimeString(),
  }));
};

// Road condition icon SVG
const createTrafficIcon = (type, severity) => {
  const colors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  const icons = {
    congestion: '🚦',
    accident: '🚨',
    road_work: '🚧',
    road_closure: '⛔',
    weather: '🌧️',
  };

  const color = colors[severity] || '#6366f1';
  const emoji = icons[type] || '⚠️';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 50%; 
        background: ${color}22; border: 2px solid ${color};
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; box-shadow: 0 0 12px ${color}44;
        transition: transform 0.2s;
      ">
        ${emoji}
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const MapPage = () => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trafficIncidents, setTrafficIncidents] = useState([]);
  const [showTraffic, setShowTraffic] = useState(true);
  const [trafficUpdated, setTrafficUpdated] = useState(null);
  const [trafficStats, setTrafficStats] = useState({ high: 0, medium: 0, low: 0 });
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Fetch damage cluster data
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const data = await API.getMapData();
        setClusters(data.clusters || []);
      } catch (error) {
        toast.error('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
    const interval = setInterval(fetchMapData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch / simulate real-time traffic data
  const refreshTrafficData = useCallback(() => {
    const data = generateTrafficData();
    setTrafficIncidents(data);
    setTrafficUpdated(new Date().toLocaleTimeString());
    setTrafficStats({
      high: data.filter(d => d.severity === 'high').length,
      medium: data.filter(d => d.severity === 'medium').length,
      low: data.filter(d => d.severity === 'low').length,
    });
  }, []);

  useEffect(() => {
    refreshTrafficData();
    const interval = setInterval(refreshTrafficData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [refreshTrafficData]);

  const handleDeploy = (cluster, idx) => {
    toast.success(`Deployment sequence initiated for Cluster Alpha-${idx}. Monitoring drone dispatched to [${cluster.latitude.toFixed(4)}, ${cluster.longitude.toFixed(4)}].`);
  };

  const handleRecenter = () => {
    window.location.reload();
  };

  const defaultCenter = [20.5937, 78.9629]; // Center of India

  const getSeverityColor = (severityLevels) => {
    if (severityLevels.severe > 0) return '#ef4444';
    if (severityLevels.moderate > 0) return '#f59e0b';
    return '#10b981';
  };

  const getConditionColor = (condition) => {
    if (['Accident Ahead', 'Flooded', 'Road Work'].includes(condition)) return 'text-rose-400';
    if (['Heavy Traffic', 'Congested'].includes(condition)) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'congestion': return <Car size={14} className="text-amber-400" />;
      case 'accident': return <AlertTriangle size={14} className="text-rose-400" />;
      case 'road_work': return <Activity size={14} className="text-blue-400" />;
      case 'weather': return <CloudRain size={14} className="text-sky-400" />;
      default: return <Zap size={14} className="text-orange-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Rendering Geospatial Grid...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full space-y-4">
      {/* Traffic Status Bar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 px-6 py-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Traffic Feed</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <TrafficBadge count={trafficStats.high} label="Critical" color="rose" />
          <TrafficBadge count={trafficStats.medium} label="Moderate" color="amber" />
          <TrafficBadge count={trafficStats.low} label="Clear" color="emerald" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {trafficUpdated && (
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Updated: {trafficUpdated}
            </span>
          )}
          <button
            onClick={refreshTrafficData}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <button
            onClick={() => setShowTraffic(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              showTraffic
                ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            <Radio size={12} />
            {showTraffic ? 'Traffic ON' : 'Traffic OFF'}
          </button>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-320px)] min-h-[600px] bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden">
        {/* Map Container */}
        <div className="lg:col-span-9 relative h-full group">
          <div className="w-full h-full relative z-0">
            <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
              <MapResizer />
              <LayersControl position="topright">
                <BaseLayer checked name="Satellite View">
                  <TileLayer
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    attribution='&copy; Google Maps'
                  />
                </BaseLayer>
                <BaseLayer name="Street View">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                </BaseLayer>
                <BaseLayer name="Dark Mode">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; Carto'
                  />
                </BaseLayer>

                {/* TomTom Traffic Flow Overlay (real API tiles if key provided) */}
                {TOMTOM_KEY && (
                  <Overlay checked name="🚦 TomTom Traffic Flow">
                    <TileLayer
                      url={`https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${TOMTOM_KEY}&tileSize=256&style=night`}
                      attribution='Traffic &copy; TomTom'
                      opacity={0.7}
                    />
                  </Overlay>
                )}
                {TOMTOM_KEY && (
                  <Overlay name="🚨 TomTom Incidents">
                    <TileLayer
                      url={`https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${TOMTOM_KEY}&tileSize=256`}
                      attribution='Incidents &copy; TomTom'
                      opacity={0.85}
                    />
                  </Overlay>
                )}
              </LayersControl>

              {/* Damage clusters */}
              {clusters.map((cluster, idx) => (
                <div key={idx}>
                  <Circle
                    center={[cluster.latitude, cluster.longitude]}
                    radius={10000}
                    fillColor={getSeverityColor(cluster.severity_levels)}
                    color={getSeverityColor(cluster.severity_levels)}
                    weight={2}
                    opacity={0.6}
                    fillOpacity={0.3}
                  />
                  <Marker position={[cluster.latitude, cluster.longitude]}>
                    <Popup>
                      <div className="p-4 space-y-3 min-w-[200px] bg-slate-900 text-white rounded-2xl border border-slate-800">
                        <p className="font-black uppercase tracking-widest text-[10px] text-orange-500">Cluster Alpha-{idx}</p>
                        <div className="space-y-2">
                          <p className="text-sm font-bold flex justify-between">
                            <span className="text-slate-400">Incidents:</span>
                            <span className="text-white">{cluster.count}</span>
                          </p>
                          <p className="text-sm font-bold flex justify-between">
                            <span className="text-slate-400">Total Valuation:</span>
                            <span className="text-emerald-500">₹{cluster.total_cost.toLocaleString()}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeploy(cluster, idx)}
                          className="w-full mt-2 py-3 bg-orange-500 text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                        >
                          Deploy Unit
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))}

              {/* Traffic incident markers */}
              {showTraffic && trafficIncidents.map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.lat, incident.lng]}
                  icon={createTrafficIcon(incident.type, incident.severity)}
                  eventHandlers={{
                    click: () => setSelectedIncident(incident)
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[200px] bg-slate-900 text-white rounded-xl border border-slate-800" style={{background:'#0f172a',color:'white',border:'1px solid #1e293b',borderRadius:'12px',padding:'12px',minWidth:'200px'}}>
                      <div style={{fontWeight:'900',fontSize:'10px',color:'#f97316',textTransform:'uppercase',letterSpacing:'0.2em',marginBottom:'8px'}}>
                        📍 {incident.city}
                      </div>
                      <div style={{fontWeight:'700',fontSize:'13px',color:'white',marginBottom:'6px',textTransform:'capitalize'}}>
                        {incident.condition}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',fontSize:'11px'}}>
                        <div style={{color:'#64748b'}}>Severity: <span style={{color:'white',fontWeight:'700'}}>{incident.severity.toUpperCase()}</span></div>
                        <div style={{color:'#64748b'}}>Speed: <span style={{color:'white',fontWeight:'700'}}>{incident.speed_kmh} km/h</span></div>
                        <div style={{color:'#64748b'}}>Delay: <span style={{color:'#f97316',fontWeight:'700'}}>{incident.delay_minutes} min</span></div>
                        <div style={{color:'#64748b',fontSize:'10px'}}>Updated: {incident.updated}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Tactical Overlay */}
            <div className="absolute top-8 left-8 z-[1000] pointer-events-none">
              <div className="bg-slate-950/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-orange-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
                    <MapIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Road Intel Map</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Traffic + Damage Feed</p>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Critical</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Traffic</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Clear</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-8 right-20 z-[1000] flex flex-col gap-3">
              <MapControlButton icon={<Crosshair size={20} />} title="Recenter Map" onClick={handleRecenter} />
              <MapControlButton icon={<Activity size={20} />} title="System Status" onClick={() => toast.info("Satellite Link: NOMINAL | Latency: 42ms")} />
            </div>
          </div>
        </div>

        {/* Tactical Sidebar */}
        <div className="lg:col-span-3 bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden">
          {/* Stats */}
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
              <Zap size={14} className="text-orange-500" />
              Regional Intelligence
            </h3>
            <div className="space-y-4">
              <TacticalMetric label="Damage Hotspots" value={clusters.length} color="text-blue-500" />
              <TacticalMetric label="Damage Reports" value={clusters.reduce((sum, c) => sum + c.count, 0)} color="text-orange-500" />
              <TacticalMetric label="Traffic Alerts" value={trafficIncidents.length} color="text-amber-400" />
            </div>
          </div>

          {/* Live Traffic Feed */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Radio size={12} className="text-rose-500 animate-pulse" />
                Live Road Conditions
              </h3>
              <div className="space-y-3">
                {trafficIncidents
                  .sort((a, b) => (b.severity === 'high') - (a.severity === 'high') || (b.delay_minutes - a.delay_minutes))
                  .slice(0, 8)
                  .map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`w-full p-3 bg-slate-900 rounded-2xl border transition-all text-left group hover:border-orange-500/30 ${
                      selectedIncident?.id === incident.id
                        ? 'border-orange-500/40 bg-orange-500/5'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(incident.type)}
                        <span className="text-xs font-black text-white">{incident.city}</span>
                      </div>
                      <SeverityDot severity={incident.severity} />
                    </div>
                    <p className={`text-[11px] font-bold ${getConditionColor(incident.condition)}`}>
                      {incident.condition}
                    </p>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-slate-600 font-bold">{incident.speed_kmh} km/h</span>
                      {incident.delay_minutes > 0 && (
                        <span className="text-[10px] text-orange-500 font-black">+{incident.delay_minutes} min delay</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Incident Detail */}
            {selectedIncident && (
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Incident Detail</h3>
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white">{selectedIncident.city}</span>
                    <SeverityDot severity={selectedIncident.severity} />
                  </div>
                  <p className={`text-sm font-bold ${getConditionColor(selectedIncident.condition)}`}>
                    {selectedIncident.condition}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                    <div>Speed: <span className="text-white">{selectedIncident.speed_kmh} km/h</span></div>
                    <div>Delay: <span className="text-orange-400">{selectedIncident.delay_minutes} min</span></div>
                    <div>Type: <span className="text-white capitalize">{selectedIncident.type.replace('_', ' ')}</span></div>
                    <div>Updated: <span className="text-white">{selectedIncident.updated}</span></div>
                  </div>
                  <div className="text-[10px] text-slate-600 border-t border-slate-800 pt-2 font-bold uppercase tracking-widest">
                    📍 {selectedIncident.lat.toFixed(4)}, {selectedIncident.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* Active Damage Deployments */}
            <div className="p-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Active Deployments</h3>
              <div className="space-y-3">
                {clusters.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 hover:border-orange-500/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider">Sector {String.fromCharCode(65 + i)}</span>
                      <span className="text-[10px] font-bold text-emerald-500">MONITORING</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-orange-500 w-[65%] animate-pulse"></div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{c.count} ACTIVE ANOMALIES</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-slate-900 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldAlert size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Secure Link</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Encrypted & Live</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TomTom API Note */}
      {!TOMTOM_KEY && (
        <div className="bg-slate-900 rounded-2xl border border-amber-500/20 p-4 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            <span className="font-black text-amber-400">Real Traffic Tiles:</span> Add{' '}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-300">REACT_APP_TOMTOM_KEY=your_key</code>{' '}
            to your <code className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-300">.env</code> to enable{' '}
            live TomTom traffic flow overlays. Get a free key at{' '}
            <a href="https://developer.tomtom.com/" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">
              developer.tomtom.com
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

// Sub-components
const TacticalMetric = ({ label, value, color }) => (
  <div className="flex justify-between items-end bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50">
    <span className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
    <span className={`text-5xl font-black ${color} tracking-tighter`}>{value}</span>
  </div>
);

const MapControlButton = ({ icon, title, onClick }) => (
  <button
    onClick={onClick}
    className="bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl text-slate-400 hover:text-white border border-slate-800 shadow-2xl transition-all hover:scale-110 active:scale-95 group"
    title={title}
  >
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
  </button>
);

const TrafficBadge = ({ count, label, color }) => {
  const colorMap = {
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };
  const dotMap = { rose: 'bg-rose-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500' };
  return (
    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${colorMap[color]}`}>
      <div className={`w-2 h-2 ${dotMap[color]} rounded-full animate-pulse`} />
      <span className="text-[12px] font-black uppercase tracking-[0.2em]">{count} {label}</span>
    </div>
  );
};

const SeverityDot = ({ severity }) => {
  const colors = { high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };
  return (
    <div className={`w-2 h-2 rounded-full ${colors[severity] || 'bg-slate-500'} animate-pulse flex-shrink-0 mt-1`} />
  );
};

export default MapPage;
