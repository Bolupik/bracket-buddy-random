import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { RegistrationCountdown, canRegister } from "@/components/RegistrationCountdown";
import { EditTournamentDialog } from "@/components/EditTournamentDialog";
import { 
  Trophy, 
  Users, 
  Calendar, 
  User, 
  Copy, 
  Check, 
  Clock,
  Mail
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  participants: any;
  registered_users: any;
  matchups: any;
  created_at: string;
  creator_id: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  tournament_start_at: string | null;
}

interface Participant {
  name: string;
  image?: string;
  email?: string;
}

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const TournamentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTournament(id);
      checkIfCreator(id);
    }
  }, [id]);

  // Real-time subscription for tournament updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`tournament-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setTournament(payload.new as Tournament);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchTournament = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error: any) {
      toast.error("Tournament not found");
      navigate("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  const checkIfCreator = (tournamentId: string) => {
    const creatorId = localStorage.getItem(`tournament_${tournamentId}_creator`);
    setIsCreator(!!creatorId);
  };

  const handleJoinTournament = async () => {
    const trimmedName = participantName.trim();
    const trimmedEmail = participantEmail.trim();

    if (!tournament || !trimmedName) {
      toast.error("Please enter your name");
      return;
    }

    // Validate name length
    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    // Validate email if provided
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check registration window
    if (!canRegister(tournament.registration_open_at, tournament.registration_close_at)) {
      toast.error("Registration is not currently open for this tournament");
      return;
    }

    const participants: Participant[] = Array.isArray(tournament.participants) 
      ? tournament.participants 
      : [];

    // Check if name already exists (case-insensitive)
    if (participants.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("This name is already registered!");
      return;
    }

    // Check if email already registered (if provided)
    if (trimmedEmail && participants.some((p) => p.email?.toLowerCase() === trimmedEmail.toLowerCase())) {
      toast.error("This email is already registered!");
      return;
    }

    // Check if tournament is full
    if (participants.length >= tournament.max_participants) {
      toast.error("Tournament is full!");
      return;
    }

    setSubmitting(true);
    try {
      const newParticipant: Participant = {
        name: trimmedName,
        email: trimmedEmail || undefined,
      };

      const updatedParticipants = [...participants, newParticipant];

      const { error } = await supabase
        .from("tournaments")
        .update({
          participants: updatedParticipants as any,
        })
        .eq("id", tournament.id);

      if (error) {
        // Check if it's an RLS error (registration window closed on server side)
        if (error.code === "42501" || error.message.includes("policy")) {
          toast.error("Registration window has closed");
          fetchTournament(tournament.id);
          return;
        }
        throw error;
      }

      // Save to localStorage so they're recognized
      localStorage.setItem(`tournament_${tournament.id}_user`, trimmedName);

      toast.success(`🎉 Welcome to ${tournament.name}, ${trimmedName}!`, {
        description: trimmedEmail ? "You'll receive reminder emails before the tournament starts." : undefined,
      });
      setParticipantName("");
      setParticipantEmail("");
      fetchTournament(tournament.id);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to join tournament");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRegistrationLink = () => {
    const url = `${window.location.origin}/tournament/${tournament?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Registration link copied to clipboard! 🔗");
    setTimeout(() => setCopied(false), 2000);
  };

  const viewBracket = () => {
    navigate(`/?tournament=${tournament?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-dark)] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-xl">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[var(--gradient-dark)] flex items-center justify-center">
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl font-semibold mb-2">Tournament not found</p>
          <Button onClick={() => navigate("/tournaments")}>Browse Tournaments</Button>
        </Card>
      </div>
    );
  }

  const participants: Participant[] = Array.isArray(tournament.participants) 
    ? tournament.participants 
    : [];
  const participantCount = participants.length;
  const isFull = participantCount >= tournament.max_participants;
  const registrationOpen = canRegister(tournament.registration_open_at, tournament.registration_close_at);
  const hasMatchups = tournament.matchups && Array.isArray(tournament.matchups) && tournament.matchups.length > 0;

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] relative overflow-hidden">
      <Navigation />
      <div className="fixed inset-0 bg-[var(--gradient-hero)] pointer-events-none" />

      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Tournament Header */}
        <Card className="p-8 mb-8 backdrop-blur-lg border-2 border-primary/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-10 h-10 text-primary" />
                <h1 className="text-4xl font-black gradient-text">{tournament.name}</h1>
              </div>
              
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">
                    {participantCount} / {tournament.max_participants} players
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(tournament.created_at).toLocaleDateString()}</span>
                </div>
                {tournament.tournament_start_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>Starts: {new Date(tournament.tournament_start_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={tournament.status === "registration" ? "default" : "secondary"}>
                  {tournament.status === "registration" ? "Registration Open" : tournament.status}
                </Badge>
                {isFull && <Badge variant="destructive">Full</Badge>}
                {hasMatchups && <Badge variant="outline">Tournament Started</Badge>}
              </div>
            </div>

            {/* Admin Actions */}
            {isCreator && (
              <div className="flex flex-col gap-3">
                <EditTournamentDialog
                  tournament={tournament}
                  onUpdate={() => fetchTournament(tournament.id)}
                />
                <Button onClick={copyRegistrationLink} variant="outline" className="gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Registration Link"}
                </Button>
                {hasMatchups && (
                  <Button onClick={viewBracket} variant="gradient" className="gap-2">
                    <Trophy className="w-4 h-4" />
                    View Bracket
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Registration Countdown */}
        <div className="mb-8">
          <RegistrationCountdown
            registrationOpenAt={tournament.registration_open_at}
            registrationCloseAt={tournament.registration_close_at}
            tournamentStartAt={tournament.tournament_start_at}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Join Tournament Form */}
          <Card className="p-6 backdrop-blur-lg border-2 border-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Join Tournament</h2>
            </div>

            {!registrationOpen ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  Registration is currently closed
                </p>
              </div>
            ) : isFull ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">
                  Tournament is full
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name / Team Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter your name..."
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !submitting && participantName.trim() && handleJoinTournament()}
                      className="pl-10"
                      maxLength={50}
                      disabled={submitting}
                    />
                  </div>
                  {participantName.trim().length > 0 && participantName.trim().length < 2 && (
                    <p className="text-xs text-destructive mt-1">Name must be at least 2 characters</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email (recommended)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      className="pl-10"
                      maxLength={100}
                      disabled={submitting}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    📧 Get reminders before the tournament starts!
                  </p>
                  {participantEmail && !isValidEmail(participantEmail) && (
                    <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
                  )}
                </div>

                <Button
                  onClick={handleJoinTournament}
                  disabled={!participantName.trim() || participantName.trim().length < 2 || submitting || (participantEmail && !isValidEmail(participantEmail))}
                  variant="gradient"
                  size="lg"
                  className="w-full"
                >
                  {submitting ? "Joining..." : "🎮 Join Tournament"}
                </Button>
              </div>
            )}
          </Card>

          {/* Registered Participants */}
          <Card className="p-6 backdrop-blur-lg border-2 border-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">
                Participants ({participantCount}/{tournament.max_participants})
              </h2>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Be the first to join!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {participants.map((participant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/20"
                  >
                    <Avatar className="w-10 h-10 border-2 border-primary/30">
                      <AvatarImage src={participant.image} alt={participant.name} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {participant.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{participant.name}</p>
                      {index === 0 && (
                        <p className="text-xs text-muted-foreground">First to join!</p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* View Bracket Button */}
        {hasMatchups && (
          <Card className="p-6 mt-8 backdrop-blur-lg border-2 border-primary/30 text-center">
            <h3 className="text-xl font-bold mb-4">Tournament has started!</h3>
            <Button onClick={viewBracket} variant="gradient" size="lg">
              <Trophy className="w-5 h-5 mr-2" />
              View Tournament Bracket
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TournamentPage;
