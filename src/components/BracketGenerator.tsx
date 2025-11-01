import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Shuffle, Upload, User, Award, BarChart3, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MatchCard } from "./MatchCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import stackingBanner from "@/assets/stacking-banner.png";
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
  const [isAdmin, setIsAdmin] = useState(false);
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
    const id = searchParams.get('id');
    if (id) {
      loadTournamentFromDatabase(id);
      
      // Check if user has a saved name for this tournament
      const savedName = localStorage.getItem(`tournament_${id}_user`);
      if (savedName) {
        setUserName(savedName);
      } else {
        // Show join dialog after a short delay to load tournament name
        setTimeout(() => setShowJoinDialog(true), 500);
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
        addParticipantToTournament({ name, image: currentImage });
      } else {
        toast.success(`${name} added to the tournament!`);
      }
    } else if (participants.find(p => p.name === name)) {
      toast.error("This name is already in the tournament!");
    }
  };

  const addParticipantToTournament = (newParticipant: Participant) => {
    // Find participants who have less than 3 matches
    const participantsWithAvailableSlots = matchups
      .filter(m => m.matches.length < 3)
      .map(m => m.participant);
    
    // If everyone has 3 matches, pick random participants
    let opponents: Participant[];
    if (participantsWithAvailableSlots.length >= 3) {
      opponents = shuffleArray(participantsWithAvailableSlots).slice(0, 3);
    } else {
      // Pick random participants, prioritizing those with fewer matches
      opponents = shuffleArray([...participants]).slice(0, 3);
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
    updateTournamentInDatabase(updatedMatchups);
    toast.success(`${newParticipant.name} added to the tournament with 3 matches!`);
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
    updateTournamentInDatabase(updatedMatchups);
    toast.success(`Match result recorded: ${score}`);
  };

  const generateTournament = () => {
    if (participants.length < 4) {
      toast.error("Add at least 4 participants to create a tournament!");
      return;
    }

    // Track fights for each participant
    const fightCount: { [name: string]: number } = {};
    const participantOpponents: { [name: string]: Set<string> } = {};
    
    participants.forEach(p => {
      fightCount[p.name] = 0;
      participantOpponents[p.name] = new Set();
    });

    // Shuffle participants for randomness
    const shuffled = shuffleArray([...participants]);
    
    // Create matchups ensuring each participant has exactly 3 fights
    const attempts = shuffled.length * 10; // Prevent infinite loops
    let attempt = 0;
    
    while (attempt < attempts && Object.values(fightCount).some(count => count < 3)) {
      attempt++;
      
      // Find participants who need more fights
      const needFights = shuffled.filter(p => fightCount[p.name] < 3);
      
      for (let i = 0; i < needFights.length; i++) {
        const p1 = needFights[i];
        
        if (fightCount[p1.name] >= 3) continue;
        
        // Find a valid opponent
        for (let j = i + 1; j < needFights.length; j++) {
          const p2 = needFights[j];
          
          if (fightCount[p2.name] >= 3) continue;
          if (participantOpponents[p1.name].has(p2.name)) continue;
          
          // Create the matchup
          participantOpponents[p1.name].add(p2.name);
          participantOpponents[p2.name].add(p1.name);
          fightCount[p1.name]++;
          fightCount[p2.name]++;
          break;
        }
      }
    }

    // Build the final matchup structure
    const newMatchups: MatchUp[] = participants.map(participant => ({
      participant,
      matches: Array.from(participantOpponents[participant.name])
        .map(name => participants.find(p => p.name === name)!)
        .filter(Boolean)
        .map(opponent => ({ opponent, completed: false })),
    }));

    setMatchups(newMatchups);
    setTournamentCreated(true);
    setIsAdmin(true);
    
    // Save tournament to database
    saveTournamentToDatabase(newMatchups);
    
    toast.success("Tournament matchups generated! Each player has exactly 3 fights.");
  };

  const saveTournamentToDatabase = async (tournamentMatchups: MatchUp[]) => {
    try {
      const tournamentName = `Tournament ${new Date().toLocaleDateString()}`;
      
      const { data, error } = await supabase
        .from('tournaments')
        .insert([{
          name: tournamentName,
          participants: participants as any,
          matchups: tournamentMatchups as any
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTournamentId(data.id);
        toast.success("Tournament saved to database!");
      }
    } catch (error) {
      console.error('Error saving tournament:', error);
      toast.error("Failed to save tournament");
    }
  };

  const updateTournamentInDatabase = async (updatedMatchups: MatchUp[]) => {
    if (!tournamentId) return;
    
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          matchups: updatedMatchups as any,
          participants: participants as any
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
      toast.error("Please generate a tournament first");
      return;
    }
    
    const url = `${window.location.origin}/?id=${tournamentId}`;
    navigator.clipboard.writeText(url);
    toast.success("Shareable tournament link copied to clipboard! 🔗");
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
    updateTournamentInDatabase(clearedMatchups);
    toast.info("All match results cleared");
  };

  const resetTournament = () => {
    setMatchups([]);
    setParticipants([]);
    setIsAdmin(false);
    setTournamentCreated(false);
    toast.info("Tournament reset");
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
    <div className="min-h-screen bg-[var(--gradient-dark)] p-4 md:p-8 relative overflow-hidden">
      <Navigation />
      
      {/* Join Tournament Dialog */}
      <JoinTournamentDialog
        open={showJoinDialog}
        tournamentName={tournamentName || "Tournament"}
        onJoin={handleJoinTournament}
      />
      
      {/* Pokemon Background */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0">
        {pokemonImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt=""
            className="absolute animate-float"
            style={{
              width: `${80 + Math.random() * 120}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Banner Image */}
        <div className="w-full animate-fade-in">
          <img 
            src={stackingBanner} 
            alt="STACKING DAO" 
            className="w-full h-auto rounded-lg shadow-[var(--shadow-intense)] border-2 border-primary/30"
          />
        </div>

        {/* Header */}
        <div className="text-center space-y-6 animate-fade-in relative">
          <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              <span className="bg-[var(--gradient-primary)] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                🎮 Tournament Time! 🎮
              </span>
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-4">
              Create Your Pokemon Battle!
            </p>
          </div>
          <p className="text-xl text-foreground/80 font-medium max-w-2xl mx-auto">
            Everyone gets 3 fun matches! Add your friends and let's start! 🌟
          </p>
          
          {/* Status badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {userName && tournamentId && (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-accent/30 border-2 border-accent shadow-lg">
                <User className="w-5 h-5 text-accent" />
                <span className="text-base font-bold text-accent">{userName}</span>
              </div>
            )}
            {participants.length > 0 && (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary/30 border-2 border-primary shadow-lg">
                <User className="w-5 h-5 text-primary" />
                <span className="text-base font-bold text-primary">{participants.length} Players</span>
              </div>
            )}
          </div>
        </div>

        {/* Step-by-step guidance */}
        {!tournamentCreated && participants.length === 0 && (
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 shadow-xl animate-scale-in">
            <div className="text-center space-y-4">
              <div className="text-6xl">👥</div>
              <h2 className="text-3xl font-bold">Step 1: Add Players!</h2>
              <p className="text-xl text-foreground/70">Type a name and click "Add Player" (Need at least 4 players)</p>
            </div>
          </Card>
        )}

        {/* Input Section - Simplified */}
        <Card className="p-8 shadow-2xl animate-scale-in bg-card/95 backdrop-blur-sm border-3 border-primary/30">
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
                size="lg"
                className="w-full h-16 text-xl font-bold"
              >
                <User className="w-6 h-6 mr-3" />
                {matchups.length > 0 ? "➕ Add to Tournament" : "➕ Add Player"}
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

                {participants.length >= 4 ? (
                  <Card className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border-3 border-primary shadow-xl">
                    <div className="text-center space-y-4">
                      <div className="text-6xl">🎯</div>
                      <h2 className="text-3xl font-bold">Ready to Create Matches!</h2>
                      <p className="text-xl text-foreground/70">Click to make the tournament!</p>
                      <Button
                        onClick={generateTournament}
                        size="lg"
                        className="text-2xl px-12 py-8 shadow-2xl h-auto font-bold"
                      >
                        <Shuffle className="w-8 h-8 mr-3" />
                        🎲 Create Tournament! 🎲
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 text-center border-3 border-dashed border-primary/40 bg-card/70">
                    <div className="text-5xl mb-4">👋</div>
                    <p className="text-2xl font-semibold text-foreground">
                      Need {4 - participants.length} more player{4 - participants.length !== 1 ? 's' : ''} to start! 
                    </p>
                    <p className="text-xl text-muted-foreground mt-2">Keep adding friends! 🌟</p>
                  </Card>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Tournament Display */}
        {matchups.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/30 shadow-xl">
              <div className="text-center space-y-3">
                <div className="text-5xl">⚔️</div>
                <h2 className="text-4xl font-black">
                  Battle Matches!
                </h2>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-card/80 rounded-full border-2 border-primary/40">
                  <span className="text-2xl">✅</span>
                  <p className="text-xl font-bold">
                    {matchups.reduce((acc, m) => acc + m.matches.filter(match => match.completed).length, 0)} / {matchups.reduce((acc, m) => acc + m.matches.length, 0)} Matches Done
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={shareTournament}
                size="lg"
                className="h-20 text-lg font-bold"
              >
                <Share2 className="w-6 h-6 mr-2" />
                🔗 Share Link
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
              {isAdmin && !showLeaderboard && (
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
              <Leaderboard matchups={matchups} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {matchups.map((matchup, index) => (
                <Card
                  key={index}
                  className="p-6 space-y-5 hover:shadow-2xl transition-all animate-scale-in bg-gradient-to-br from-card/90 to-primary/5 backdrop-blur-sm border-3 border-primary/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Main Participant */}
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border-3 border-primary/40 shadow-lg">
                    <Avatar className="w-20 h-20 border-4 border-primary shadow-md">
                      <AvatarImage src={matchup.participant.image} alt={matchup.participant.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                        {matchup.participant.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base text-foreground/60 font-semibold">⭐ Player</p>
                      <p className="text-2xl font-black text-foreground">
                        {matchup.participant.name}
                      </p>
                    </div>
                  </div>

                  {/* Opponents */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                      <span className="text-2xl">⚔️</span>
                      <p className="text-lg font-bold text-foreground">
                        Battles: {matchup.matches.filter(m => m.completed).length}/{matchup.matches.length}
                      </p>
                    </div>
                    {matchup.matches.map((match, matchIndex) => (
                      <MatchCard
                      key={matchIndex}
                        match={match}
                        participantName={matchup.participant.name}
                        onUpdateResult={updateMatchResult}
                        isAdmin={true}
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
  );
};
