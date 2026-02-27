import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Play,
  Scissors,
  Download,
  Save,
  Loader2,
  Sparkles,
  Type,
  Hash,
  RefreshCw,
  Copy
} from "lucide-react";

const ClipEditor = () => {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [clip, setClip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingHook, setGeneratingHook] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [exportFormat, setExportFormat] = useState("tiktok");

  useEffect(() => {
    fetchClip();
  }, [clipId]);

  const fetchClip = async () => {
    try {
      const response = await axios.get(`${API}/clip/${clipId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      const clipData = response.data;
      setClip(clipData);
      setTitle(clipData.title || "");
      setStartTime(clipData.start_time || 0);
      setEndTime(clipData.end_time || 30);
      setHook(clipData.hook || "");
      setCaption(clipData.caption || "");
      setHashtags(clipData.hashtags?.join(", ") || "");
      setExportFormat(clipData.export_format || "tiktok");
    } catch (error) {
      console.error("Failed to fetch clip:", error);
      toast.error("Failed to load clip");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        title,
        start_time: startTime,
        end_time: endTime,
        hook,
        caption,
        hashtags: hashtags.split(",").map(h => h.trim()).filter(h => h),
        export_format: exportFormat
      };

      await axios.patch(`${API}/clip/${clipId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      toast.success("Clip saved successfully!");
    } catch (error) {
      toast.error("Failed to save clip");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.post(`${API}/clip/${clipId}/export`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      toast.success("Clip exported successfully!");
      // In a real app, you might download the file here
    } catch (error) {
      toast.error("Failed to export clip");
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateHook = async () => {
    setGeneratingHook(true);
    try {
      const response = await axios.post(`${API}/generate/hook`, {
        clip_title: title,
        context: caption
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setHook(response.data.hook);
      toast.success("Hook generated!");
    } catch (error) {
      toast.error("Failed to generate hook");
    } finally {
      setGeneratingHook(false);
    }
  };

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const response = await axios.post(`${API}/generate/caption`, {
        clip_title: title,
        hook
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setCaption(response.data.caption);
      toast.success("Caption generated!");
    } catch (error) {
      toast.error("Failed to generate caption");
    } finally {
      setGeneratingCaption(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Clip not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#00C853]" />
                <h1 className="text-xl font-semibold">Clip Editor</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="outline"
                className="border-[#1F1F1F] hover:bg-[#1F1F1F]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="bg-[#00C853] hover:bg-[#00E676] text-black font-semibold"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Video Preview - Left Side */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                {/* Video Container */}
                <div className="video-container rounded-2xl overflow-hidden bg-[#121212] border border-[#1F1F1F] mx-auto">
                  <div className="w-full h-full flex items-center justify-center relative">
                    {clip?.thumbnail ? (
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-zinc-600">
                        <Play className="w-16 h-16" />
                      </div>
                    )}
                    
                    {/* Caption Overlay */}
                    {hook && (
                      <div className="absolute bottom-20 left-0 right-0 px-4">
                        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                          <p className="text-lg font-bold">{hook}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#00C853] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-black fill-current" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Format Info */}
                <div className="mt-4 p-4 rounded-xl bg-[#121212] border border-[#1F1F1F]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Format</span>
                    <span className="font-mono text-[#00C853]">9:16 Vertical</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-zinc-400">Duration</span>
                    <span className="font-mono">{formatTime(endTime - startTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-zinc-400">Virality Score</span>
                    <span className="font-mono text-[#00C853]">{clip?.virality_score}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Controls - Right Side */}
            <div className="lg:col-span-7 space-y-6">
              {/* Title */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <Label className="text-sm text-zinc-400 mb-2 block">Clip Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter clip title..."
                  className="bg-[#0A0A0A] border-[#1F1F1F] focus:border-[#00C853] text-white"
                />
              </div>

              {/* Trim Controls */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <div className="flex items-center gap-2 mb-4">
                  <Scissors className="w-5 h-5 text-[#00C853]" />
                  <h3 className="font-semibold">Trim Clip</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400">Start Time</span>
                      <span className="font-mono">{formatTime(startTime)}</span>
                    </div>
                    <Slider
                      value={[startTime]}
                      onValueChange={([val]) => setStartTime(Math.min(val, endTime - 5))}
                      max={clip?.end_time || 60}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400">End Time</span>
                      <span className="font-mono">{formatTime(endTime)}</span>
                    </div>
                    <Slider
                      value={[endTime]}
                      onValueChange={([val]) => setEndTime(Math.max(val, startTime + 5))}
                      max={clip?.end_time || 60}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Hook Generator */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00C853]" />
                    <h3 className="font-semibold">Viral Hook</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleGenerateHook}
                    disabled={generatingHook}
                    className="text-[#00C853] hover:text-[#00E676]"
                  >
                    {generatingHook ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="relative">
                  <Input
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="You won't believe this..."
                    className="bg-[#0A0A0A] border-[#1F1F1F] focus:border-[#00C853] text-white pr-10"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(hook)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white h-8 w-8 p-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Caption */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-[#00C853]" />
                    <h3 className="font-semibold">Caption</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleGenerateCaption}
                    disabled={generatingCaption}
                    className="text-[#00C853] hover:text-[#00E676]"
                  >
                    {generatingCaption ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your clip..."
                  rows={4}
                  className="bg-[#0A0A0A] border-[#1F1F1F] focus:border-[#00C853] text-white resize-none"
                />
              </div>

              {/* Hashtags */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-5 h-5 text-[#00C853]" />
                  <h3 className="font-semibold">Hashtags</h3>
                </div>
                
                <Input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#gaming, #viral, #fyp"
                  className="bg-[#0A0A0A] border-[#1F1F1F] focus:border-[#00C853] text-white"
                />
                <p className="text-xs text-zinc-500 mt-2">Separate hashtags with commas</p>
              </div>

              {/* Export Options */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-[#00C853]" />
                  <h3 className="font-semibold">Export Format</h3>
                </div>
                
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1F1F1F] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121212] border-[#1F1F1F]">
                    <SelectItem value="tiktok">TikTok (9:16)</SelectItem>
                    <SelectItem value="reels">Instagram Reels (9:16)</SelectItem>
                    <SelectItem value="shorts">YouTube Shorts (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-14 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white font-semibold rounded-xl"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 h-14 bg-[#00C853] hover:bg-[#00E676] text-black font-bold rounded-xl glow-green"
                >
                  {exporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Export for {exportFormat === "tiktok" ? "TikTok" : exportFormat === "reels" ? "Reels" : "Shorts"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClipEditor;
