import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Shuffle, Upload, User, Award, BarChart3, Share2, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MatchCard } from "./MatchCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import stackingBanner from "@/assets/stacking-banner.png";
import { StackingDaoAd } from "./StackingDaoAd";
import { ScrollingToolAds } from "./SponsorAds";
import { Leaderboard } from "./Leaderboard";
import { Navigation } from "./Navigation";
import { supabase } from "@/integrations/supabase/client";
import { JoinTournamentDialog } from "./JoinTournamentDialog";

interface Participant {
  name: string;
  image?: string;
}

interface Match {
  opponent: Participant;
  completed: boolean;
  score?: string;
  result?: 'win' | 'loss' | 'draw';
}

interface MatchUp {
  participant: Participant;
  matches: Match[];
}

export const BracketGenerator = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [matchups, setMatchups] = useState<MatchUp[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [tournamentCreated, setTournamentCreated] = useState(false);
  const [pokemonImages, setPokemonImages] = useState<string[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [tournamentName, setTournamentName] = useState("");
  const [userName, setUserName] = useState<string>("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Fetch random Pokemon images
  useEffect(() => {
    const fetchPokemon = async () => {
      const images: string[] = [];
      const randomIds = Array.from({ length: 20 }, () => Math.floor(Math.random() * 898) + 1);
      
      for (const id of randomIds) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const data = await response.json();
          images.push(data.sprites.other['official-artwork'].front_default);
        } catch (error) {
          console.error('Failed to fetch Pokemon:', error);
        }
      }
      
      setPokemonImages(images);
    };
    
    fetchPokemon();
  }, []);

  // Load participants from localStorage
  useEffect(() => {
    const savedParticipants = localStorage.getItem("tournamentParticipants");
    if (savedParticipants) {
      setParticipants(JSON.parse(savedParticipants));
    }
  }, []);

  // Load tournament from URL parameter (from database)
  useEffect(() => {
    const tournamentParam = searchParams.get('tournament');
    if (tournamentParam) {
      loadTournamentFromDatabase(tournamentParam);
      
      // Check if user is the creator
      const creatorId = localStorage.getItem(`tournament_${tournamentParam}_creator`);
      const savedName = localStorage.getItem(`tournament_${tournamentParam}_name`);
      
      if (creatorId) {
        setIsCreator(true);
        setUserName(savedName || 'Host');
      } else {
        // Check if user has joined
        const joinedName = localStorage.getItem(`tournament_${tournamentParam}_user`);
        if (joinedName) {
          setUserName(joinedName);
        } else {
          // Show join dialog after a short delay to load tournament name
          setTimeout(() => setShowJoinDialog(true), 500);
        }
      }
    }
  }, [searchParams]);

  // Real-time subscription for tournament updates
  useEffect(() => {
    if (!tournamentId) return;

    console.log('Setting up real-time subscription for tournament:', tournamentId);
    
    const channel = supabase
      .channel('tournament-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload) => {
          console.log('Real-time tournament update received:', payload);
          const updated = payload.new;
          setMatchups(updated.matchups as unknown as MatchUp[]);
          setParticipants(updated.participants as unknown as Participant[]);
          toast.info('Tournament updated by another user');
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const loadTournamentFromDatabase = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setMatchups(data.matchups as unknown as MatchUp[]);
        setParticipants(data.participants as unknown as Participant[]);
        setTournamentName(data.name);
        setTournamentCreated(true);
        setTournamentId(id);
        
        // Check if current user is the creator
        const storedCreatorId = localStorage.getItem(`tournament_${id}_creator`);
        if (storedCreatorId && data.creator_id === storedCreatorId) {
          setIsCreator(true);
        }
        
        toast.success(`Tournament "${data.name}" loaded!`);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error("Tournament not found");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addParticipant = () => {
    const name = currentName.trim();
    if (name && !participants.find(p => p.name === name)) {
      const newParticipants = [...participants, { name, image: currentImage }];
      setParticipants(newParticipants);
      localStorage.setItem("tournamentParticipants", JSON.stringify(newParticipants));
      setCurrentName("");
      setCurrentImage(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // If tournament is already generated, add the participant to it
      if (matchups.length > 0) {
        addParticipantToTournament({ name, image: currentImage }, newParticipants);
      } else {
        toast.success(`${name} added to the tournament!`);
      }
    } else if (participants.find(p => p.name === name)) {
      toast.error("This name is already in the tournament!");
    }
  };

  const addParticipantToTournament = (newParticipant: Participant, updatedParticipantsList: Participant[]) => {
    // Find participants who have less than 3 matches
    const participantsWithAvailableSlots = matchups
      .filter(m => m.matches.length < 3)
      .map(m => m.participant);
    
    // If everyone has 3 matches, pick random participants
    let opponents: Participant[];
    if (participantsWithAvailableSlots.length >= 3) {
      opponents = shuffleArray(participantsWithAvailableSlots).slice(0, 3);
    } else {
      // Pick random participants from existing participants
      const existingParticipants = matchups.map(m => m.participant);
      opponents = shuffleArray([...existingParticipants]).slice(0, Math.min(3, existingParticipants.length));
    }
    
    // Create matches for the new participant
    const newParticipantMatches: Match[] = opponents.map(opponent => ({
      opponent,
      completed: false,
      score: undefined,
      result: undefined as 'win' | 'loss' | 'draw' | undefined
    }));
    
    // Add the new participant's matchup
    const updatedMatchups: MatchUp[] = [
      ...matchups.map(matchup => {
        // Add reciprocal match if this participant is facing the new one
        if (opponents.some(opp => opp.name === matchup.participant.name)) {
          return {
            ...matchup,
            matches: [...matchup.matches, {
              opponent: newParticipant,
              completed: false,
              score: undefined,
              result: undefined as 'win' | 'loss' | 'draw' | undefined
            }]
          };
        }
        return matchup;
      }),
      {
        participant: newParticipant,
        matches: newParticipantMatches
      }
    ];
    
    setMatchups(updatedMatchups);
    // Use the updated participants list passed from addParticipant
    updateTournamentInDatabase(updatedMatchups, updatedParticipantsList);
    toast.success(`🎉 ${newParticipant.name} added with ${opponents.length} matches!`);
  };

  const removeParticipant = (index: number) => {
    const removed = participants[index];
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
    localStorage.setItem("tournamentParticipants", JSON.stringify(newParticipants));
    toast.info(`${removed.name} removed from tournament`);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const updateMatchResult = (
    participantName: string,
    opponentName: string,
    score: string,
    result: 'win' | 'loss' | 'draw'
  ) => {
    const oppositeResult: 'win' | 'loss' | 'draw' = result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw';
    
    const updatedMatchups: MatchUp[] = matchups.map(matchup => {
      if (matchup.participant.name === participantName) {
        return {
          ...matchup,
          matches: matchup.matches.map(match =>
            match.opponent.name === opponentName
              ? { ...match, completed: true, score, result }
              : match
          ),
        };
      }
      // Also update for the opponent's matchup with opposite result
      if (matchup.participant.name === opponentName) {
        return {
          ...matchup,
          matches: matchup.matches.map(match =>
            match.opponent.name === participantName
              ? { ...match, completed: true, score, result: oppositeResult }
              : match
          ),
        };
      }
      return matchup;
    });
    
    setMatchups(updatedMatchups);
    updateTournamentInDatabase(updatedMatchups, participants);
    toast.success(`Match result recorded: ${score}`);
  };

  const generateTournament = () => {
    // Redirect to create page instead
    navigate('/create');
    toast.info("Please use the Create page to start a new tournament");
  };

  const saveTournamentToDatabase = async (tournamentMatchups: MatchUp[]) => {
    try {
      const tournamentName = `Tournament ${new Date().toLocaleDateString()}`;
      
      // This function is only called from generateTournament which shouldn't be accessible anymore
      // Tournaments should now be created from the CreateTournamentPage
      toast.error("Please create tournaments from the Create page");
    } catch (error) {
      console.error('Error saving tournament:', error);
      toast.error("Failed to save tournament");
    }
  };

  const updateTournamentInDatabase = async (updatedMatchups: MatchUp[], updatedParticipants?: Participant[]) => {
    if (!tournamentId) return;
    
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          matchups: updatedMatchups as any,
          participants: (updatedParticipants || participants) as any
        })
        .eq('id', tournamentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast.error("Failed to update tournament");
    }
  };

  const shareTournament = () => {
    if (!tournamentId) {
      toast.error("No tournament to share");
      return;
    }
    
    // Use the new registration page URL
    const url = `${window.location.origin}/tournament/${tournamentId}`;
    navigator.clipboard.writeText(url);
    toast.success("Registration link copied to clipboard! 🔗");
  };

  const sendEmailBackup = async () => {
    if (!tournamentId || !tournamentName) {
      toast.error("No tournament to backup");
      return;
    }

    try {
      toast.loading("Sending backup email...");
      
      const { error } = await supabase.functions.invoke('send-tournament-backup', {
        body: {
          tournamentName,
          tournamentId,
          participants,
          matchups
        }
      });

      if (error) throw error;

      toast.success("Tournament backup sent to ajayibolu22@gmail.com! 📧");
    } catch (error) {
      console.error('Error sending backup:', error);
      toast.error("Failed to send backup email");
    }
  };

  const clearAllResults = () => {
    const clearedMatchups = matchups.map(matchup => ({
      ...matchup,
      matches: matchup.matches.map(match => ({
        ...match,
        completed: false,
        score: undefined,
        result: undefined
      }))
    }));
    setMatchups(clearedMatchups);
    updateTournamentInDatabase(clearedMatchups, participants);
    toast.info("All match results cleared");
  };

  const resetTournament = () => {
    navigate('/create');
    toast.info("Create a new tournament");
  };

  const handleJoinTournament = (name: string) => {
    setUserName(name);
    if (tournamentId) {
      localStorage.setItem(`tournament_${tournamentId}_user`, name);
    }
    setShowJoinDialog(false);
    toast.success(`Welcome, ${name}!`);
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] relative overflow-hidden noise-overlay">
      {/* Scrolling Sponsor Ads at Top */}
      <ScrollingToolAds />
      
      <div className="p-4 md:p-8">
      <Navigation />
      
      {/* Join Tournament Dialog */}
      <JoinTournamentDialog
        open={showJoinDialog}
        tournamentName={tournamentName || "Tournament"}
        onJoin={handleJoinTournament}
      />
      
      {/* Pokemon Background */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0">
        {pokemonImages.map((img, index) => {
          const animations = ['animate-float-drift', 'animate-float-spin', 'animate-float-bounce', 'animate-float-zigzag'];
          const randomAnimation = animations[index % animations.length];
          const size = 80 + (index * 7) % 100;
          const top = (index * 17) % 100;
          const left = (index * 23) % 100;
          const delay = (index * 0.7) % 8;
          const duration = 15 + (index * 3) % 15;
          
          return (
            <img
              key={index}
              src={img}
              alt=""
              className={`absolute ${randomAnimation} drop-shadow-lg`}
              style={{
                width: `${size}px`,
                top: `${top}%`,
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.2))',
              }}
            />
          );
        })}
      </div>
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Stacking DAO Ad */}
        <div className="w-full animate-fade-in">
          <StackingDaoAd />
        </div>

        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in relative pt-8">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              🎮 Tournament Time! 🎮
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl mx-auto">
            Everyone gets 3 fun matches! Add your friends and let's start! 🌟
          </p>
          
          {/* Status badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {userName && tournamentId && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">{userName}</span>
              </div>
            )}
            {participants.length > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">{participants.length} Players</span>
              </div>
            )}
          </div>
        </div>

        {/* Welcome message for non-creators */}
        {!tournamentCreated && !isCreator && (
          <Card className="p-10 glass border-primary/20 animate-scale-in">
            <div className="text-center space-y-5">
              <div className="text-5xl">🎮</div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome to Tournament View!</h2>
              <p className="text-muted-foreground text-lg">Use a tournament link to join, or create your own</p>
              <Button
                onClick={() => navigate('/create')}
                size="lg"
                className="text-lg px-8 py-5 h-auto font-bold mt-2"
              >
                ✨ Create New Tournament
              </Button>
            </div>
          </Card>
        )}

        {/* Input Section - Only show for creators */}
        {isCreator && (
          <Card className="p-8 shadow-xl animate-scale-in glass-strong border-primary/20">
            {tournamentCreated && matchups.length > 0 && (
              <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-bold text-lg text-primary">Add New Players</p>
                    <p className="text-sm text-foreground/70">New players will automatically get 3 random matches</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <Input
                  placeholder="Type a player name here... 😊"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addParticipant()}
                  className="text-xl h-16 text-center font-semibold border-2"
                />
                
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-16 text-lg border-2"
                  >
                    <Upload className="w-6 h-6 mr-2" />
                    {currentImage ? "📷 Change Photo" : "📷 Add Photo (Optional)"}
                  </Button>
                  
                  {currentImage && (
                    <Avatar className="w-20 h-20 border-4 border-primary shadow-lg">
                      <AvatarImage src={currentImage} alt="Preview" />
                    </Avatar>
                  )}
                </div>
                
                <Button
                  onClick={addParticipant}
                  disabled={!currentName}
                  variant={matchups.length > 0 ? "gradient" : "default"}
                  size="lg"
                  className="w-full h-16 text-xl font-bold"
                >
                  <User className="w-6 h-6 mr-3" />
                  {matchups.length > 0 ? "➕ Add Player to Tournament" : "➕ Add Player"}
                </Button>
              </div>

              {participants.length > 0 && !tournamentCreated && (
                <>
                  <div className="pt-4 border-t-2 border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-3xl">👥</span>
                        Players ({participants.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {participants.map((participant, index) => (
                        <Card
                          key={index}
                          className="p-5 hover:shadow-xl transition-all duration-200 border-2 border-primary/30 bg-gradient-to-br from-card/80 to-primary/5"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-3 border-primary/40 shadow-lg">
                              <AvatarImage src={participant.image} alt={participant.name} />
                              <AvatarFallback className="bg-primary/30 text-primary font-bold text-xl">
                                {participant.name[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-bold text-lg">
                                {participant.name}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="lg"
                              onClick={() => removeParticipant(index)}
                              className="hover:bg-destructive/20 hover:text-destructive h-12 w-12"
                            >
                              <Trash2 className="w-6 h-6" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Tournament Display */}
        {matchups.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 glass border-primary/20">
              <div className="text-center space-y-3">
                <div className="text-4xl">⚔️</div>
                <h2 className="text-3xl font-black tracking-tight">
                  Battle Matches!
                </h2>
                <div className="inline-flex items-center gap-3 px-5 py-2.5 glass rounded-full">
                  <span className="text-xl">✅</span>
                  <p className="text-lg font-bold">
                    {matchups.reduce((acc, m) => acc + m.matches.filter(match => match.completed).length, 0)} / {matchups.reduce((acc, m) => acc + m.matches.length, 0)} Matches Done
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={shareTournament}
                size="lg"
                className="h-20 text-lg font-bold"
              >
                <Share2 className="w-6 h-6 mr-2" />
                📋 Copy Registration Link
              </Button>
              <Button
                onClick={sendEmailBackup}
                size="lg"
                variant="gradient"
                className="h-20 text-lg font-bold"
              >
                <Mail className="w-6 h-6 mr-2" />
                📧 Email Backup
              </Button>
              <Button
                onClick={() => navigate("/wheel")}
                size="lg"
                className="h-20 text-lg font-bold"
              >
                <Award className="w-6 h-6 mr-2" />
                🎡 Pick Winner
              </Button>
              <Button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                variant="outline"
                size="lg"
                className="h-20 text-lg font-bold border-2"
              >
                <BarChart3 className="w-6 h-6 mr-2" />
                {showLeaderboard ? "📊 Hide Scores" : "📊 Show Scores"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {isCreator && !showLeaderboard && (
                <div className="flex gap-3 flex-wrap justify-center w-full">
                  <Button onClick={clearAllResults} variant="outline" size="lg" className="h-16 border-2">
                    <Trash2 className="w-5 h-5 mr-2" />
                    🔄 Clear Results
                  </Button>
                  <Button onClick={resetTournament} variant="destructive" size="lg" className="h-16">
                    <Shuffle className="w-5 h-5 mr-2" />
                    ♻️ New Tournament
                  </Button>
                </div>
              )}
            </div>
            
            {showLeaderboard ? (
              <Leaderboard matchups={matchups} tournamentName={tournamentName} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {matchups.map((matchup, index) => (
                <Card
                  key={index}
                  className="p-6 space-y-5 glass border-primary/15 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Main Participant */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <Avatar className="w-16 h-16 border-2 border-primary/30 shadow-md">
                      <AvatarImage src={matchup.participant.image} alt={matchup.participant.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                        {matchup.participant.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">⭐ Player</p>
                      <p className="text-xl font-black text-foreground">
                        {matchup.participant.name}
                      </p>
                    </div>
                  </div>

                  {/* Opponents */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 py-2 px-4 glass rounded-lg">
                      <span className="text-lg">⚔️</span>
                      <p className="text-sm font-bold text-foreground">
                        Battles: {matchup.matches.filter(m => m.completed).length}/{matchup.matches.length}
                      </p>
                    </div>
                    {matchup.matches.map((match, matchIndex) => (
                      <MatchCard
                      key={matchIndex}
                        match={match}
                        participantName={matchup.participant.name}
                        onUpdateResult={updateMatchResult}
                        isAdmin={isCreator}
                      />
                    ))}
                  </div>
                </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      </div>
    </div>
  );
};
