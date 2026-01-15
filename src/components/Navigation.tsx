import { Link, useLocation } from "react-router-dom";
import { Trophy, Dices, Home, Plus, ListTodo, Calendar, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Navigation = () => {
  const location = useLocation();
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--gradient-card)] backdrop-blur-xl border-2 border-primary/40 rounded-full px-6 py-3 shadow-[var(--shadow-elegant)] animate-slide-down hover:shadow-[var(--shadow-intense)] transition-shadow duration-300">
      <div className="flex items-center gap-2 stagger-children">
        {session && <NotificationBell />}
        
        <Link to="/">
          <Button
            variant={isActive("/") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Home className="w-4 h-4 mr-2" />
            View
          </Button>
        </Link>

        <Link to="/create">
          <Button
            variant={isActive("/create") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </Link>

        {session && (
          <>
            <Link to="/tournaments">
              <Button
                variant={isActive("/tournaments") ? "gradient" : "ghost"}
                size="sm"
                className="rounded-full font-semibold"
              >
                <ListTodo className="w-4 h-4 mr-2" />
                Tournaments
              </Button>
            </Link>

            <Link to="/schedule">
              <Button
                variant={isActive("/schedule") ? "gradient" : "ghost"}
                size="sm"
                className="rounded-full font-semibold"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </Link>

            <Link to="/availability">
              <Button
                variant={isActive("/availability") ? "gradient" : "ghost"}
                size="sm"
                className="rounded-full font-semibold"
              >
                <Clock className="w-4 h-4 mr-2" />
                Availability
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={isActive("/admin") ? "gradient" : "ghost"}
                  size="sm"
                  className="rounded-full font-semibold"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
          </>
        )}

        <Link to="/random-wheel">
          <Button
            variant={isActive("/random-wheel") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Dices className="w-4 h-4" />
          </Button>
        </Link>

        <Link to="/wheel">
          <Button
            variant={isActive("/wheel") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-full font-semibold"
          >
            <Trophy className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </nav>
  );
};
