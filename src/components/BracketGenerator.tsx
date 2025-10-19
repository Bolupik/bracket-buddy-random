import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Shuffle, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Participant {
  name: string;
  image?: string;
}

interface MatchUp {
  participant: Participant;
  opponents: Participant[];
}

export const BracketGenerator = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [matchups, setMatchups] = useState<MatchUp[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setParticipants([...participants, { name, image: currentImage }]);
      setCurrentName("");
      setCurrentImage(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success(`${name} added to the tournament!`);
    } else if (participants.find(p => p.name === name)) {
      toast.error("This name is already in the tournament!");
    }
  };

  const removeParticipant = (index: number) => {
    const removed = participants[index];
    setParticipants(participants.filter((_, i) => i !== index));
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
      opponents: Array.from(participantOpponents[participant.name])
        .map(name => participants.find(p => p.name === name)!)
        .filter(Boolean),
    }));

    setMatchups(newMatchups);
    toast.success("Tournament matchups generated! Each player has exactly 3 fights.");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tournament Generator
          </h1>
          <p className="text-xl text-muted-foreground">
            Each participant gets 3 random opponents
          </p>
        </div>

        {/* Input Section */}
        <Card className="p-6 shadow-[var(--shadow-glow)] animate-scale-in">
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
                      className="p-4 flex items-center gap-3 group hover:shadow-lg transition-all hover:scale-[1.02] animate-slide-in"
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
            <h2 className="text-3xl font-bold text-center text-foreground">
              Tournament Matchups
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {matchups.map((matchup, index) => (
                <Card
                  key={index}
                  className="p-6 space-y-4 hover:shadow-xl transition-all animate-scale-in bg-gradient-to-br from-card to-card/80"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Main Participant */}
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
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
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Opponents
                    </p>
                    {matchup.opponents.map((opponent, oppIndex) => (
                      <div
                        key={oppIndex}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Avatar className="w-10 h-10 border border-border">
                          <AvatarImage src={opponent.image} alt={opponent.name} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground">
                          {opponent.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
