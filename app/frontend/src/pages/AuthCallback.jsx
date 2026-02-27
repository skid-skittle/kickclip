import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser, checkAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        toast.error("No session ID found");
        navigate("/auth");
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        // Exchange session_id for user data and cookie
        const response = await axios.get(`${API}/auth/session`, {
          headers: { "X-Session-ID": sessionId },
          withCredentials: true,
        });

        const userData = response.data;
        setUser(userData);
        toast.success("Welcome back, " + userData.name + "!");
        
        // Clear the hash and redirect to dashboard
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true, state: { user: userData } });
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error("Authentication failed");
        navigate("/auth");
      }
    };

    processSession();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#00C853] animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
