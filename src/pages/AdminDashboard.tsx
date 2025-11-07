import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield, Trophy, Users, Calendar, MapPin, Bell, 
  Plus, Trash2, Save, PlayCircle, StopCircle
} from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  registered_users: any;
  start_date: string;
}

interface Court {
  id: string;
  name: string;
  location: string;
  tournament_id: string;
}

const AdminDashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [newCourtName, setNewCourtName] = useState("");
  const [newCourtLocation, setNewCourtLocation] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        checkAdminRole(session.user.id);
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

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("Access denied: Admin privileges required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to verify admin role");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (tournamentsError) throw tournamentsError;
      setTournaments(tournamentsData || []);

      const { data: courtsData, error: courtsError } = await supabase
        .from("courts")
        .select("*");

      if (courtsError) throw courtsError;
      setCourts(courtsData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
    }
  };

  const updateTournamentStatus = async (tournamentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tournaments")
        .update({ status: newStatus })
        .eq("id", tournamentId);

      if (error) throw error;

      toast.success(`Tournament ${newStatus === "registration" ? "opened for registration" : newStatus === "in_progress" ? "started" : "completed"}!`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update tournament");
    }
  };

  const addCourt = async () => {
    if (!newCourtName || !selectedTournament) {
      toast.error("Please enter court name and select a tournament");
      return;
    }

    try {
      const { error } = await supabase
        .from("courts")
        .insert({
          name: newCourtName,
          location: newCourtLocation,
          tournament_id: selectedTournament,
        });

      if (error) throw error;

      toast.success("Court added!");
      setNewCourtName("");
      setNewCourtLocation("");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add court");
    }
  };

  const deleteCourt = async (courtId: string) => {
    try {
      const { error } = await supabase
        .from("courts")
        .delete()
        .eq("id", courtId);

      if (error) throw error;

      toast.success("Court deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete court");
    }
  };

  const sendNotification = async (tournamentId: string, message: string) => {
    try {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return;

      const registeredUsers = Array.isArray(tournament.registered_users) 
        ? tournament.registered_users 
        : [];

      for (const user of registeredUsers) {
        await supabase
          .from("tournament_notifications")
          .insert({
            tournament_id: tournamentId,
            user_id: user.id,
            notification_type: "tournament_update",
            message,
          });
      }

      toast.success("Notifications sent!");
    } catch (error: any) {
      toast.error("Failed to send notifications");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-dark)] flex items-center justify-center">
        <p className="text-xl">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] relative overflow-hidden">
      <Navigation />
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-black gradient-text">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage tournaments, scheduling, and participants</p>
        </div>

        <Tabs defaultValue="tournaments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tournaments">
              <Trophy className="w-4 h-4 mr-2" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="courts">
              <MapPin className="w-4 h-4 mr-2" />
              Courts
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-4">
            {tournaments.map((tournament) => {
              const registeredCount = Array.isArray(tournament.registered_users) 
                ? tournament.registered_users.length 
                : 0;

              return (
                <Card key={tournament.id} className="p-6 backdrop-blur-lg border-2 border-primary/30">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{tournament.name}</h3>
                      <div className="flex gap-2">
                        <Badge variant={
                          tournament.status === "registration" ? "default" :
                          tournament.status === "in_progress" ? "secondary" : "outline"
                        }>
                          {tournament.status}
                        </Badge>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {registeredCount} / {tournament.max_participants}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {tournament.status === "registration" && (
                        <Button
                          onClick={() => updateTournamentStatus(tournament.id, "in_progress")}
                          size="sm"
                          variant="gradient"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {tournament.status === "in_progress" && (
                        <Button
                          onClick={() => updateTournamentStatus(tournament.id, "completed")}
                          size="sm"
                          variant="outline"
                        >
                          <StopCircle className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      )}
                      <Button
                        onClick={() => sendNotification(tournament.id, `Update: ${tournament.name} status changed`)}
                        size="sm"
                        variant="outline"
                      >
                        <Bell className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          {/* Courts Tab */}
          <TabsContent value="courts" className="space-y-4">
            <Card className="p-6 backdrop-blur-lg border-2 border-primary/30">
              <h3 className="text-xl font-bold mb-4">Add Court</h3>
              <div className="space-y-4">
                <select
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                  className="w-full h-12 px-4 rounded-md border-2 bg-background"
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <Input
                  placeholder="Court Name (e.g., Court 1)"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  className="h-12"
                />
                <Input
                  placeholder="Location (optional)"
                  value={newCourtLocation}
                  onChange={(e) => setNewCourtLocation(e.target.value)}
                  className="h-12"
                />
                <Button onClick={addCourt} variant="gradient" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Court
                </Button>
              </div>
            </Card>

            <div className="grid gap-4">
              {courts.map((court) => {
                const tournament = tournaments.find(t => t.id === court.tournament_id);
                return (
                  <Card key={court.id} className="p-4 backdrop-blur-lg border-2 border-primary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{court.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {court.location || "No location"} • {tournament?.name}
                        </p>
                      </div>
                      <Button
                        onClick={() => deleteCourt(court.id)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="p-6 backdrop-blur-lg border-2 border-primary/30">
              <p className="text-center text-muted-foreground">
                Select a tournament to view and manage the schedule
              </p>
              <Button
                onClick={() => navigate("/schedule")}
                variant="gradient"
                className="w-full mt-4"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Go to Schedule Manager
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
