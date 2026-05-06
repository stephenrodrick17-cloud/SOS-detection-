import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Folder, Search, ExternalLink, Activity, Zap } from 'lucide-react';
import API from '../services/api';

const DatasetsPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveImages, setArchiveImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await API.getDatasetsOverview();
        setOverview(data);
      } catch (error) {
        console.error('Error fetching datasets overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const handleArchiveClick = async (archiveName) => {
    setSelectedArchive(archiveName);
    setImagesLoading(true);
    setSelectedCategory('All');
    try {
      const images = await API.getArchiveImages(archiveName);
      setArchiveImages(images);
    } catch (error) {
      console.error(`Error fetching images for ${archiveName}:`, error);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleCategoryFilter = async (category) => {
    setSelectedCategory(category);
    setImagesLoading(true);
    try {
      const images = await API.getArchiveImages(selectedArchive, category === 'All' ? null : category);
      setArchiveImages(images);
    } catch (error) {
      console.error(`Error filtering images:`, error);
    } finally {
      setImagesLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    // Sanitize path to prevent directory traversal
    const sanitized = path.replace(/\.\.\//g, '').replace(/^\//g, '');
    return `/static/${sanitized}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Mounting Data Volumes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              Neural <span className="text-orange-500">Datasets</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Exploration terminal for raw and labeled infrastructure health training data.
            </p>
          </div>
          
          <div className="flex gap-4">
            <MetricBox icon={<ImageIcon size={18} />} label="Total Samples" value={overview?.total_images?.toLocaleString()} />
            <MetricBox icon={<Folder size={18} />} label="Data Nodes" value={overview?.archives?.length} />
          </div>
        </div>
      </div>

      {/* Archives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {overview?.archives?.map((archive) => (
          <div 
            key={archive.name}
            onClick={() => handleArchiveClick(archive.name)}
            className={`cursor-pointer group relative bg-slate-900 rounded-3xl overflow-hidden border transition-all duration-500 ${
              selectedArchive === archive.name 
                ? 'border-orange-500 shadow-orange-500/10 ring-1 ring-orange-500/50' 
                : 'border-slate-800 hover:border-slate-700 hover:-translate-y-1'
            }`}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl transition-colors duration-500 ${selectedArchive === archive.name ? 'bg-orange-500 text-white' : 'bg-slate-800 text-orange-500 group-hover:bg-slate-700'}`}>
                  <Folder size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
                  {archive.total_images} Samples
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight group-hover:text-orange-500 transition-colors">{archive.name}</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {archive.categories.slice(0, 3).map(cat => (
                  <span key={cat} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-800 text-slate-400 rounded-md border border-slate-700/50">
                    {cat}
                  </span>
                ))}
                {archive.categories.length > 3 && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-800 text-slate-500 rounded-md border border-slate-700/50">
                    +{archive.categories.length - 3}
                  </span>
                )}
              </div>
            </div>
            
            {/* Sample Images Preview */}
            <div className="grid grid-cols-5 h-16 border-t border-slate-800 bg-slate-950">
              {archive.sample_images.slice(0, 5).map((img, idx) => (
                <div key={idx} className="border-r border-slate-800 last:border-0 overflow-hidden">
                  <img 
                    src={getImageUrl(img.path)} 
                    alt={img.filename} 
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail View */}
      {selectedArchive && (
        <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700 group hover:border-slate-700 transition-colors">
          <div className="p-8 border-b border-slate-800 bg-slate-950/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {selectedArchive}
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Node Index: {archiveImages.length} results</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
              <CategoryFilterButton active={selectedCategory === 'All'} onClick={() => handleCategoryFilter('All')} label="All Clusters" />
              {overview.archives.find(a => a.name === selectedArchive)?.categories.map(cat => (
                <CategoryFilterButton 
                  key={cat}
                  active={selectedCategory === cat} 
                  onClick={() => handleCategoryFilter(cat)} 
                  label={cat} 
                />
              ))}
            </div>
          </div>

          <div className="p-8">
            {imagesLoading ? (
              <div className="flex justify-center py-32">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 border-2 border-orange-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {archiveImages.map((img) => (
                  <div key={img.id} className="group/item bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all duration-500">
                    <div className="aspect-square bg-slate-900 relative overflow-hidden">
                      <img 
                        src={getImageUrl(img.path)} 
                        alt={img.filename} 
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700 grayscale-[0.5] group-hover/item:grayscale-0"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                          const icon = document.createElement('div');
                          icon.className = 'text-slate-800';
                          icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                          e.target.parentElement.appendChild(icon);
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={getImageUrl(img.path)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white text-slate-950 p-2.5 rounded-xl shadow-xl transform translate-y-4 group-hover/item:translate-y-0 transition-all duration-500"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                      <div className="text-[9px] font-black text-orange-500 uppercase truncate mb-1 tracking-widest">
                        {img.category}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">
                        {img.filename}
                      </div>
                    </div>
                  </div>
                ))}
                {archiveImages.length === 0 && (
                  <div className="col-span-full py-32 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto border border-slate-700 shadow-xl">
                      <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Null Data Response</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Category Stats */}
      {!selectedArchive && (
        <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-2xl">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <Zap size={14} className="text-orange-500" />
            Class Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Object.entries(overview?.categories || {}).map(([cat, count]) => (
              <div key={cat} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="text-slate-500 text-[10px] font-black uppercase mb-2 truncate tracking-widest">{cat}</div>
                <div className="text-2xl font-black text-white mb-3">{count}</div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full rounded-full" 
                    style={{ width: `${(count / overview.total_images) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricBox = ({ icon, label, value }) => (
  <div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-inner">
    <div className="text-orange-500 bg-orange-500/5 p-2 rounded-lg">{icon}</div>
    <div>
      <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{label}</div>
      <div className="text-xl font-black text-white tracking-tight">{value}</div>
    </div>
  </div>
);

const CategoryFilterButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
      active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-900'
    }`}
  >
    {label}
  </button>
);

export default DatasetsPage;
