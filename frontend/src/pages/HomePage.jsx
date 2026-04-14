import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Zap, 
  Globe, 
  Camera, 
  Map as MapIcon, 
  ChevronRight, 
  Users,
  Database,
  Shield,
  Bell
} from 'lucide-react';

const HomePage = () => {
  return (
    <div className="relative -mt-20">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center py-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-500">Next-Gen Infrastructure Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            PIONEERING <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500">URBAN SAFETY</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploying advanced YOLOv8 AI to monitor, analyze, and secure road infrastructure in real-time across the Indian subcontinent.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/detect" className="group inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wide text-sm hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25">
              Initialize Scanner <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/map" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-800 hover:border-slate-600 transition-all">
              Live Tactical Map
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex justify-center pt-2">
            <div className="w-1 h-2 bg-slate-500 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900/50 backdrop-blur-sm border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatBox label="AI Precision" value="99.2%" icon={<Zap size={24} className="text-orange-500" />} />
            <StatBox label="Regions Active" value="28+" icon={<Globe size={24} className="text-blue-500" />} />
            <StatBox label="Response Time" value="2.4h" icon={<Activity size={24} className="text-emerald-500" />} />
            <StatBox label="Data Points" value="1.2M" icon={<Database size={24} className="text-purple-500" />} />
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
            <FeatureCard 
              icon={<Camera size={40} />}
              title="AI Visual Analytics"
              description="State-of-the-art YOLOv8 neural networks for real-time pothole and crack identification with sub-pixel accuracy."
              link="/detect"
            />
            <FeatureCard 
              icon={<MapIcon size={40} />}
              title="Geospatial Mapping"
              description="Dynamic GIS integration for visualizing damage clusters across major Indian cities and national highways."
              link="/map"
            />
            <FeatureCard 
              icon={<Users size={40} />}
              title="Dispatch Control"
              description="Automated contractor matching and rapid response dispatching based on proximity, rating, and specialization."
              link="/contractors"
            />
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
              Deploy the RoadGuard Command Center to your municipal or private network today.
            </p>
            <Link to="/dashboard" className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-orange-500 hover:text-white transition-all shadow-lg">
              Enter Dashboard <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 px-6 lg:px-8 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4 block">What We Offer</span>
            <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight">COMPREHENSIVE SOLUTIONS</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard icon={<Shield size={28} />} title="Damage Detection" desc="AI-powered visual analysis for infrastructure anomalies" />
            <ServiceCard icon={<Bell size={28} />} title="Smart Alerts" desc="Real-time notifications to contractors and authorities" />
            <ServiceCard icon={<MapIcon size={28} />} title="Map Visualization" desc="Interactive damage maps with cluster analysis" />
            <ServiceCard icon={<Activity size={28} />} title="Analytics Dashboard" desc="Comprehensive statistics and trend analysis" />
          </div>
        </div>
      </section>
    </div>
  );
};

const StatBox = ({ label, value, icon }) => (
  <div className="text-center group">
    <div className="flex justify-center mb-4">{icon}</div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, description, link }) => (
  <Link to={link} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-900 hover:border-orange-500/50 transition-all duration-300 group block">
    <div className="text-orange-500 mb-6 transition-transform group-hover:scale-110">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed mb-4">
      {description}
    </p>
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500 group-hover:gap-3 transition-all">
      Learn More <ChevronRight size={14} />
    </div>
  </Link>
);

const ServiceCard = ({ icon, title, desc }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-center hover:bg-slate-900/80 transition-all">
    <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 rounded-xl mb-4 text-orange-500">
      {icon}
    </div>
    <h4 className="text-white font-bold mb-2">{title}</h4>
    <p className="text-slate-500 text-sm">{desc}</p>
  </div>
);

export default HomePage;
