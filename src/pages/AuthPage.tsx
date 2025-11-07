import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, UserPlus, Trophy } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        
        // Assign default user role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: "user",
          });
        }
        
        toast.success("Account created! Please check your email.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      
      <Card className="w-full max-w-md p-8 backdrop-blur-lg border-2 border-primary/30 shadow-[var(--shadow-intense)] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--gradient-primary)] mb-4">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black gradient-text mb-2">
            {isLogin ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to manage tournaments" : "Create an account to get started"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-2"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border-2"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="gradient"
            className="w-full h-12 font-bold"
          >
            {loading ? (
              "Loading..."
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Sign Up
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;
