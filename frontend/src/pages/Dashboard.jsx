import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  AlertCircle, TrendingUp, Users, MapPin, Activity, ShieldAlert, Clock, ChevronRight,
  Zap, Bot, Sparkles
} from 'lucide-react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import { useAIChat } from '../components/AIChatContext';
import locationDataService from '../services/locationDataService';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { setAnalysisContext } = useAIChat();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const dashboardData = await API.getDashboardOverview();
        if (dashboardData && dashboardData.success) {
          setDashboard(dashboardData.dashboard);
          setAnalysisContext(dashboardData.dashboard);
        }
        const statsData = await API.getStatistics(30);
        if (statsData && statsData.success) {
          setStats(statsData);
        }
        const locData = await locationDataService.getLocationData(28.6139, 77.209, 5);
        setLocationData(locData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [setAnalysisContext]);

  const COLORS = { minor: '#10b981', moderate: '#f59e0b', severe: '#ef4444' };
  const severityData = dashboard?.statistics?.by_severity
    ? Object.entries(dashboard.statistics.by_severity).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value,
        fill: COLORS[name] || '#666'
      })) : [];

  const typeData = dashboard?.statistics?.by_type
    ? Object.entries(dashboard.statistics.by_type).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value
      })) : [];

  const costTrendData = stats?.daily_distribution
    ? Object.entries(stats.daily_distribution).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reports: count,
        cost: (stats.cost_analysis?.average ?? 0) * count
      })) : [];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background Image - Always Present */}
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `url(${process.env.PUBLIC_URL + '/dashboard.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        filter: 'brightness(0.5) contrast(1.1)',
      }}></div>

      {loading ? (
        <div className="relative z-10 min-h-screen flex flex-col justify-center items-center backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 w-24 h-24 border-2 border-transparent border-t-orange-500 border-r-orange-500/50 rounded-full animate-spin"></div>
            <div className="absolute inset-2 w-20 h-20 border-2 border-transparent border-b-blue-500 border-l-blue-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
            <div className="absolute inset-6 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">RoadGuard Initializing</p>
            <p className="text-slate-400 mt-2 text-sm">Analyzing Infrastructure Data...</p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 space-y-12 w-full px-4 lg:px-8 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-12 border border-slate-800/50 shadow-2xl">
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
                  <Activity size={14} className="text-orange-500" />
                  <span className="text-sm font-black text-orange-500 uppercase tracking-[0.3em]">Live Intelligence Stream</span>
                </div>
                <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.85]">
                  COMMAND <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">CENTER</span>
                </h1>
                <p className="text-slate-400 text-2xl leading-relaxed font-medium">
                  Real-time infrastructure monitoring across India. Analyzing structural integrity, 
                  detecting anomalies via YOLOv8, and coordinating rapid response logistics.
                </p>
              </div>
              <div className="flex flex-wrap gap-6">
                <QuickStat label="Active Units" value={dashboard?.active_contractors || 0} icon={<Users size={20} />} />
                <QuickStat label="Live Alerts" value={dashboard?.pending_alerts || 0} icon={<AlertCircle size={20} />} />
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-6 group">
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 p-4 rounded-2xl border border-orange-500/30">
                <Sparkles className="text-orange-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">AI Strategic Briefing</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-3xl">
                  Analyzing current infrastructure telemetry: Risk state is {dashboard?.pending_alerts > 5 ? 'heightened' : 'nominal'} with {dashboard?.statistics?.total_reports || 0} incidents.
                </p>
              </div>
              <button onClick={() => setAnalysisContext(dashboard?.statistics)} className="px-6 py-3 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center gap-2">
                Explain Trends <Bot size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetricCard icon={<ShieldAlert className="w-8 h-8" />} label="Total Incidents" value={dashboard?.statistics?.total_reports || 0} trend="+12% from last cycle" color="from-orange-500 to-orange-600" shadow="shadow-orange-500/20" />
            <MetricCard icon={<TrendingUp className="w-8 h-8" />} label="Projected Impact" value={`₹${(dashboard?.statistics?.total_estimated_cost / 1000).toFixed(1)}k`} trend="Economic valuation" color="from-blue-500 to-blue-600" shadow="shadow-blue-500/20" />
            <MetricCard icon={<Activity className="w-8 h-8" />} label="Response Velocity" value={`${dashboard?.statistics?.avg_response_time || 0}h`} trend="Target: 2.0h" color="from-emerald-500 to-emerald-600" shadow="shadow-emerald-500/20" />
            <MetricCard icon={<Zap className="w-8 h-8" />} label="Network Efficiency" value={`${((dashboard?.statistics?.on_time_completion_rate || 0) * 100).toFixed(0)}%`} trend="On-time resolution" color="from-purple-500 to-purple-600" shadow="shadow-purple-500/20" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className="xl:col-span-8 bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 border border-slate-800/50 shadow-2xl relative overflow-hidden group">
              <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight mb-8">
                <TrendingUp className="w-8 h-8 text-orange-500" /> Economic Impact Trend
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costTrendData}>
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '20px' }} />
                    <Area type="monotone" dataKey="cost" stroke="#f97316" fill="#f9731633" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="xl:col-span-4 bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 border border-slate-800/50 shadow-2xl">
              <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight mb-8">
                <ShieldAlert className="w-8 h-8 text-rose-500" /> Risk Profile
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={severityData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                      {severityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 border border-slate-800/50 shadow-2xl">
              <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight mb-8">
                <MapPin className="w-8 h-8 text-blue-500" /> Asset Categories
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={typeData}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#64748b" axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-10 border border-slate-800/50 shadow-2xl flex flex-col">
              <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight mb-8">
                <Clock className="w-8 h-8 text-orange-500" /> Live Analysis
              </h3>
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-4">
                {dashboard?.recent_reports?.map((report) => (
                  <div key={report.id} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold capitalize">{report.damage_type.replace('_', ' ')}</p>
                      <p className="text-slate-500 text-xs">ID: {report.id}</p>
                    </div>
                    <p className="text-orange-500 font-black">₹{report.total_cost.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickStat = ({ label, value, icon }) => (
  <div className="flex items-center gap-4 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
    <div className="p-3 bg-slate-900 rounded-xl text-slate-400">{icon}</div>
    <div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  </div>
);

const MetricCard = ({ icon, label, value, trend, color, shadow }) => (
  <div className={`bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl ${shadow}`}>
    <div className="flex items-start justify-between">
      <div className={`bg-gradient-to-br ${color} p-4 rounded-2xl text-white`}>{icon}</div>
      <div className="text-right">
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
        <p className="text-[10px] font-black mt-3 uppercase text-slate-400 tracking-wider">{trend}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
