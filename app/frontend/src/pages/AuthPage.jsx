import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle } = useAuth();
  
  const from = location.state?.from?.pathname || "/dashboard";
  const vodUrl = location.state?.vodUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let result;
    if (isLogin) {
      result = await login(email, password);
    } else {
      result = await register(name, email, password);
    }
    
    setLoading(false);
    
    if (result.success) {
      navigate(from, { state: { vodUrl } });
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 hero-gradient">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-lg bg-[#00C853] flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-current" />
          </div>
          <span className="text-2xl font-bold tracking-tight">KickNow</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-5xl font-bold tracking-tighter leading-tight">
            Turn Your Streams Into
            <br />
            <span className="text-gradient-green">Viral Content</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-md">
            AI-powered clip detection finds your best moments and formats them for TikTok automatically.
          </p>
        </div>
        
        <div className="flex items-center gap-8 text-zinc-500">
          <div>
            <div className="text-3xl font-bold text-white">10K+</div>
            <div className="text-sm">Clips Created</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-sm">Active Creators</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">50M+</div>
            <div className="text-sm">Views Generated</div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#00C853] flex items-center justify-center">
              <Play className="w-5 h-5 text-black fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight">KickNow</span>
          </div>

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-zinc-400 mt-2">
              {isLogin
                ? "Sign in to your account to continue"
                : "Get started with KickNow for free"}
            </p>
          </div>

          {/* Google Login */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 bg-white hover:bg-zinc-100 text-black font-medium rounded-xl border-0"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1F1F1F]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0A0A0A] px-4 text-zinc-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-zinc-400">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="pl-10 h-12 bg-[#121212] border-[#1F1F1F] text-white placeholder:text-zinc-600 rounded-xl focus:border-[#00C853]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-400">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-[#121212] border-[#1F1F1F] text-white placeholder:text-zinc-600 rounded-xl focus:border-[#00C853]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 bg-[#121212] border-[#1F1F1F] text-white placeholder:text-zinc-600 rounded-xl focus:border-[#00C853]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#00C853] hover:bg-[#00E676] text-black font-bold rounded-xl glow-green"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-zinc-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#00C853] hover:text-[#00E676] font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
