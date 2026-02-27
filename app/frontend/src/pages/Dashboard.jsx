import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Plus,
  Video,
  Scissors,
  Download,
  TrendingUp,
  Clock,
  BarChart3,
  Loader2,
  ExternalLink,
  Trash2,
  Edit
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [vods, setVods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [vodUrl, setVodUrl] = useState("");

  useEffect(() => {
    fetchVODs();
  }, []);

  const fetchVODs = async () => {
    try {
      const response = await axios.get(`${API}/vods`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("kicknow_token")}` },
        withCredentials: true,
      });
      setVods(response.data);
    } catch (error) {
      console.error("Failed to fetch VODs:", error);
      toast.error("Failed to load your VODs");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeVOD = async () => {
    if (!vodUrl.trim()) {
      toast.error("Please enter a VOD URL");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await axios.post(
        `${API}/vod/analyze`,
        { vod_url: vodUrl },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("kicknow_token")}` },
          withCredentials: true,
        }
      );
      
      toast.success("VOD analysis started!");
      setVodUrl("");
      fetchVODs();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to start analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-[#00C853]";
      case "processing":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-zinc-400";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "completed":
        return "bg-[#00C853]/10";
      case "processing":
        return "bg-yellow-500/10";
      case "failed":
        return "bg-red-500/10";
      default:
        return "bg-zinc-500/10";
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00C853] flex items-center justify-center">
                <Play className="w-4 h-4 text-black fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">KickNow</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-6 h-6 rounded-full bg-[#1F1F1F] overflow-hidden">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-3 h-3 text-zinc-600" />
                    </div>
                  )}
                </div>
                {user?.name}
              </div>
              <Button variant="ghost" onClick={logout} className="text-zinc-400 hover:text-white">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}</h1>
            <p className="text-xl text-zinc-400">Ready to create some viral content?</p>
          </div>

          {/* VOD Analysis Input */}
          <div className="mb-12">
            <div className="p-8 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
              <div className="flex items-center gap-3 mb-6">
                <Plus className="w-6 h-6 text-[#00C853]" />
                <h2 className="text-2xl font-semibold">Analyze New VOD</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="https://kick.com/video/..."
                  value={vodUrl}
                  onChange={(e) => setVodUrl(e.target.value)}
                  className="flex-1 h-14 bg-[#0A0A0A] border-[#1F1F1F] text-white placeholder:text-zinc-600"
                />
                <Button
                  onClick={handleAnalyzeVOD}
                  disabled={analyzing}
                  className="h-14 px-8 bg-[#00C853] hover:bg-[#00E676] text-black font-bold rounded-xl glow-green"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5 mr-2" />
                      Analyze VOD
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Total VODs", value: vods.length, icon: <Video className="w-5 h-5" /> },
              { 
                label: "Clips Generated", 
                value: vods.reduce((sum, vod) => sum + (vod.clips_count || 0), 0), 
                icon: <Scissors className="w-5 h-5" /> 
              },
              { 
                label: "Completed", 
                value: vods.filter(v => v.status === "completed").length, 
                icon: <TrendingUp className="w-5 h-5" /> 
              },
              { 
                label: "Processing", 
                value: vods.filter(v => v.status === "processing").length, 
                icon: <Clock className="w-5 h-5" /> 
              }
            ].map((stat, index) => (
              <div key={index} className="p-6 rounded-xl bg-[#121212] border border-[#1F1F1F]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-zinc-400">{stat.label}</div>
                  <div className="text-[#00C853]">{stat.icon}</div>
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* VODs List */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Your VODs</h2>
              <Button variant="ghost" size="sm" onClick={fetchVODs}>
                Refresh
              </Button>
            </div>

            {vods.length === 0 ? (
              <div className="text-center py-16">
                <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No VODs yet</h3>
                <p className="text-zinc-400 mb-6">Start by analyzing your first Kick VOD above</p>
                <Button onClick={() => setVodUrl("https://kick.com/video/demo123")}>
                  Try Demo VOD
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {vods.map((vod) => (
                  <div
                    key={vod.vod_id}
                    className="p-6 rounded-xl bg-[#121212] border border-[#1F1F1F] hover:border-[#00C853]/50 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Thumbnail */}
                      <div className="w-32 h-20 rounded-lg bg-[#0A0A0A] overflow-hidden flex-shrink-0">
                        {vod.thumbnail ? (
                          <img src={vod.thumbnail} alt={vod.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-8 h-8 text-zinc-600" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold truncate">{vod.title}</h3>
                            <p className="text-zinc-400">{vod.channel_name}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(vod.status)} ${getStatusColor(vod.status)}`}>
                            {vod.status}
                          </span>
                        </div>

                        {/* Progress for processing VODs */}
                        {vod.status === "processing" && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-zinc-400">{vod.progress_message}</span>
                              <span className="text-zinc-400">{vod.progress}%</span>
                            </div>
                            <Progress value={vod.progress} className="h-2" />
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-6 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(vod.duration)}
                          </span>
                          <span>{formatDate(vod.created_at)}</span>
                          {vod.clips_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Scissors className="w-4 h-4" />
                              {vod.clips_count} clips
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {vod.status === "completed" && (
                          <Button
                            onClick={() => navigate(`/clip/${vod.vod_id}`)}
                            size="sm"
                            className="bg-[#00C853] hover:bg-[#00E676] text-black"
                          >
                            <Scissors className="w-4 h-4 mr-1" />
                            View Clips
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
