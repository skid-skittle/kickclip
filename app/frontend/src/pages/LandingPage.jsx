import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  ArrowRight, 
  Scissors, 
  TrendingUp, 
  Users, 
  Zap,
  ChevronRight,
  BarChart3,
  Video,
  CheckCircle
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vodUrl, setVodUrl] = useState("");

  const handleGetStarted = () => {
    if (vodUrl) {
      navigate("/auth", { state: { vodUrl } });
    } else {
      navigate("/auth");
    }
  };

  const handleDemo = () => {
    navigate("/auth", { state: { vodUrl: "https://kick.com/video/demo123" } });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00C853] flex items-center justify-center">
                <Play className="w-4 h-4 text-black fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">KickNow</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-[#00C853] hover:bg-[#00E676] text-black font-semibold"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                    className="text-zinc-400 hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    className="bg-[#00C853] hover:bg-[#00E676] text-black font-semibold"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 hero-gradient">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
              Turn Your Streams Into
              <br />
              <span className="text-gradient-green">Viral Content</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-10">
              AI-powered clip detection finds your best moments and formats them for TikTok automatically. 
              Stop manually searching for highlights - let our AI do the work.
            </p>
            
            {/* VOD URL Input */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4 p-1 rounded-2xl bg-[#121212] border border-[#1F1F1F]">
                <Input
                  type="url"
                  placeholder="Paste your Kick VOD URL..."
                  value={vodUrl}
                  onChange={(e) => setVodUrl(e.target.value)}
                  className="flex-1 h-14 bg-transparent border-none text-white placeholder:text-zinc-600 text-lg"
                />
                <Button
                  onClick={handleGetStarted}
                  className="h-14 px-8 bg-[#00C853] hover:bg-[#00E676] text-black font-bold rounded-xl glow-green"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <p className="text-sm text-zinc-500">
                Or{" "}
                <button
                  onClick={handleDemo}
                  className="text-[#00C853] hover:text-[#00E676] underline"
                >
                  try a demo VOD
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-zinc-400">Three simple steps to viral content</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Video className="w-8 h-8" />,
                title: "Paste VOD URL",
                description: "Simply paste your Kick stream URL and our AI gets to work analyzing your content."
              },
              {
                icon: <Scissors className="w-8 h-8" />,
                title: "AI Detects Clips",
                description: "Our advanced AI analyzes chat activity and detects the most viral-worthy moments."
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Export & Post",
                description: "Get perfectly formatted clips with hooks, captions, and hashtags ready for TikTok."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-[#121212] border border-[#1F1F1F] hover:border-[#00C853]/50 transition-all animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-xl bg-[#00C853]/10 flex items-center justify-center mb-6 text-[#00C853]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#121212]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Clips Created", value: "10K+", icon: <Scissors className="w-6 h-6" /> },
              { label: "Active Creators", value: "500+", icon: <Users className="w-6 h-6" /> },
              { label: "Views Generated", value: "50M+", icon: <TrendingUp className="w-6 h-6" /> },
              { label: "Avg. Virality Score", value: "87%", icon: <BarChart3 className="w-6 h-6" /> }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="w-12 h-12 rounded-lg bg-[#00C853]/10 flex items-center justify-center mx-auto text-[#00C853]">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-zinc-400">Everything you need to grow your audience</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "AI-Powered Clip Detection",
              "Chat Activity Analysis",
              "Viral Score Calculation",
              "Auto-Generated Hooks",
              "Smart Caption Writing",
              "Hashtag Optimization",
              "9:16 Vertical Format",
              "One-Click Export",
              "Batch Processing"
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#121212] border border-[#1F1F1F] animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CheckCircle className="w-5 h-5 text-[#00C853] flex-shrink-0" />
                <span className="text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-[#00C853]/10 to-[#00E676]/10 border border-[#00C853]/20">
            <Zap className="w-16 h-16 text-[#00C853] mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Ready to Go Viral?</h2>
            <p className="text-xl text-zinc-400 mb-8">
              Join thousands of creators who are already using KickNow to grow their audience.
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="h-16 px-12 bg-[#00C853] hover:bg-[#00E676] text-black font-bold text-lg rounded-xl glow-green"
            >
              Start Creating Now
              <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00C853] flex items-center justify-center">
                <Play className="w-4 h-4 text-black fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">KickNow</span>
            </div>
            <p className="text-zinc-500 text-sm">
              © 2026 KickNow. Turn streams into viral content.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
