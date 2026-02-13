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
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-2xl px-4 py-2.5 shadow-[var(--shadow-elegant)] animate-slide-down">
      <div className="flex items-center gap-1 stagger-children">
        {session && <NotificationBell />}
        
        <Link to="/">
          <Button
            variant={isActive("/") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-xl font-semibold text-xs h-9 px-3"
          >
            <Home className="w-3.5 h-3.5 mr-1.5" />
            View
          </Button>
        </Link>

        <Link to="/create">
          <Button
            variant={isActive("/create") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-xl font-semibold text-xs h-9 px-3"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create
          </Button>
        </Link>

        {session && (
          <>
            <Link to="/tournaments">
              <Button
                variant={isActive("/tournaments") ? "gradient" : "ghost"}
                size="sm"
                className="rounded-xl font-semibold text-xs h-9 px-3"
              >
                <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                Tournaments
              </Button>
            </Link>

            <Link to="/schedule">
              <Button
                variant={isActive("/schedule") ? "gradient" : "ghost"}
                size="sm"
                className="rounded-xl font-semibold text-xs h-9 px-3"
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Schedule
              </Button>
            </Link>

            <Link to="/availability">
              <Button
                variant={isActive("/availability") ? "gradient" : "ghost"}
                size="sm"
                className="rounded-xl font-semibold text-xs h-9 px-3"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Availability
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={isActive("/admin") ? "gradient" : "ghost"}
                  size="sm"
                  className="rounded-xl font-semibold text-xs h-9 px-3"
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Admin
                </Button>
              </Link>
            )}
          </>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        <Link to="/random-wheel">
          <Button
            variant={isActive("/random-wheel") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-xl h-9 w-9 p-0"
          >
            <Dices className="w-3.5 h-3.5" />
          </Button>
        </Link>

        <Link to="/wheel">
          <Button
            variant={isActive("/wheel") ? "gradient" : "ghost"}
            size="sm"
            className="rounded-xl h-9 w-9 p-0"
          >
            <Trophy className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </nav>
  );
};