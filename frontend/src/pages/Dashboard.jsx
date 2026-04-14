import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { AlertCircle, TrendingUp, Users, MapPin, Activity, ShieldAlert, Clock, ChevronRight, Zap } from 'lucide-react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import { useAIChat } from '../components/AIChatContext';
import { Sparkles, Bot } from 'lucide-react';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { setAnalysisContext } = useAIChat();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await API.getDashboardOverview();
        if (data && data.success) {
          setDashboard(data.dashboard);
        }

        const statsData = await API.getStatistics(30);
        if (statsData && statsData.success) {
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    
    // Real-time polling: Refresh dashboard data every 10 seconds
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-slate-400 font-medium animate-pulse">Analyzing Infrastructure Data...</div>
      </div>
    );
  }

  const COLORS = {
    minor: '#10b981',
    moderate: '#f59e0b',
    severe: '#ef4444'
  };

  const severityData = dashboard?.statistics?.by_severity
    ? Object.entries(dashboard.statistics.by_severity).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill: COLORS[name] || '#666'
      }))
    : [];

  const typeData = dashboard?.statistics?.by_type
    ? Object.entries(dashboard.statistics.by_type).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    : [];

  const costTrendData = stats?.daily_distribution
    ? Object.entries(stats.daily_distribution).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reports: count,
        cost: (stats.cost_analysis?.average || 0) * count
      }))
    : [];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full px-4 lg:px-8 pb-20">
      {/* Dynamic Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] -mr-48 -mt-48 rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] -ml-24 -mb-24 rounded-full"></div>
        
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

        {/* AI Analysis Briefing */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-6 group">
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 p-4 rounded-2xl border border-orange-500/30">
            <Sparkles className="text-orange-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
              AI Strategic Briefing
              <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">GEMINI 2.0</span>
            </h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-3xl">
              Analyzing current infrastructure telemetry: The network shows a {dashboard?.pending_alerts > 5 ? 'heightened' : 'nominal'} risk state with {dashboard?.statistics?.total_reports || 0} active incidents. 
              Economic impact is projected at ₹{(dashboard?.statistics?.total_estimated_cost / 1000).toFixed(1)}k across {Object.keys(dashboard?.statistics?.by_type || {}).length} asset categories.
            </p>
          </div>
          <button 
            onClick={() => setAnalysisContext({
              summary: dashboard?.statistics,
              isDashboardSummary: true,
              total_reports: dashboard?.statistics?.total_reports,
              avg_response: dashboard?.statistics?.avg_response_time,
              top_damage: Object.entries(dashboard?.statistics?.by_type || {}).sort((a,b) => b[1] - a[1])[0]?.[0]
            })}
            className="px-6 py-3 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center gap-2 group-hover:scale-105"
          >
            Explain Trends <Bot size={14} />
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid - Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard 
          icon={<ShieldAlert className="w-8 h-8" />}
          label="Total Incidents"
          value={dashboard?.statistics?.total_reports || 0}
          trend="+12% from last cycle"
          color="from-orange-500 to-orange-600"
          shadow="shadow-orange-500/20"
        />
        <MetricCard 
          icon={<TrendingUp className="w-8 h-8" />}
          label="Projected Impact"
          value={`₹${(dashboard?.statistics?.total_estimated_cost / 1000).toFixed(1)}k`}
          trend="Economic valuation"
          color="from-blue-500 to-blue-600"
          shadow="shadow-blue-500/20"
        />
        <MetricCard 
          icon={<Activity className="w-8 h-8" />}
          label="Response Velocity"
          value={`${dashboard?.statistics?.avg_response_time || 0}h`}
          trend="Target: 2.0h"
          color="from-emerald-500 to-emerald-600"
          shadow="shadow-emerald-500/20"
        />
        <MetricCard 
          icon={<Zap className="w-8 h-8" />}
          label="Network Efficiency"
          value={`${((dashboard?.statistics?.on_time_completion_rate || 0) * 100).toFixed(0)}%`}
          trend="On-time resolution"
          color="from-purple-500 to-purple-600"
          shadow="shadow-purple-500/20"
        />
      </div>

      {/* Large Visualizations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Main Trend Chart - 8 cols */}
        <div className="xl:col-span-8 bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
            <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Time Horizon</div>
              <div className="text-sm font-black text-white uppercase tracking-wider">Last 30 Days</div>
            </div>
          </div>
          <div className="mb-12">
            <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              Economic Impact Trend
            </h3>
            <p className="text-slate-500 text-lg mt-2 font-medium">Projected repair costs over the analysis period</p>
          </div>
          
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costTrendData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 800}}
                  dy={15}
                  minTickGap={20}
                />
                <YAxis 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 800}}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b', 
                    borderRadius: '20px',
                    padding: '15px'
                  }} 
                />
                <Area type="monotone" dataKey="cost" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Pie Chart - 4 cols */}
        <div className="xl:col-span-4 bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl">
          <div className="mb-12">
            <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
              Risk Profile
            </h3>
            <p className="text-slate-500 text-lg mt-2 font-medium">Severity distribution</p>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b', 
                    borderRadius: '20px'
                  }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-slate-400 font-black uppercase text-xs tracking-widest ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Categories and Feed Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 pb-12">
        {/* Structural Categories */}
        <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="mb-10">
            <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
              <MapPin className="w-8 h-8 text-blue-500" />
              Asset Categories
            </h3>
            <p className="text-slate-500 text-lg mt-2 font-medium">Detections grouped by classification</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={typeData} margin={{ left: 40, right: 40 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#64748b" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{fontSize: 12, fontWeight: 900}}
                />
                <Tooltip 
                  cursor={{fill: '#1e293b', radius: 12}}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #1e293b', 
                    borderRadius: '20px'
                  }} 
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 12, 12, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-10 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                <Clock className="w-8 h-8 text-orange-500" />
                Live Analysis
              </h3>
              <p className="text-slate-500 text-lg mt-2 font-medium">Real-time telemetry stream</p>
            </div>
            <Link to="/reports" className="bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800 text-orange-500 hover:text-white hover:bg-orange-500 transition-all text-sm font-black uppercase tracking-widest flex items-center group/link">
              Full Archive
              <ChevronRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {dashboard?.recent_reports?.map((report) => (
              <div key={report.id} className="p-6 bg-slate-950/50 rounded-[2rem] border border-slate-800/50 flex items-center justify-between hover:bg-slate-800/30 transition-all duration-300 group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-xl text-white font-black capitalize tracking-tight">{report.damage_type.replace('_', ' ')}</p>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mt-1">Incident ID: {report.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl text-white font-black tracking-tight">₹{report.total_cost.toLocaleString('en-IN')}</p>
                  <p className="text-slate-500 text-sm font-bold mt-1 uppercase">{new Date(report.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};



const QuickStat = ({ label, value, icon }) => (
  <div className="flex items-center gap-4 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 hover:border-slate-700 transition-all">
    <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
      {icon}
    </div>
    <div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  </div>
);

const MetricCard = ({ icon, label, value, trend, color, shadow }) => (
  <div className={`bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl ${shadow} transition-all hover:scale-[1.02]`}>
    <div className="flex items-start justify-between">
      <div className={`bg-gradient-to-br ${color} p-5 rounded-2xl text-white shadow-lg`}>
        {icon}
      </div>
      <div className="text-right">
        <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className="text-5xl font-black text-white tracking-tighter">{value}</p>
        <p className="text-xs font-black mt-4 flex items-center justify-end uppercase tracking-[0.1em]">
          <TrendingUp className="w-4 h-4 mr-2" />
          {trend}
        </p>
      </div>
    </div>
  </div>
);



export default Dashboard;
