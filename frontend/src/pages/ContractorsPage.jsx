import React, { useEffect, useState } from 'react';
import { Star, MapPin, Award, Shield, Briefcase, Zap } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-toastify';

const ContractorsPage = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredType, setFilteredType] = useState('all');

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const data = await API.getContractors();
        setContractors(data.contractors || []);
      } catch (error) {
        toast.error('Failed to load contractors');
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
    
    // Real-time polling: Refresh contractors availability every 20 seconds
    const interval = setInterval(fetchContractors, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = (contractor) => {
    toast.success(`Dispatch initialized for ${contractor.name}. Rapid response unit is being notified.`);
    // In a real app, this would call an API to assign the job
  };

  const filtered = filteredType === 'all'
    ? contractors
    : contractors.filter(c => c.specialization === filteredType);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Scanning Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Context */}
      <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-12 border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4 leading-none">
              VERIFIED <span className="text-orange-500">CONTRACTORS</span>
            </h1>
            <p className="text-slate-400 text-2xl font-medium leading-relaxed">
              Neural directory of certified infrastructure specialists and 
              rapid response repair units across the Indian subcontinent.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-inner">
              <FilterButton active={filteredType === 'all'} onClick={() => setFilteredType('all')} label="All Units" />
              <FilterButton active={filteredType === 'structural'} onClick={() => setFilteredType('structural')} label="Structural" />
              <FilterButton active={filteredType === 'pothole_repair'} onClick={() => setFilteredType('pothole_repair')} label="Pothole" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((contractor) => (
          <ContractorCard key={contractor.id} contractor={contractor} onDispatch={() => handleDispatch(contractor)} />
        ))}
      </div>
    </div>
  );
};

const FilterButton = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
      active 
        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' 
        : 'text-slate-500 hover:text-white hover:bg-slate-900'
    }`}
  >
    {label}
  </button>
);

const ContractorCard = ({ contractor, onDispatch }) => {
  const specializations = {
    pothole_repair: 'Pothole Specialist',
    crack_sealing: 'Crack Sealing Unit',
    structural: 'Structural Engineer',
    general: 'General Maintenance'
  };

  const isAvailable = contractor.current_jobs < contractor.max_jobs;

  return (
    <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden group hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
      <div className="p-8 flex-1">
        <div className="flex justify-between items-start mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-orange-500 border border-slate-700 shadow-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
            <Shield size={28} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-sm">
              <Star size={14} className="fill-amber-500" />
              <span className="text-xs font-black tracking-widest">{contractor.rating}</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${isAvailable ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'}`}>
              {isAvailable ? 'Active' : 'Busy'}
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors tracking-tight">{contractor.name}</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            {specializations[contractor.specialization] || contractor.specialization}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <InfoItem icon={<MapPin size={16} />} label={contractor.city} />
          <InfoItem icon={<Award size={16} />} label={`${contractor.experience_years} Years Intelligence`} />
          <InfoItem icon={<Briefcase size={16} />} label={`${contractor.service_radius_km}km Operational Zone`} />
        </div>

        <div className="pt-6 border-t border-slate-800 mt-auto">
          <div className="flex justify-between items-center mb-2">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Neural Load</p>
            <span className="text-xs font-mono text-slate-300 font-bold">{((contractor.current_jobs / contractor.max_jobs) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ${isAvailable ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-rose-500'}`}
              style={{ width: `${(contractor.current_jobs / contractor.max_jobs) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <button 
        disabled={!isAvailable}
        onClick={onDispatch}
        className={`w-full py-6 font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${
          isAvailable 
            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-2xl shadow-orange-500/20 active:scale-95' 
            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        <Zap size={16} className={isAvailable ? 'fill-white' : ''} />
        Initialize Dispatch
      </button>
    </div>
  );
};

const InfoItem = ({ icon, label }) => (
  <div className="flex items-center gap-3 text-slate-400 group/item">
    <div className="text-slate-600 group-hover/item:text-orange-500 transition-colors">{icon}</div>
    <span className="text-sm font-medium group-hover/item:text-slate-300 transition-colors">{label}</span>
  </div>
);

export default ContractorsPage;
