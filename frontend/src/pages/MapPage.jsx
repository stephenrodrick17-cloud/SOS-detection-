import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, AlertTriangle, Zap, AlertCircle, Filter, 
  RefreshCw, Wifi, ChevronRight, TrendingUp, Info, 
  Layers, Navigation, MousePointer2, Clock, CheckCircle2,
  Maximize2, X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import API from '../services/api';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for different categories
const createCustomIcon = (color) => new L.DivIcon({
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}88;"></div>`,
  className: 'custom-div-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const icons = {
  cracks: createCustomIcon('#ff6b6b'),
  cleanliness: createCustomIcon('#ffd93d'),
  parking: createCustomIcon('#6bcf7f'),
  services: createCustomIcon('#4ecdc4')
};

const MapPage = () => {
  const [cracks, setCracks] = useState([]);
  const [cleanliness, setCleanliness] = useState([]);
  const [parking, setParking] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [mapMode, setMapMode] = useState('standard'); // standard, heatmap
  const [selectedLayer, setSelectedLayer] = useState({
    cracks: true,
    cleanliness: true,
    parking: true,
    services: true
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [cracksRes, cleanRes, parkRes, servRes, statsRes] = await Promise.all([
        API.get('/datasets/cracks'),
        API.get('/datasets/cleanliness'),
        API.get('/datasets/parking'),
        API.get('/datasets/services?latitude=28.6139&longitude=77.2090'),
        API.get('/datasets/overview')
      ]);
      
      setCracks(Array.isArray(cracksRes) ? cracksRes : cracksRes.data || []);
      setCleanliness(Array.isArray(cleanRes) ? cleanRes : cleanRes.data || []);
      setParking(Array.isArray(parkRes) ? parkRes : parkRes.data || []);
      setServices(Array.isArray(servRes) ? servRes : servRes.data || []);
      setStats(statsRes || {});
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const toggleLayer = (layer) => {
    setSelectedLayer(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const mapCenter = [28.6139, 77.2090]; // Delhi Center

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-8 text-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20">
                <Layers className="text-white w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Geospatial Intelligence</h1>
            </div>
            <p className="text-slate-400 font-medium">Monitoring Delhi's infrastructure in real-time</p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setMapMode('standard')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mapMode === 'standard' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Standard
              </button>
              <button 
                onClick={() => setMapMode('heatmap')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mapMode === 'heatmap' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Heatmap
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchAllData}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> 
              {loading ? 'Syncing...' : 'Sync Live Data'}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Map Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-9"
          >
            <div className="relative h-[650px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
              <MapContainer 
                center={mapCenter} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                <ZoomControl position="bottomright" />

                {/* Markers Layer */}
                {mapMode === 'standard' && (
                  <>
                    {selectedLayer.cracks && cracks.map(c => (
                      <Marker 
                        key={c.id} 
                        position={[c.latitude, c.longitude]} 
                        icon={icons.cracks}
                        eventHandlers={{ click: () => setSelectedIssue({ ...c, category: 'Crack' }) }}
                      >
                        <Popup className="dark-popup">
                          <div className="p-1">
                            <h4 className="font-bold text-slate-900">{c.type}</h4>
                            <p className="text-xs text-slate-600 mb-2">{c.location}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                              c.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {c.severity}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {selectedLayer.cleanliness && cleanliness.map(cl => (
                      <Marker 
                        key={cl.id} 
                        position={[cl.latitude, cl.longitude]} 
                        icon={icons.cleanliness}
                        eventHandlers={{ click: () => setSelectedIssue({ ...cl, category: 'Cleanliness' }) }}
                      />
                    ))}

                    {selectedLayer.parking && parking.map(p => (
                      <Marker 
                        key={p.id} 
                        position={[p.latitude, p.longitude]} 
                        icon={icons.parking}
                        eventHandlers={{ click: () => setSelectedIssue({ ...p, category: 'Parking' }) }}
                      />
                    ))}

                    {selectedLayer.services && services.map(s => (
                      <Marker 
                        key={s.id} 
                        position={[s.latitude, s.longitude]} 
                        icon={icons.services}
                        eventHandlers={{ click: () => setSelectedIssue({ ...s, category: 'Service' }) }}
                      />
                    ))}
                  </>
                )}

                {/* Heatmap Simulation using CircleMarkers */}
                {mapMode === 'heatmap' && (
                  <>
                    {selectedLayer.cracks && cracks.map(c => (
                      <CircleMarker 
                        key={c.id}
                        center={[c.latitude, c.longitude]}
                        radius={20}
                        pathOptions={{ 
                          fillColor: '#ff6b6b', 
                          color: '#ff6b6b', 
                          fillOpacity: 0.1, 
                          weight: 0 
                        }}
                      />
                    ))}
                    {selectedLayer.cleanliness && cleanliness.map(cl => (
                      <CircleMarker 
                        key={cl.id}
                        center={[cl.latitude, cl.longitude]}
                        radius={15}
                        pathOptions={{ 
                          fillColor: '#ffd93d', 
                          color: '#ffd93d', 
                          fillOpacity: 0.1, 
                          weight: 0 
                        }}
                      />
                    ))}
                  </>
                )}
              </MapContainer>

              {/* Map Overlays */}
              <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
                <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="text-orange-500 w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Map Legend</span>
                  </div>
                  <div className="space-y-2">
                    <LegendItem color="#ff6b6b" label="Road Cracks" count={cracks.length} />
                    <LegendItem color="#ffd93d" label="Sanitation Issues" count={cleanliness.length} />
                    <LegendItem color="#6bcf7f" label="Active Parking" count={parking.length} />
                    <LegendItem color="#4ecdc4" label="Road Services" count={services.length} />
                  </div>
                </div>
              </div>

              {/* Selected Issue Detail (Overlay) */}
              <AnimatePresence>
                {selectedIssue && (
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="absolute top-6 right-6 bottom-6 w-80 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-6 overflow-y-auto"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-2 rounded-xl ${
                        selectedIssue.category === 'Crack' ? 'bg-red-500/20 text-red-400' :
                        selectedIssue.category === 'Cleanliness' ? 'bg-yellow-500/20 text-yellow-400' :
                        selectedIssue.category === 'Parking' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {selectedIssue.category === 'Crack' ? <AlertTriangle /> :
                         selectedIssue.category === 'Cleanliness' ? <AlertCircle /> :
                         selectedIssue.category === 'Parking' ? <MapPin /> : <Zap />}
                      </div>
                      <button onClick={() => setSelectedIssue(null)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-white mb-1">
                      {selectedIssue.type || selectedIssue.issue_type || selectedIssue.service_type || 'Infrastructure Detail'}
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">{selectedIssue.location}</p>

                    <div className="space-y-4">
                      <DetailRow icon={<Clock size={16} />} label="Detected At" value={new Date(selectedIssue.detected_at || selectedIssue.reported_at || selectedIssue.updated_at).toLocaleString()} />
                      
                      {selectedIssue.severity && (
                        <DetailRow 
                          icon={<AlertCircle size={16} />} 
                          label="Severity" 
                          value={selectedIssue.severity}
                          color={selectedIssue.severity === 'critical' ? 'text-red-400' : 'text-orange-400'}
                        />
                      )}

                      {selectedIssue.status && (
                        <DetailRow 
                          icon={<CheckCircle2 size={16} />} 
                          label="Status" 
                          value={selectedIssue.status}
                          color={selectedIssue.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'}
                        />
                      )}

                      {selectedIssue.available_spaces !== undefined && (
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                          <p className="text-xs text-slate-500 mb-1 uppercase font-bold">Capacity</p>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-white">{selectedIssue.available_spaces}</span>
                            <span className="text-slate-400 mb-1">/ {selectedIssue.total_spaces} available</span>
                          </div>
                        </div>
                      )}

                      {selectedIssue.rating && (
                        <DetailRow icon={<TrendingUp size={16} />} label="Service Rating" value={`${selectedIssue.rating} / 5.0`} />
                      )}
                    </div>

                    <div className="mt-8 space-y-3">
                      <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                        <Navigation size={18} /> Get Directions
                      </button>
                      <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-slate-700">
                        View Detailed Report
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {loading && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-black tracking-widest uppercase text-xs">Synchronizing Intel...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Controls & Insights Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Layer Control */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-white font-black mb-4 flex items-center gap-2">
                <Filter size={18} className="text-orange-500" />
                Data Filtering
              </h3>
              <div className="space-y-3">
                <FilterToggle 
                  active={selectedLayer.cracks} 
                  onClick={() => toggleLayer('cracks')}
                  label="Road Cracks"
                  color="#ff6b6b"
                />
                <FilterToggle 
                  active={selectedLayer.cleanliness} 
                  onClick={() => toggleLayer('cleanliness')}
                  label="Sanitation"
                  color="#ffd93d"
                />
                <FilterToggle 
                  active={selectedLayer.parking} 
                  onClick={() => toggleLayer('parking')}
                  label="Parking Lots"
                  color="#6bcf7f"
                />
                <FilterToggle 
                  active={selectedLayer.services} 
                  onClick={() => toggleLayer('services')}
                  label="Public Services"
                  color="#4ecdc4"
                />
              </div>
            </motion.div>

            {/* Quick Summary Card */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 shadow-xl shadow-orange-500/20 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-lg">Safety Alert</h4>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                    <AlertCircle size={20} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Critical Zones</p>
                    <p className="text-3xl font-black">{stats.cracks?.critical || 0}</p>
                  </div>
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      className="h-full bg-white"
                    />
                  </div>
                  <p className="text-xs text-orange-100 leading-relaxed font-medium">
                    Critical damage detected in Sector 5 and Okhla Industrial Area. Dispatch teams notified.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Status Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-white font-black mb-4 flex items-center gap-2">
                <Clock size={18} className="text-blue-400" />
                Recent Events
              </h3>
              <div className="space-y-4">
                <TimelineItem time="2m ago" label="New crack detected" sub="Connaught Place" color="bg-red-500" />
                <TimelineItem time="15m ago" label="Contractor assigned" sub="Team A -> Okhla" color="bg-orange-500" />
                <TimelineItem time="1h ago" label="Issue resolved" sub="Pothole fixed @ Sector 12" color="bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const LegendItem = ({ color, label, count }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-2">
      <div style={{ backgroundColor: color }} className="w-2.5 h-2.5 rounded-full" />
      <span className="text-xs font-bold text-slate-300">{label}</span>
    </div>
    <span className="text-[10px] font-black text-slate-500">{count}</span>
  </div>
);

const FilterToggle = ({ active, onClick, label, color }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${
      active ? 'bg-slate-800 border-slate-700' : 'bg-transparent border-slate-800 opacity-40'
    }`}
  >
    <div className="flex items-center gap-3">
      <div style={{ backgroundColor: active ? color : '#475569' }} className="w-2 h-2 rounded-full" />
      <span className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
    </div>
    {active && <MousePointer2 size={14} className="text-slate-600" />}
  </button>
);

const DetailRow = ({ icon, label, value, color = 'text-white' }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
    <div className="flex items-center gap-2 text-slate-500">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-sm font-black ${color}`}>{value}</span>
  </div>
);

const TimelineItem = ({ time, label, sub, color }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-2 h-2 rounded-full ${color} mt-1.5`} />
      <div className="w-0.5 h-full bg-slate-800" />
    </div>
    <div className="pb-4">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">{time}</p>
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  </div>
);

export default MapPage;
