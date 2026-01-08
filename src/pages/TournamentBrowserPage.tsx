import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Trophy, Users, Calendar, LogOut } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { RegistrationCountdown, canRegister } from "@/components/RegistrationCountdown";

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  registered_users: any;
  created_at: string;
  registration_open_at: string | null;
  registration_close_at: string | null;
  tournament_start_at: string | null;
}

const TournamentBrowserPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "registration")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      toast.error("Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (tournament: Tournament) => {
    if (!session?.user) {
      toast.error("Please sign in to register");
      return;
    }

    // Check registration window
    if (!canRegister(tournament.registration_open_at, tournament.registration_close_at)) {
      toast.error("Registration is not currently open for this tournament");
      return;
    }

    try {
      const registeredUsers = Array.isArray(tournament.registered_users) ? tournament.registered_users : [];
      
      if (registeredUsers.some((u: any) => u.id === session.user.id)) {
        toast.info("You're already registered!");
        return;
      }

      if (registeredUsers.length >= tournament.max_participants) {
        toast.error("Tournament is full!");
        return;
      }

      const { error } = await supabase
        .from("tournaments")
        .update({
          registered_users: [...registeredUsers, { id: session.user.id, email: session.user.email }]
        })
        .eq("id", tournament.id);

      if (error) {
        // Check if it's an RLS error (registration window closed on server side)
        if (error.code === "42501" || error.message.includes("policy")) {
          toast.error("Registration window has closed");
          fetchTournaments();
          return;
        }
        throw error;
      }

      toast.success("Successfully registered!");
      fetchTournaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-dark)] flex items-center justify-center">
        <p className="text-xl">Loading tournaments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] relative overflow-hidden">
      <Navigation />
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black gradient-text mb-2">
              Available Tournaments
            </h1>
            <p className="text-muted-foreground">
              Browse and register for upcoming tournaments
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="space-y-4">
          {tournaments.length === 0 ? (
            <Card className="p-12 text-center backdrop-blur-lg border-2 border-primary/30">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl font-semibold mb-2">No tournaments available</p>
              <p className="text-muted-foreground">Check back later for new tournaments!</p>
            </Card>
          ) : (
            tournaments.map((tournament) => {
              const registeredUsers = Array.isArray(tournament.registered_users) ? tournament.registered_users : [];
              const registeredCount = registeredUsers.length;
              const isRegistered = session?.user && registeredUsers.some((u: any) => u.id === session.user.id);
              const registrationOpen = canRegister(tournament.registration_open_at, tournament.registration_close_at);
              const isFull = registeredCount >= tournament.max_participants;
              
              return (
                <Card
                  key={tournament.id}
                  className="p-6 backdrop-blur-lg border-2 border-primary/30 hover:border-primary/50 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-bold">{tournament.name}</h3>
                          <Badge variant={isRegistered ? "default" : "secondary"}>
                            {isRegistered ? "Registered" : "Open"}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-6 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {registeredCount} / {tournament.max_participants} players
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(tournament.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleRegister(tournament)}
                        disabled={isRegistered || isFull || !registrationOpen}
                        variant={isRegistered ? "outline" : "gradient"}
                      >
                        {isRegistered 
                          ? "Registered ✓" 
                          : isFull 
                            ? "Full" 
                            : !registrationOpen 
                              ? "Closed" 
                              : "Register"}
                      </Button>
                    </div>
                    
                    {/* Registration Countdown */}
                    <RegistrationCountdown
                      registrationOpenAt={tournament.registration_open_at}
                      registrationCloseAt={tournament.registration_close_at}
                      tournamentStartAt={tournament.tournament_start_at}
                    />
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentBrowserPage;
