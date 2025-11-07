import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Clock, Save, Plus, Trash2 } from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

const AvailabilityPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchData();
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

  const fetchData = async () => {
    try {
      // Fetch user's registered tournaments
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "registration")
        .order("created_at", { ascending: false });

      setTournaments(tournamentsData || []);

      if (tournamentsData && tournamentsData.length > 0 && !selectedTournament) {
        setSelectedTournament(tournamentsData[0].id);
        await loadAvailability(user.id, tournamentsData[0].id);
      }
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (userId: string, tournamentId: string) => {
    try {
      const { data } = await supabase
        .from("player_availability")
        .select("*")
        .eq("user_id", userId)
        .eq("tournament_id", tournamentId)
        .maybeSingle();

      if (data) {
        const times = Array.isArray(data.available_times) ? data.available_times as unknown as TimeSlot[] : [];
        setTimeSlots(times);
        setNotes(data.notes || "");
      } else {
        setTimeSlots([]);
        setNotes("");
      }
    } catch (error: any) {
      toast.error("Failed to load availability");
    }
  };

  useEffect(() => {
    if (session?.user && selectedTournament) {
      loadAvailability(session.user.id, selectedTournament);
    }
  }, [selectedTournament, session]);

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { date: "", startTime: "", endTime: "" }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const saveAvailability = async () => {
    if (!session?.user || !selectedTournament) return;

    try {
      const { error } = await supabase
        .from("player_availability")
        .upsert({
          user_id: session.user.id,
          tournament_id: selectedTournament,
          available_times: timeSlots as any,
          notes,
        }, {
          onConflict: "user_id,tournament_id"
        });

      if (error) throw error;

      toast.success("Availability saved!");
    } catch (error: any) {
      toast.error("Failed to save availability");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-dark)] flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] relative overflow-hidden">
      <Navigation />
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black gradient-text mb-2">My Availability</h1>
          <p className="text-muted-foreground">Set your available times for tournaments</p>
        </div>

        <Card className="p-6 backdrop-blur-lg border-2 border-primary/30 mb-6">
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
        </Card>

        <Card className="p-6 backdrop-blur-lg border-2 border-primary/30 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Available Time Slots</h3>
            <Button onClick={addTimeSlot} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Slot
            </Button>
          </div>

          <div className="space-y-4">
            {timeSlots.map((slot, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Date</label>
                  <Input
                    type="date"
                    value={slot.date}
                    onChange={(e) => updateTimeSlot(index, "date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">End Time</label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removeTimeSlot(index)}
                    variant="ghost"
                    size="sm"
                    className="w-full hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {timeSlots.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No time slots added yet. Click "Add Slot" to get started.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 backdrop-blur-lg border-2 border-primary/30 mb-6">
          <label className="text-sm font-medium mb-2 block">Additional Notes</label>
          <Textarea
            placeholder="Any scheduling preferences or restrictions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </Card>

        <Button onClick={saveAvailability} variant="gradient" className="w-full h-14 text-lg">
          <Save className="w-5 h-5 mr-2" />
          Save Availability
        </Button>
      </div>
    </div>
  );
};

export default AvailabilityPage;
