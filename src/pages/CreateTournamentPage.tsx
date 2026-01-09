import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Users, Share2, CalendarClock } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { DateTimePicker } from "@/components/DateTimePicker";

const CreateTournamentPage = () => {
  const [tournamentName, setTournamentName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [isCreating, setIsCreating] = useState(false);
  const [registrationOpenAt, setRegistrationOpenAt] = useState<Date | undefined>();
  const [registrationCloseAt, setRegistrationCloseAt] = useState<Date | undefined>();
  const [tournamentStartAt, setTournamentStartAt] = useState<Date | undefined>();
  const navigate = useNavigate();

  const handleCreateTournament = async () => {
    if (!tournamentName.trim()) {
      toast.error("Please enter a tournament name");
      return;
    }
    if (!creatorName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsCreating(true);
    try {
      // Generate a unique creator ID
      const creatorId = `creator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create tournament in database with empty participants - they will self-register
      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          name: tournamentName,
          creator_id: creatorId,
          participants: [],
          matchups: [],
          max_participants: maxParticipants,
          registration_open_at: registrationOpenAt?.toISOString() || null,
          registration_close_at: registrationCloseAt?.toISOString() || null,
          tournament_start_at: tournamentStartAt?.toISOString() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Store creator info in localStorage
      localStorage.setItem(`tournament_${data.id}_creator`, creatorId);
      localStorage.setItem(`tournament_${data.id}_name`, creatorName);

      toast.success("Tournament created! Share the link for players to register 🎉");
      
      // Navigate to the tournament registration page
      navigate(`/tournament/${data.id}`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast.error("Failed to create tournament");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] relative overflow-hidden">
      <Navigation />
      
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      
      <div className="container max-w-2xl mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--gradient-primary)] mb-6 animate-pulse-glow">
              <Trophy className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-black mb-4 gradient-text drop-shadow-lg">
              Create Tournament
            </h1>
            <p className="text-muted-foreground text-xl font-medium">
              Set up your tournament and share the link for players to register
            </p>
          </div>

          {/* Creation Form */}
          <Card className="p-10 backdrop-blur-lg border-2 border-primary/30 shadow-[var(--shadow-intense)]">
            <div className="space-y-8">
              {/* Tournament Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Trophy className="w-4 h-4 text-primary" />
                  Tournament Name
                </label>
                <Input
                  placeholder="e.g., Friday Night Showdown"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="h-12 text-lg border-2 focus:border-primary"
                />
              </div>

              {/* Creator Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-primary" />
                  Your Name (Tournament Host)
                </label>
                <Input
                  placeholder="Enter your name"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="h-12 text-lg border-2 focus:border-primary"
                />
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-primary" />
                  Maximum Participants
                </label>
                <Input
                  type="number"
                  min={2}
                  max={256}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 16)}
                  className="h-12 text-lg border-2 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  How many players can join this tournament (2-256)
                </p>
              </div>

              {/* Registration Schedule Section */}
              <div className="space-y-4 pt-4 border-t-2 border-primary/20">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <CalendarClock className="w-6 h-6 text-primary" />
                  Registration Schedule (Optional)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Set specific times for when players can register. Leave empty for open registration.
                </p>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateTimePicker
                    label="Registration Opens"
                    value={registrationOpenAt}
                    onChange={setRegistrationOpenAt}
                    placeholder="Select open date/time"
                  />
                  <DateTimePicker
                    label="Registration Closes"
                    value={registrationCloseAt}
                    onChange={setRegistrationCloseAt}
                    placeholder="Select close date/time"
                    minDate={registrationOpenAt}
                  />
                </div>
                
                <DateTimePicker
                  label="Tournament Start Time"
                  value={tournamentStartAt}
                  onChange={setTournamentStartAt}
                  placeholder="When does the tournament begin?"
                  minDate={registrationCloseAt || registrationOpenAt}
                />
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Share2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">What happens next?</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>🔗 Share your tournament link with players</li>
                      <li>👥 Players register themselves via the link</li>
                      <li>✨ Generate matchups once everyone has joined</li>
                      <li>🎮 Only you can manage the tournament</li>
                      <li>⏰ Registration window will be enforced automatically</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateTournament}
                disabled={isCreating || !tournamentName.trim() || !creatorName.trim()}
                variant="gradient"
                className="w-full h-16 text-xl font-bold"
                size="lg"
              >
                {isCreating ? (
                  <>Creating Tournament...</>
                ) : (
                  <>
                    <Trophy className="w-6 h-6 mr-2" />
                    Create Tournament 🚀
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentPage;
