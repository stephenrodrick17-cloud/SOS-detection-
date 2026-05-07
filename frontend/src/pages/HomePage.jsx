import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, Zap, Globe, Camera, MapIcon, ChevronRight, Users,
  Database, Shield, Bell, ArrowRight, Sparkles, Target, Gauge, Radio, Stethoscope
} from 'lucide-react';
import API from '../services/api';
import locationDataService from '../services/locationDataService';

const HomePage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await API.getDashboardOverview();
        if (data?.success) setDashboard(data.dashboard);
        const locData = await locationDataService.getLocationData(28.6139, 77.209, 5);
        setLocationData(locData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="relative">
      {/* Global Background Image (Covers entire page) */}
      <div 
        className="fixed inset-0 z-[-1]"
        style={{
          backgroundImage: `url('/hero-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'brightness(0.2) contrast(1.1) saturate(0.8)',
        }}
      ></div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950 z-[0]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        </div>

        <div className="absolute inset-0 opacity-10 z-[0]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center py-32">
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
            <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">AI-Powered Infrastructure Monitoring</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-6 drop-shadow-2xl">
            INTELLIGENT <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
              ROAD INFRASTRUCTURE CONTROL
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed font-medium drop-shadow-lg">
            RoadGuard combines YOLOv8 AI, real-time location intelligence, and emergency coordination to create 
            the most advanced infrastructure monitoring system in India.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/detect" className="btn-primary flex items-center justify-center gap-3 group">
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Start Detection
            </Link>
            <Link to="/dashboard" className="btn-secondary flex items-center justify-center gap-3">
              View Dashboard <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-800 mt-12">
            <div className="text-center">
              <p className="text-4xl font-black text-orange-500">{dashboard?.statistics?.total_reports || '0'}</p>
              <p className="text-slate-400 text-sm mt-2">Issues Detected</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-blue-500">₹{((dashboard?.statistics?.total_estimated_cost || 0) / 100000).toFixed(1)}L</p>
              <p className="text-slate-400 text-sm mt-2">Economic Impact</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-emerald-500">{(locationData?.hospitals?.length || 0) + (locationData?.police_stations?.length || 0)}</p>
              <p className="text-slate-400 text-sm mt-2">Integrated Services</p>
            </div>
          </div>
        </div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex justify-center pt-2">
            <div className="w-1 h-2 bg-slate-500 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900/50 backdrop-blur-sm border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex justify-center mb-4">
                <Zap size={24} className="text-orange-500" />
              </motion.div>
              <div className="text-3xl font-bold text-white mb-1">99.2%</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">AI Precision</div>
            </div>
            <div className="text-center group">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex justify-center mb-4">
                <Globe size={24} className="text-blue-500" />
              </motion.div>
              <div className="text-3xl font-bold text-white mb-1">28+</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Regions Active</div>
            </div>
            <div className="text-center group">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex justify-center mb-4">
                <Activity size={24} className="text-emerald-500" />
              </motion.div>
              <div className="text-3xl font-bold text-white mb-1">2.4h</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Response Time</div>
            </div>
            <div className="text-center group">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex justify-center mb-4">
                <Database size={24} className="text-purple-500" />
              </motion.div>
              <div className="text-3xl font-bold text-white mb-1">1.2M</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Data Points</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4 block">Core Capabilities</span>
            <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight">INTELLIGENT MONITORING</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -10 }} className="group">
              <Link to="/detect" className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-900 hover:border-orange-500/50 transition-all duration-300 block h-full">
                <motion.div className="text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                  <Camera size={40} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">AI Visual Analytics</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">YOLOv8 neural networks for real-time pothole and crack identification</p>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500 group-hover:gap-3 transition-all">
                  Learn More <ChevronRight size={14} />
                </div>
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ y: -10 }} className="group">
              <Link to="/map" className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-900 hover:border-orange-500/50 transition-all duration-300 block h-full">
                <motion.div className="text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                  <MapIcon size={40} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">Location Intelligence</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">Real-time mapping with hospitals, police stations, and priority roads</p>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500 group-hover:gap-3 transition-all">
                  Learn More <ChevronRight size={14} />
                </div>
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ y: -10 }} className="group">
              <Link to="/contractors" className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-900 hover:border-orange-500/50 transition-all duration-300 block h-full">
                <motion.div className="text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                  <Users size={40} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">Dispatch Control</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">Automated contractor matching and rapid emergency response</p>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500 group-hover:gap-3 transition-all">
                  Learn More <ChevronRight size={14} />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-6 lg:px-8 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4 block">What We Offer</span>
            <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight">COMPREHENSIVE SOLUTIONS</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-center hover:bg-slate-900/80 transition-all">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 rounded-xl mb-4 text-orange-500">
                <Shield size={28} />
              </motion.div>
              <h4 className="text-white font-bold mb-2">Damage Detection</h4>
              <p className="text-slate-500 text-sm">AI-powered visual analysis</p>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-center hover:bg-slate-900/80 transition-all">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 rounded-xl mb-4 text-orange-500">
                <MapIcon size={28} />
              </motion.div>
              <h4 className="text-white font-bold mb-2">Map Visualization</h4>
              <p className="text-slate-500 text-sm">Interactive damage mapping</p>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-center hover:bg-slate-900/80 transition-all">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 rounded-xl mb-4 text-orange-500">
                <Stethoscope size={28} />
              </motion.div>
              <h4 className="text-white font-bold mb-2">Emergency Coordination</h4>
              <p className="text-slate-500 text-sm">Integrated hospital & police services</p>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-center hover:bg-slate-900/80 transition-all">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 rounded-xl mb-4 text-orange-500">
                <Target size={28} />
              </motion.div>
              <h4 className="text-white font-bold mb-2">Cost Analysis</h4>
              <p className="text-slate-500 text-sm">AI-powered repair estimation</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 p-10 lg:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          
          <div className="relative z-10 text-center">
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-6 leading-tight">
              READY TO SECURE YOUR <span className="text-orange-500">INFRASTRUCTURE?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              Deploy the RoadGuard Command Center to your network today.
            </p>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link to="/dashboard" className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-orange-500 hover:text-white transition-all shadow-lg">
                Enter Dashboard <ChevronRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
