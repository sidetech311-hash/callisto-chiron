/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Download, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Settings, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen,
  FileText,
  Music,
  Video,
  Package,
  HardDrive,
  Maximize2,
  ChevronDown,
  Info,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatBytes } from "@/src/lib/utils";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis, 
  Tooltip 
} from "recharts";

type DownloadStatus = "queued" | "downloading" | "paused" | "completed" | "error";

interface Segment {
  id: number;
  progress: number;
}

interface DownloadJob {
  id: string;
  url: string;
  filename: string;
  size: number;
  downloaded: number;
  status: DownloadStatus;
  segments: Segment[];
  startTime: number;
  category: "all" | "compressed" | "documents" | "music" | "programs" | "video";
  speedHistory: { time: number; speed: number }[];
}

const CATEGORIES = [
  { id: "all", label: "All Downloads", icon: HardDrive },
  { id: "unfinished", label: "Unfinished", icon: Clock },
  { id: "finished", label: "Finished", icon: CheckCircle2 },
  { id: "compressed", label: "Compressed", icon: Package },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "music", label: "Music", icon: Music },
  { id: "programs", label: "Programs", icon: Zap },
  { id: "video", label: "Video", icon: Video },
] as const;

export default function App() {
  const [downloads, setDownloads] = useState<DownloadJob[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [isProbing, setIsProbing] = useState(false);
  const [probedData, setProbedData] = useState<any>(null);

  // Simulation effect
  useEffect(() => {
    const timer = setInterval(() => {
      setDownloads(prev => prev.map(job => {
        if (job.status !== "downloading") return job;

        // Simulate multi-threaded segments progressing unequal rates
        const updatedSegments = job.segments.map(seg => {
          if (seg.progress >= 100) return seg;
          const jump = Math.random() * 2 * (1 + Math.random() * 2); // Varying speeds
          return { ...seg, progress: Math.min(100, seg.progress + jump) };
        });

        const totalDownloaded = updatedSegments.reduce((acc, seg) => acc + (seg.progress / 100) * (job.size / job.segments.length), 0);
        const currentSpeed = (totalDownloaded - job.downloaded) * 10; // Simple delta-based speed estimation
        
        const newHistory = [...job.speedHistory, { time: Date.now(), speed: currentSpeed }].slice(-20);

        const isFinished = updatedSegments.every(s => s.progress >= 100);

        return {
          ...job,
          segments: updatedSegments,
          downloaded: Math.min(job.size, Math.round(totalDownloaded)),
          speedHistory: newHistory,
          status: isFinished ? "completed" : "downloading"
        };
      }));
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleAddDownload = async () => {
    if (!newUrl) return;
    setIsProbing(true);
    try {
      const res = await fetch("/api/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl })
      });
      const data = await res.json();
      
      const newJob: DownloadJob = {
        id: Math.random().toString(36).substring(7),
        url: newUrl,
        filename: data.filename || "unknown",
        size: data.size || 1024 * 1024 * 50, // Default 50MB if hidden
        downloaded: 0,
        status: "downloading",
        segments: Array.from({ length: 8 }, (_, i) => ({ id: i, progress: 0 })),
        startTime: Date.now(),
        category: getCategoryFromFilename(data.filename),
        speedHistory: []
      };
      
      setDownloads(prev => [newJob, ...prev]);
      setIsAddModalOpen(false);
      setNewUrl("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProbing(false);
    }
  };

  const getCategoryFromFilename = (filename: string): DownloadJob["category"] => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["zip", "rar", "7z", "tar"].includes(ext!)) return "compressed";
    if (["mp3", "wav", "flac"].includes(ext!)) return "music";
    if (["mp4", "mkv", "avi"].includes(ext!)) return "video";
    if (["exe", "msi", "dmg"].includes(ext!)) return "programs";
    return "documents";
  };

  const toggleStatus = (id: string) => {
    setDownloads(prev => prev.map(j => {
      if (j.id !== id) return j;
      if (j.status === "completed") return j;
      return { ...j, status: j.status === "downloading" ? "paused" : "downloading" };
    }));
  };

  const removeJob = (id: string) => {
    setDownloads(prev => prev.filter(j => j.id !== id));
  };

  const filteredDownloads = downloads.filter(j => {
    if (activeCategory === "all") return true;
    if (activeCategory === "finished") return j.status === "completed";
    if (activeCategory === "unfinished") return j.status !== "completed";
    return j.category === activeCategory;
  });

  return (
    <div className="flex h-screen bg-[#0A0B0E] text-[#E2E8F0] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#22262D] bg-[#15171C] flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">NEXUS IDM</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm group",
                activeCategory === cat.id 
                  ? "bg-[#1F222B] text-blue-400 font-medium" 
                  : "text-slate-400 hover:bg-[#1A1C24] hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <cat.icon className={cn("w-4 h-4 transition-colors", activeCategory === cat.id ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                {cat.label}
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2E38] text-slate-500 font-mono">
                {downloads.filter(d => 
                  cat.id === "all" ? true : 
                  cat.id === "finished" ? d.status === "completed" :
                  cat.id === "unfinished" ? d.status !== "completed" :
                  d.category === cat.id
                ).length}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#22262D]">
          <div className="bg-[#1C1F28] rounded-xl p-3 border border-[#2A2E38]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic font-mono">Global Speed</span>
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {formatBytes(downloads.reduce((acc, j) => acc + (j.status === "downloading" ? (j.speedHistory[j.speedHistory.length - 1]?.speed || 0) : 0), 0))}/s
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0C0D12]">
        {/* Toolbar */}
        <header className="h-16 border-bottom border-[#22262D] px-6 flex items-center justify-between bg-[#15171C]/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add URL
            </button>
            <div className="h-6 w-px bg-[#22262D] mx-2" />
            <div className="flex items-center gap-1">
              <ToolbarButton icon={Play} label="Resume All" />
              <ToolbarButton icon={Pause} label="Pause All" />
              <ToolbarButton icon={Trash2} label="Clear Completed" className="text-red-400 hover:bg-red-500/10" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1F222B] rounded-full border border-[#2A2E38]">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase text-emerald-500 font-mono tracking-tighter">Secure Engine</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F222B]">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* List View */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence initial={false}>
              {filteredDownloads.length > 0 ? (
                filteredDownloads.map(job => (
                  <DownloadCard 
                    key={job.id} 
                    job={job} 
                    onToggle={() => toggleStatus(job.id)}
                    onRemove={() => removeJob(job.id)}
                  />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-32 opacity-20"
                >
                  <Download className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">No downloads in this category</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-[#15171C] border border-[#2A2E38] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#22262D] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-blue-500 fill-current" />
                  <h3 className="font-bold">New Download Task</h3>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Target URL</label>
                  <div className="relative group">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="https://example.com/file.zip"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full bg-[#0A0B0E] border border-[#2A2E38] focus:border-blue-500/50 outline-none rounded-xl px-4 py-3 font-mono text-sm group-hover:border-[#3A3E48] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Quick Test Samples</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Sample ZIP", url: "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-zip-file.zip" },
                      { label: "Large ISO", url: "https://releases.ubuntu.com/24.04/ubuntu-24.04-live-server-amd64.iso" },
                      { label: "Sample Video", url: "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4" }
                    ].map(sample => (
                      <button 
                        key={sample.label}
                        onClick={() => setNewUrl(sample.url)}
                        className="px-3 py-1.5 bg-[#1C1F28] border border-[#2A2E38] rounded-lg text-[10px] font-bold hover:border-blue-500/50 hover:text-blue-400 transition-all"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0A0B0E] rounded-xl p-4 border border-dashed border-[#22262D] text-center">
                  <Info className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Advanced Nexus engine will automatically split this file into 8 concurrent threads for maximum velocity.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#1C1F28] border-t border-[#22262D] flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddDownload}
                  disabled={!newUrl || isProbing}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isProbing ? "Analyzing..." : "Initialize"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, className }: { icon: any, label: string, className?: string }) {
  return (
    <button className={cn("p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium", className)}>
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function DownloadCard({ job, onToggle, onRemove }: { job: DownloadJob; onToggle: () => void; onRemove: () => void; key?: any }) {
  const isDownloading = job.status === "downloading";
  const currentSpeed = job.speedHistory[job.speedHistory.length - 1]?.speed || 0;
  const progressPercent = (job.downloaded / job.size) * 100;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-[#15171C] border border-[#22262D] rounded-xl overflow-hidden hover:border-[#1F4C9D]/50 transition-all duration-300 shadow-lg shadow-black/20"
    >
      <div className="p-4 flex gap-5">
        {/* Progress Circular Visual or Type Icon */}
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[#0A0B0E] rounded-xl border border-[#2A2E38]">
          <Download className={cn("w-6 h-6", isDownloading ? "text-blue-500 animate-pulse" : "text-slate-500")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate pr-4 text-[#F1F5F9]">{job.filename}</h3>
              <p className="text-[10px] text-slate-500 font-mono truncate max-w-sm mt-0.5">{job.url}</p>
            </div>
            <div className="flex items-center gap-2">
              {job.status === "completed" ? (
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = job.url;
                    link.download = job.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all border border-emerald-500/50"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Save to Disk
                </button>
              ) : (
                <button 
                  onClick={onToggle}
                  className="p-2 bg-[#1C1F26] text-slate-400 hover:text-white rounded-lg border border-[#2A2E38] hover:border-[#3A3E48] transition-all"
                >
                  {isDownloading ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
              )}
              <button 
                onClick={onRemove}
                className="p-2 bg-[#1C1F26] text-slate-500 hover:text-red-400 rounded-lg border border-[#2A2E38] hover:border-red-400/30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Main Stats */}
            <div className="col-span-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-medium">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    job.status === "completed" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                    isDownloading ? "bg-blue-500 animate-pulse" : "bg-slate-600"
                  )} />
                  {job.status.toUpperCase()}
                </span>
                <span className="text-blue-400 font-bold tracking-tighter text-sm">{progressPercent.toFixed(1)}%</span>
              </div>
              
              {/* Segmented Progress Bar */}
              <div className="h-2 bg-[#0A0B0E] rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-[#22262D]">
                {job.segments.map(seg => (
                  <div 
                    key={seg.id}
                    className="h-full flex-1 bg-[#1A1C24] rounded-full overflow-hidden"
                  >
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${seg.progress}%` }}
                      className={cn(
                        "h-full transition-all duration-300",
                        job.status === "completed" ? "bg-emerald-500/80" : "bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                      )}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex gap-4">
                  <span>{formatBytes(job.downloaded)} / {formatBytes(job.size)}</span>
                  {isDownloading && (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" />
                      {formatBytes(currentSpeed)}/s
                    </span>
                  )}
                </div>
                {isDownloading && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.max(0, Math.ceil((job.size - job.downloaded) / (currentSpeed || 1)))}s left
                  </span>
                )}
              </div>
            </div>

            {/* Small Speed Chart */}
            <div className="h-full min-h-[50px] bg-[#0A0B0E] rounded-lg p-1 border border-[#22262D]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={job.speedHistory}>
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    stroke={isDownloading ? "#3b82f6" : "#475569"} 
                    strokeWidth={1.5} 
                    dot={false} 
                    isAnimationActive={false}
                  />
                  <Tooltip 
                    content={() => null}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

