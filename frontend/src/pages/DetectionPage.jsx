import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, MapPin, AlertCircle, FileVideo, Play, Pause, RefreshCw, BarChart3, LayoutGrid, Zap, Bot, Sparkles, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../services/api';
import { useAIChat } from '../components/AIChatContext';
import { validateFile, isValidGPSCoordinates, CONSTANTS } from '../utils/constants';

const DetectionPage = () => {
  const [activeTab, setActiveTab] = useState('image'); // 'image', 'video', 'realtime'
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [roadType, setRoadType] = useState('city_street');
  
  // Shared AI context
  const { setAnalysisContext } = useAIChat();
  
  // Real-time detection states
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [realtimeDetections, setRealtimeDetections] = useState([]);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const realtimeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (realtimeTimerRef.current) {
        clearInterval(realtimeTimerRef.current);
      }
      stopWebcam();
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    // Validate file before processing
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not available');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        toast.success('Location captured');
      },
      () => {
        toast.error('Failed to get location');
      }
    );
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      toast.error(`Please select a ${activeTab}`);
      return;
    }

    // Validate GPS coordinates if provided
    if (gpsLocation) {
      if (!isValidGPSCoordinates(gpsLocation.latitude, gpsLocation.longitude)) {
        toast.error('GPS coordinates are outside valid range (India: 8°N-35°N, 68°E-97°E)');
        return;
      }
    }

    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      // Append metadata directly to FormData
      if (gpsLocation?.latitude) formData.append('latitude', gpsLocation.latitude);
      if (gpsLocation?.longitude) formData.append('longitude', gpsLocation.longitude);
      if (roadType) formData.append('road_type', roadType);

      let response;
      if (activeTab === 'image') {
        response = await API.detectDamage(formData, null);
      } else if (activeTab === 'video') {
        response = await API.detectVideo(formData);
      }

      setResult(response);

      if (activeTab === 'image') {
        if (response?.summary?.total_damage_areas > 0) {
          toast.success(`Detected ${response.summary.total_damage_areas} damage area(s)`);
          // Set AI context so chat widget can explain this result
          setAnalysisContext({
            detections: response.detections,
            summary: response.summary,
            road_type: roadType,
            location: gpsLocation,
          });
        } else {
          toast.info('No damage detected in image');
          setAnalysisContext(null);
        }
      } else {
        toast.success(`Video analysis complete: ${response?.summary?.total_detections || 0} detections found`);
      }
    } catch (error) {
      console.error('Detection error in component:', error);
      
      // Parse error message for better UX
      let errorMsg = error.message || 'Unknown error';
      
      if (errorMsg.includes('Network error')) {
        errorMsg = 'Server connection failed. Make sure backend is running at port 8000.';
      } else if (errorMsg.includes('CORS')) {
        errorMsg = 'Cross-origin request blocked. Backend CORS configuration issue.';
      } else if (errorMsg.includes('400')) {
        errorMsg = 'Invalid request format or file type not supported.';
      } else if (errorMsg.includes('500')) {
        errorMsg = 'Server processing error. Check backend logs for details.';
      }
      
      console.error('Formatted error:', errorMsg);
      toast.error(`Analysis failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    
    const summary = result.summary;
    const timestamp = new Date().toLocaleString();
    
    let reportText = `ROADGUARD AI - INFRASTRUCTURE ANALYSIS REPORT\n`;
    reportText += `==============================================\n`;
    reportText += `Date: ${timestamp}\n`;
    reportText += `Road Type: ${roadType.replace('_', ' ').toUpperCase()}\n`;
    reportText += `Location: ${gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'Manual Entry'}\n\n`;
    
    reportText += `DETECTION SUMMARY:\n`;
    reportText += `------------------\n`;
    reportText += `Total Damage Areas: ${summary.total_damage_areas || 0}\n`;
    reportText += `Estimated Repair Cost: ₹${summary.total_estimated_cost.toLocaleString()}\n`;
    reportText += `Urgency Score: ${summary.avg_confidence > 0.8 ? 'HIGH' : 'MODERATE'}\n\n`;
    
    reportText += `DETAILED FINDINGS:\n`;
    reportText += `------------------\n`;
    result.detections.forEach((d, i) => {
      reportText += `${i+1}. TYPE: ${d.damage_type.toUpperCase()}\n`;
      reportText += `   SEVERITY: ${d.severity.toUpperCase()}\n`;
      reportText += `   CONFIDENCE: ${(d.confidence * 100).toFixed(1)}%\n`;
      reportText += `   AREA IMPACT: ${d.area_percentage.toFixed(2)}%\n\n`;
    });
    
    reportText += `AI STRATEGIC RECOMMENDATION:\n`;
    reportText += `----------------------------\n`;
    reportText += `Based on the ${summary.total_damage_areas} anomalies detected, immediate surface treatment is recommended for 'severe' areas. Estimated intervention window: < 48 hours for arterial safety.\n\n`;
    reportText += `Report generated by RoadGuard AI Platform.`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RoadGuard_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Intelligence report downloaded successfully');
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast.error('Failed to access webcam');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsRealtimeActive(false);
    if (realtimeTimerRef.current) {
      clearInterval(realtimeTimerRef.current);
    }
  };

  const toggleRealtime = () => {
    if (isRealtimeActive) {
      setIsRealtimeActive(false);
      clearInterval(realtimeTimerRef.current);
    } else {
      if (!videoRef.current?.srcObject) {
        toast.error('Please start webcam first');
        return;
      }
      setIsRealtimeActive(true);
      // Process frame every 1 second
      realtimeTimerRef.current = setInterval(processCurrentFrame, 1000);
    }
  };

  const processCurrentFrame = async () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob(async (blob) => {
        const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await API.detectFrame(formData);
          if (response.success) {
            setRealtimeDetections(response.detections);
          }
        } catch (error) {
          console.error('Frame processing error:', error);
        }
      }, 'image/jpeg');
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], 'webcam_capture.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreview(imageData);
        setActiveTab('image');
        setResult(null);
      });
    }
  };

  const ResultCard = ({ icon, label, value, subValue, isCost }) => (
    <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 flex items-start gap-6 hover:border-slate-700 transition-all group">
      <div className="p-4 bg-slate-950 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-4xl font-black tracking-tighter ${isCost ? 'text-emerald-400' : 'text-white'}`}>
          {value}
        </p>
        {subValue && <p className="text-xs font-bold text-slate-600 uppercase mt-1 tracking-wider">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Visual Context */}
      <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-12 border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4 leading-none">
              AI <span className="text-orange-500">DETECTION</span>
            </h1>
            <p className="text-slate-400 text-2xl font-medium leading-relaxed">
              Upload telemetry or initialize live optical sensors to detect and 
              classify road anomalies using neural networks.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex gap-1 shadow-inner overflow-hidden">
            <button 
              onClick={() => { setActiveTab('image'); setResult(null); setSelectedFile(null); setPreview(null); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'image' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Image</span>
              </div>
            </button>
            <button 
              onClick={() => { setActiveTab('video'); setResult(null); setSelectedFile(null); setPreview(null); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'video' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4" />
                <span>Video</span>
              </div>
            </button>
            <button 
              onClick={() => { setActiveTab('realtime'); setResult(null); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'realtime' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Live AI</span>
              </div>
            </button>
          </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Input Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-slate-900 rounded-3xl p-1 border border-slate-800 shadow-2xl overflow-hidden relative min-h-[500px] group transition-all duration-500 hover:border-slate-700">
            {activeTab === 'image' || activeTab === 'video' ? (
              <div
                className={`w-full h-full rounded-[22px] text-center transition-all min-h-[500px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                  preview ? 'bg-slate-950' : 'bg-slate-900/50 border-2 border-dashed border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/20'
                }`}
                onClick={() => !preview && fileInputRef.current?.click()}
              >
                {preview ? (
                  <div className="w-full h-full relative group/preview">
                    {activeTab === 'image' ? (
                      <img src={result?.annotated_image_url || preview} alt="Preview" className="w-full h-full object-contain max-h-[600px] rounded-[20px]" />
                    ) : (
                      <video src={preview} controls className="w-full h-full object-contain max-h-[600px] rounded-[20px]" />
                    )}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 backdrop-blur-sm flex items-center justify-center rounded-[20px]">
                      <button 
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl shadow-xl shadow-orange-500/20 font-bold flex items-center gap-3 scale-95 group-hover/preview:scale-100 transition-transform"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Replace {activeTab}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in duration-500 p-12">
                    <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      {activeTab === 'image' ? <Upload className="w-10 h-10 text-orange-500" /> : <FileVideo className="w-10 h-10 text-orange-500" />}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Drop {activeTab} files here</h3>
                    <p className="text-slate-500 text-lg mb-8 font-medium">Drag and drop or click to explore files</p>
                    <div className="flex gap-3 justify-center">
                      {['PNG', 'JPG', 'MP4', 'MOV'].map(ext => (
                        <span key={ext} className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-black rounded-lg border border-slate-700 tracking-widest">{ext}</span>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={activeTab === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-[22px] overflow-hidden bg-slate-950 aspect-video group shadow-inner h-full min-h-[500px]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ display: videoRef.current?.srcObject ? 'block' : 'none' }}
                />
                <canvas ref={canvasRef} className="hidden" width="640" height="480" />
                
                {/* Real-time Overlays */}
                {isRealtimeActive && realtimeDetections.map((det, idx) => (
                  <div 
                    key={idx}
                    className="absolute border-2 border-orange-500 pointer-events-none animate-in fade-in duration-300 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                    style={{
                      left: `${det.bbox[0] * 100}%`,
                      top: `${det.bbox[1] * 100}%`,
                      width: `${(det.bbox[2] - det.bbox[0]) * 100}%`,
                      height: `${(det.bbox[3] - det.bbox[1]) * 100}%`,
                      borderRadius: '4px'
                    }}
                  >
                    <div className="absolute -top-7 left-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-2 whitespace-nowrap font-black uppercase tracking-widest shadow-lg">
                      <Zap className="w-3 h-3 fill-white" />
                      {det.damage_type} • {(det.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}

                {!videoRef.current?.srcObject && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700 shadow-xl">
                      <Camera className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Optical Sensors Offline</p>
                    <button 
                      onClick={startWebcam}
                      className="mt-8 px-8 py-3 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-colors shadow-xl"
                    >
                      INITIALIZE CAMERA
                    </button>
                  </div>
                )}

                {videoRef.current?.srcObject && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-950/80 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={toggleRealtime}
                      className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${isRealtimeActive ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-orange-500 text-white shadow-orange-500/20'}`}
                    >
                      {isRealtimeActive ? (
                        <>
                          <Pause className="w-4 h-4 fill-white" />
                          Stop Neural Link
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          Start Neural Link
                        </>
                      )}
                    </button>
                    <div className="w-px h-8 bg-white/10"></div>
                    <button 
                      onClick={captureFrame}
                      className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                      title="Capture Frame"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={stopWebcam}
                      className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                      title="Power Off"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button Section */}
          {(activeTab !== 'realtime' && selectedFile) && (
            <div className="flex gap-4 animate-in slide-in-from-bottom-6 duration-500">
              <button
                onClick={handleDetect}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-5 px-8 rounded-3xl shadow-2xl shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-widest text-sm"
              >
                {loading ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Neural Processing...</>
                ) : (
                  <><Zap className="w-5 h-5 fill-white" /> Start AI Detection</>
                )}
              </button>
              <button 
                onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); }}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-8 rounded-3xl border border-slate-800 transition-all font-bold uppercase tracking-widest text-xs"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-8">
            <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-slate-800 pb-6">Parameters</h3>
            
            {/* Location */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3 text-orange-500" />
                Geospatial Data
              </label>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">Coordinates</span>
                  <button 
                    onClick={getGPSLocation}
                    className="p-2 hover:bg-slate-800 rounded-xl text-orange-500 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                {gpsLocation ? (
                  <div className="space-y-1">
                    <p className="text-sm font-mono text-white">LAT: {gpsLocation.latitude.toFixed(6)}</p>
                    <p className="text-sm font-mono text-white">LON: {gpsLocation.longitude.toFixed(6)}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 font-bold uppercase italic">Pending capture...</p>
                )}
              </div>
            </div>

            {/* Road Type */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-3 h-3 text-orange-500" />
                Infrastructure Zone
              </label>
              <select 
                value={roadType}
                onChange={(e) => setRoadType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="city_street">Urban/City Street</option>
                <option value="highway">High-Speed Highway</option>
                <option value="rural_road">Rural/Backroad</option>
                <option value="bridge">Structural Bridge</option>
              </select>
            </div>
          </div>

          {/* Results Area */}
          {result && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in duration-500">
              <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-orange-500/5 to-transparent flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Analysis Output</h3>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Results - Larger and bolder */}
                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tight">Intelligence Dashboard</h3>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Analysis Vector Complete</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleDownloadReport}
                        className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all shadow-xl group flex items-center gap-3"
                        title="Download Analysis Report"
                      >
                        <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest hidden md:inline">Export Report</span>
                      </button>
                      <div className="h-14 w-px bg-slate-800 mx-2" />
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Trust Score</p>
                        <p className="text-2xl font-black text-emerald-400">{(result.summary.avg_confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ResultCard 
                      icon={<AlertCircle className="text-orange-500" size={28} />}
                      label="Damage Areas"
                      value={result.summary.total_damage_areas}
                      subValue="Detected Objects"
                    />
                    <ResultCard 
                      icon={<Zap className="text-amber-500" size={28} />}
                      label="Repair Valuation"
                      value={`₹${result.summary.total_estimated_cost.toLocaleString()}`}
                      subValue="Est. Total Cost"
                      isCost
                    />
                  </div>

                  <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 p-8 space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                       <LayoutGrid size={16} className="text-orange-500" />
                       Spatial Breakdown
                    </h4>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-4 scrollbar-thin">
                      {result.detections.map((det, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-orange-500/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${det.severity === 'severe' ? 'bg-rose-500' : det.severity === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                            <div>
                              <p className="text-lg font-black text-white uppercase tracking-tight">{det.damage_type}</p>
                              <p className="text-xs font-bold text-slate-500 uppercase">Detection ID: 00{i+1}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black uppercase ${det.severity === 'severe' ? 'text-rose-400' : det.severity === 'moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {det.severity}
                            </p>
                            <p className="text-xs font-bold text-slate-600">{(det.confidence * 100).toFixed(0)}% Conf.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setAnalysisContext({
                        detections: result.detections,
                        summary: result.summary,
                        road_type: roadType,
                        location: gpsLocation,
                      })}
                      className="flex-1 py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    >
                      <Sparkles size={20} />
                      Ask AI to Explain
                      <Bot size={20} />
                    </button>
                    <button 
                      onClick={() => setResult(null)}
                      className="px-8 py-5 bg-slate-800 text-slate-400 font-black rounded-2xl hover:bg-slate-700 hover:text-white transition-all text-xs uppercase tracking-widest"
                    >
                      New Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips / Info */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 fill-white/20" />
                <h4 className="font-black uppercase tracking-widest text-sm">Pro Tip</h4>
              </div>
              <p className="text-white/90 font-medium leading-relaxed">
                For the highest accuracy, ensure images are well-lit and the damage is centered in the frame. AI models perform best with high-contrast captures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionPage;
