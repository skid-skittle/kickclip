import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  Lock,
  Users,
  Video,
  Scissors,
  Download,
  Trash2,
  TrendingUp,
  LogOut,
  Loader2,
  BarChart3,
  Eye
} from "lucide-react";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("kicknow_admin_token"));
  
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [vods, setVods] = useState([]);
  const [clips, setClips] = useState([]);

  useEffect(() => {
    if (adminToken) {
      verifyAdminSession();
    }
  }, []);

  const verifyAdminSession = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true,
      });
      setStats(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("kicknow_admin_token");
      setAdminToken(null);
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${API}/admin/login`,
        { password },
        { withCredentials: true }
      );
      const { token } = response.data;
      setAdminToken(token);
      localStorage.setItem("kicknow_admin_token", token);
      setIsAuthenticated(true);
      toast.success("Admin login successful");
      fetchData(token);
    } catch (error) {
      toast.error("Invalid admin password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kicknow_admin_token");
    setAdminToken(null);
    setIsAuthenticated(false);
    setStats(null);
    toast.success("Logged out");
  };

  const fetchData = async (token) => {
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const [statsRes, usersRes, vodsRes, clipsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers, withCredentials: true }),
        axios.get(`${API}/admin/users`, { headers, withCredentials: true }),
        axios.get(`${API}/admin/vods`, { headers, withCredentials: true }),
        axios.get(`${API}/admin/clips`, { headers, withCredentials: true }),
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setVods(vodsRes.data);
      setClips(clipsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and all their data?")) return;
    
    try {
      await axios.delete(`${API}/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true,
      });
      setUsers(users.filter((u) => u.user_id !== userId));
      toast.success("User deleted");
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleDeleteVod = async (vodId) => {
    if (!window.confirm("Delete this VOD and all associated clips?")) return;
    
    try {
      await axios.delete(`${API}/admin/vod/${vodId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true,
      });
      setVods(vods.filter((v) => v.vod_id !== vodId));
      toast.success("VOD deleted");
    } catch (error) {
      toast.error("Failed to delete VOD");
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminToken) {
      fetchData(adminToken);
    }
  }, [isAuthenticated, activeTab]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00C853]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[#00C853]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Panel</h1>
            <p className="text-zinc-400">Enter admin password to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-[#121212] border-[#1F1F1F] text-white placeholder:text-zinc-600 rounded-xl focus:border-[#00C853]"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#00C853] hover:bg-[#00E676] text-black font-bold rounded-xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access Admin Panel"}
            </Button>
          </form>
          
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full text-zinc-400 hover:text-white"
          >
            Back to KickNow
          </Button>
        </div>
      </div>
    );
  }

  // Admin Dashboard
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
              <span className="px-2 py-0.5 rounded bg-[#00C853]/10 text-[#00C853] text-xs font-bold">ADMIN</span>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: "stats", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
              { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
              { id: "vods", label: "VODs", icon: <Video className="w-4 h-4" /> },
              { id: "clips", label: "Clips", icon: <Scissors className="w-4 h-4" /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? "bg-[#00C853] text-black" : "text-zinc-400"}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </Button>
            ))}
          </div>

          {/* Stats Tab */}
          {activeTab === "stats" && stats && (
            <div className="space-y-8 animate-fade-in-up">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: stats.total_users, icon: <Users className="w-6 h-6" />, color: "text-blue-500" },
                  { label: "VODs Processed", value: stats.total_vods_processed, icon: <Video className="w-6 h-6" />, color: "text-purple-500" },
                  { label: "Clips Generated", value: stats.total_clips_generated, icon: <Scissors className="w-6 h-6" />, color: "text-[#00C853]" },
                  { label: "Total Exports", value: stats.total_exports || 0, icon: <Download className="w-6 h-6" />, color: "text-orange-500" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]"
                  >
                    <div className={`${stat.color} mb-3`}>{stat.icon}</div>
                    <div className="text-3xl font-bold font-mono">{stat.value}</div>
                    <div className="text-sm text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent VODs */}
              <div className="p-6 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00C853]" />
                  Recent Activity
                </h3>
                {stats.recent_vods?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_vods.slice(0, 5).map((vod, index) => (
                      <div
                        key={vod.vod_id}
                        className="flex items-center justify-between py-3 border-b border-[#1F1F1F] last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
                            <Video className="w-5 h-5 text-zinc-600" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-xs">{vod.title}</p>
                            <p className="text-sm text-zinc-500">{vod.channel_name}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vod.status === "completed" ? "bg-[#00C853]/10 text-[#00C853]" :
                          vod.status === "processing" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          {vod.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="animate-fade-in-up">
              <div className="rounded-2xl bg-[#121212] border border-[#1F1F1F] overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#1F1F1F] hover:bg-transparent">
                        <TableHead className="text-zinc-400">User</TableHead>
                        <TableHead className="text-zinc-400">Email</TableHead>
                        <TableHead className="text-zinc-400">Created</TableHead>
                        <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.user_id} className="border-[#1F1F1F]">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center">
                                {user.picture ? (
                                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                                ) : (
                                  <Users className="w-4 h-4 text-zinc-600" />
                                )}
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400">{user.email}</TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.user_id)}
                              className="text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* VODs Tab */}
          {activeTab === "vods" && (
            <div className="animate-fade-in-up">
              <div className="rounded-2xl bg-[#121212] border border-[#1F1F1F] overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#1F1F1F] hover:bg-transparent">
                        <TableHead className="text-zinc-400">VOD</TableHead>
                        <TableHead className="text-zinc-400">Channel</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Created</TableHead>
                        <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vods.map((vod) => (
                        <TableRow key={vod.vod_id} className="border-[#1F1F1F]">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-8 rounded bg-[#0A0A0A] overflow-hidden">
                                {vod.thumbnail ? (
                                  <img src={vod.thumbnail} alt={vod.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video className="w-4 h-4 text-zinc-600" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium truncate max-w-xs">{vod.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400">{vod.channel_name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              vod.status === "completed" ? "bg-[#00C853]/10 text-[#00C853]" :
                              vod.status === "processing" ? "bg-yellow-500/10 text-yellow-500" :
                              "bg-red-500/10 text-red-500"
                            }`}>
                              {vod.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {new Date(vod.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteVod(vod.vod_id)}
                              className="text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Clips Tab */}
          {activeTab === "clips" && (
            <div className="animate-fade-in-up">
              <div className="rounded-2xl bg-[#121212] border border-[#1F1F1F] overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#1F1F1F] hover:bg-transparent">
                        <TableHead className="text-zinc-400">Clip</TableHead>
                        <TableHead className="text-zinc-400">Duration</TableHead>
                        <TableHead className="text-zinc-400">Virality</TableHead>
                        <TableHead className="text-zinc-400">Format</TableHead>
                        <TableHead className="text-zinc-400">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clips.map((clip) => (
                        <TableRow key={clip.clip_id} className="border-[#1F1F1F]">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-12 rounded bg-[#0A0A0A] overflow-hidden">
                                {clip.thumbnail ? (
                                  <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Scissors className="w-4 h-4 text-zinc-600" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium truncate max-w-xs">{clip.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-zinc-400">
                            {Math.floor(clip.duration / 60)}:{String(Math.floor(clip.duration % 60)).padStart(2, '0')}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              clip.virality_score >= 70 ? "virality-high" :
                              clip.virality_score >= 40 ? "virality-medium" :
                              "virality-low"
                            }`}>
                              {clip.virality_score}%
                            </span>
                          </TableCell>
                          <TableCell className="text-zinc-400 capitalize">{clip.export_format}</TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {new Date(clip.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
