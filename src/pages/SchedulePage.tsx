import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Session } from "@supabase/supabase-js";

interface ScheduledMatch {
  id: string;
  match_number: number;
  participant1_name: string;
  participant2_name: string;
  scheduled_time: string | null;
  duration_minutes: number;
  status: string;
  court_id: string | null;
  court?: { name: string; location: string };
}

interface Court {
  id: string;
  name: string;
  location: string;
}

const SchedulePage = () => {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedTournament]);

  const fetchData = async () => {
    try {
      // Fetch tournaments
      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      setTournaments(tournamentsData || []);

      if (!selectedTournament && tournamentsData && tournamentsData.length > 0) {
        setSelectedTournament(tournamentsData[0].id);
        return;
      }

      if (!selectedTournament) {
        setLoading(false);
        return;
      }

      // Fetch courts for selected tournament
      const { data: courtsData } = await supabase
        .from("courts")
        .select("*")
        .eq("tournament_id", selectedTournament);

      setCourts(courtsData || []);

      // Fetch scheduled matches
      const { data: matchesData } = await supabase
        .from("scheduled_matches")
        .select(`
          *,
          court:courts(name, location)
        `)
        .eq("tournament_id", selectedTournament)
        .order("scheduled_time", { ascending: true });

      setMatches(matchesData || []);
    } catch (error: any) {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const createMatchesFromTournament = async () => {
    if (!selectedTournament) return;

    try {
      const { data: tournament } = await supabase
        .from("tournaments")
        .select("matchups")
        .eq("id", selectedTournament)
        .single();

      if (!tournament || !tournament.matchups) {
        toast.error("No matchups found for this tournament");
        return;
      }

      const matchups = tournament.matchups as any[];
      const matchesToInsert: any[] = [];
      let matchNumber = 1;

      matchups.forEach((matchup: any) => {
        if (matchup.matches && Array.isArray(matchup.matches)) {
          matchup.matches.forEach((match: any) => {
            matchesToInsert.push({
              tournament_id: selectedTournament,
              match_number: matchNumber++,
              participant1_name: matchup.participant.name,
              participant2_name: match.opponent.name,
              status: "scheduled",
            });
          });
        }
      });

      const { error } = await supabase
        .from("scheduled_matches")
        .insert(matchesToInsert);

      if (error) throw error;

      toast.success(`Created ${matchesToInsert.length} matches!`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to create matches");
    }
  };

  const updateMatch = async (
    matchId: string,
    updates: { scheduled_time?: string; court_id?: string; duration_minutes?: number }
  ) => {
    try {
      const { error } = await supabase
        .from("scheduled_matches")
        .update(updates)
        .eq("id", matchId);

      if (error) throw error;

      toast.success("Match updated!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update match");
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_matches")
        .delete()
        .eq("id", matchId);

      if (error) throw error;

      toast.success("Match deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete match");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-dark)] flex items-center justify-center">
        <p className="text-xl">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] relative overflow-hidden">
      <Navigation />
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black gradient-text mb-2">Match Schedule</h1>
          <p className="text-muted-foreground">View and manage tournament schedules</p>
        </div>

        <Card className="p-6 backdrop-blur-lg border-2 border-primary/30 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Tournament</label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="w-full h-12 px-4 rounded-md border-2 bg-background"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {session && (
              <Button onClick={createMatchesFromTournament} variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Generate Schedule
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {matches.length === 0 ? (
            <Card className="p-12 text-center backdrop-blur-lg border-2 border-primary/30">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl font-semibold mb-2">No matches scheduled</p>
              <p className="text-muted-foreground">Generate a schedule to get started</p>
            </Card>
          ) : (
            matches.map((match) => (
              <Card key={match.id} className="p-6 backdrop-blur-lg border-2 border-primary/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge>Match #{match.match_number}</Badge>
                      <h3 className="text-xl font-bold">
                        {match.participant1_name} vs {match.participant2_name}
                      </h3>
                      <Badge variant={match.status === "completed" ? "default" : "secondary"}>
                        {match.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Date & Time</label>
                        <Input
                          type="datetime-local"
                          value={match.scheduled_time ? format(new Date(match.scheduled_time), "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => updateMatch(match.id, { scheduled_time: e.target.value })}
                          disabled={!session}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Court</label>
                        <select
                          value={match.court_id || ""}
                          onChange={(e) => updateMatch(match.id, { court_id: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border-2 bg-background"
                          disabled={!session}
                        >
                          <option value="">No court assigned</option>
                          {courts.map((court) => (
                            <option key={court.id} value={court.id}>
                              {court.name} {court.location && `- ${court.location}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Duration (mins)</label>
                        <Input
                          type="number"
                          value={match.duration_minutes}
                          onChange={(e) => updateMatch(match.id, { duration_minutes: parseInt(e.target.value) })}
                          disabled={!session}
                        />
                      </div>
                    </div>

                    {match.scheduled_time && (
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(match.scheduled_time), "PPP 'at' p")}
                        </div>
                        {match.court && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {match.court.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {session && (
                    <Button
                      onClick={() => deleteMatch(match.id)}
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
