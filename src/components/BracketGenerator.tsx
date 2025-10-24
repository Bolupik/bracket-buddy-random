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
    }
  }, [searchParams]);

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
      toast.success(`${name} added to the tournament!`);
      
      // Regenerate tournament if it was already generated
      if (matchups.length > 0) {
        toast.info("Tournament will be regenerated with the new participant");
      }
    } else if (participants.find(p => p.name === name)) {
      toast.error("This name is already in the tournament!");
    }
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
    const oppositeResult = result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw';
    
    setMatchups(matchups.map(matchup => {
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
    }));
    
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
    setMatchups(matchups.map(matchup => ({
      ...matchup,
      matches: matchup.matches.map(match => ({
        ...match,
        completed: false,
        score: undefined,
        result: undefined
      }))
    })));
    toast.info("All match results cleared");
  };

  const resetTournament = () => {
    setMatchups([]);
    setParticipants([]);
    setIsAdmin(false);
    setTournamentCreated(false);
    toast.info("Tournament reset");
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] p-4 md:p-8 relative overflow-hidden">
      <Navigation />
      
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
        <div className="text-center space-y-4 animate-fade-in relative">
          <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
              <span className="bg-[var(--gradient-primary)] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                STACKINGDAO
              </span>
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <p className="text-xl md:text-2xl font-bold text-primary/90 uppercase tracking-widest">
                Pokemon Tournament Draw
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
          </div>
          <p className="text-lg text-foreground/70 font-medium">
            Each participant gets 3 random opponents
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {isAdmin && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border-2 border-primary/40 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-bold text-primary">ADMIN MODE</span>
              </div>
            )}
            {participants.length > 0 && (
              <Button
                onClick={() => navigate("/wheel")}
                variant="gradient"
                size="lg"
                className="gap-2"
              >
                <Award className="w-5 h-5" />
                Winner Selection Wheel
              </Button>
            )}
          </div>
        </div>

        {/* Input Section */}
        <Card className="p-6 shadow-[var(--shadow-intense)] animate-scale-in bg-card/95 backdrop-blur-sm border-2 border-primary/20">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <Input
                  placeholder="Enter participant name..."
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addParticipant()}
                  className="text-lg"
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
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {currentImage ? "Change Image" : "Upload Image"}
                  </Button>
                  
                  {currentImage && (
                    <Avatar className="w-16 h-16 border-2 border-primary">
                      <AvatarImage src={currentImage} alt="Preview" />
                    </Avatar>
                  )}
                </div>
              </div>

              <Button onClick={addParticipant} size="lg" className="md:w-32 h-auto">
                Add Player
              </Button>
            </div>

            {participants.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
                  {participants.map((participant, index) => (
                  <Card
                    key={index}
                    className="p-4 flex items-center gap-3 group hover:shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] animate-slide-in bg-card/80 backdrop-blur-sm border-primary/20"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage src={participant.image} alt={participant.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <span className="font-semibold flex-1 text-foreground">
                        {participant.name}
                      </span>
                      
                      <button
                        onClick={() => removeParticipant(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-md"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </Card>
                  ))}
                </div>

                <Button
                  onClick={generateTournament}
                  variant="gradient"
                  size="lg"
                  className="w-full text-lg font-bold"
                >
                  <Shuffle className="w-5 h-5" />
                  Generate Tournament
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Tournament Display */}
        {matchups.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-foreground">
                  {showLeaderboard ? "Leaderboard" : "Tournament Matchups"}
                </h2>
                <Button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  variant="dark"
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {showLeaderboard ? "View Matchups" : "View Leaderboard"}
                </Button>
                <Button
                  onClick={shareTournament}
                  variant="dark"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              {isAdmin && !showLeaderboard && (
                <div className="flex gap-2">
                  <Button onClick={generateTournament} variant="dark" size="sm">
                    <Shuffle className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button onClick={clearAllResults} variant="dark" size="sm">
                    Clear Results
                  </Button>
                  <Button onClick={resetTournament} variant="destructive" size="sm">
                    Reset All
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
                  className="p-6 space-y-4 hover:shadow-[var(--shadow-intense)] transition-all animate-scale-in bg-card/90 backdrop-blur-sm border-2 border-primary/20"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Main Participant */}
                  <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border-2 border-primary/30 shadow-[var(--shadow-glow)]">
                    <Avatar className="w-16 h-16 border-2 border-primary">
                      <AvatarImage src={matchup.participant.image} alt={matchup.participant.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Player</p>
                      <p className="text-xl font-bold text-foreground">
                        {matchup.participant.name}
                      </p>
                    </div>
                  </div>

                  {/* Opponents */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Matches ({matchup.matches.filter(m => m.completed).length}/{matchup.matches.length} completed)
                    </p>
                    {matchup.matches.map((match, matchIndex) => (
                      <MatchCard
                        key={matchIndex}
                        match={match}
                        participantName={matchup.participant.name}
                        onUpdateResult={updateMatchResult}
                        isAdmin={isAdmin}
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
