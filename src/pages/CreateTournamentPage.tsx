import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Users, Share2, Upload, Trash2, Shuffle, CalendarClock } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DateTimePicker } from "@/components/DateTimePicker";

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

const CreateTournamentPage = () => {
  const [tournamentName, setTournamentName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  const [registrationOpenAt, setRegistrationOpenAt] = useState<Date | undefined>();
  const [registrationCloseAt, setRegistrationCloseAt] = useState<Date | undefined>();
  const [tournamentStartAt, setTournamentStartAt] = useState<Date | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
      toast.success(`${name} added!`);
    } else if (participants.find(p => p.name === name)) {
      toast.error("This name is already added!");
    }
  };

  const removeParticipant = (index: number) => {
    const removed = participants[index];
    setParticipants(participants.filter((_, i) => i !== index));
    toast.info(`${removed.name} removed`);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateMatchups = (): MatchUp[] => {
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
    const attempts = shuffled.length * 10;
    let attempt = 0;
    
    while (attempt < attempts && Object.values(fightCount).some(count => count < 3)) {
      attempt++;
      
      const needFights = shuffled.filter(p => fightCount[p.name] < 3);
      
      for (let i = 0; i < needFights.length; i++) {
        const p1 = needFights[i];
        
        if (fightCount[p1.name] >= 3) continue;
        
        for (let j = i + 1; j < needFights.length; j++) {
          const p2 = needFights[j];
          
          if (fightCount[p2.name] >= 3) continue;
          if (participantOpponents[p1.name].has(p2.name)) continue;
          
          participantOpponents[p1.name].add(p2.name);
          participantOpponents[p2.name].add(p1.name);
          fightCount[p1.name]++;
          fightCount[p2.name]++;
          break;
        }
      }
    }

    // Build the final matchup structure
    return participants.map(participant => ({
      participant,
      matches: Array.from(participantOpponents[participant.name])
        .map(name => participants.find(p => p.name === name)!)
        .filter(Boolean)
        .map(opponent => ({ opponent, completed: false })),
    }));
  };

  const handleCreateTournament = async () => {
    if (!tournamentName.trim()) {
      toast.error("Please enter a tournament name");
      return;
    }
    if (!creatorName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (participants.length < 4) {
      toast.error("Add at least 4 participants to create a tournament!");
      return;
    }

    setIsCreating(true);
    try {
      // Generate a unique creator ID
      const creatorId = `creator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate matchups
      const matchups = generateMatchups();
      
      // Create tournament in database
      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          name: tournamentName,
          creator_id: creatorId,
          participants: participants as any,
          matchups: matchups as any,
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

      toast.success("Tournament created! 🎉");
      
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
              Set up your tournament and invite players
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

              {/* Add Participants Section */}
              <div className="space-y-4 pt-4 border-t-2 border-primary/20">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  Add Participants ({participants.length})
                </h3>
                
                <Input
                  placeholder="Type a player name... 😊"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addParticipant()}
                  className="h-12 text-lg border-2"
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
                    className="flex-1 h-12 border-2"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {currentImage ? "Change Photo" : "Add Photo (Optional)"}
                  </Button>
                  
                  {currentImage && (
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={currentImage} alt="Preview" />
                    </Avatar>
                  )}
                </div>
                
                <Button
                  onClick={addParticipant}
                  disabled={!currentName}
                  size="lg"
                  className="w-full h-12 font-semibold"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Add Participant
                </Button>

                {/* Participants List */}
                {participants.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {participants.map((participant, index) => (
                      <Card
                        key={index}
                        className="p-3 flex items-center gap-3 border-2 border-primary/20"
                      >
                        <Avatar className="h-10 w-10 border-2 border-primary/30">
                          <AvatarImage src={participant.image} alt={participant.name} />
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {participant.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 font-semibold">{participant.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(index)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}

                {participants.length > 0 && participants.length < 4 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Need {4 - participants.length} more participant{4 - participants.length !== 1 ? 's' : ''} (minimum 4 required)
                  </p>
                )}
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
                      <li>✨ Tournament matchups will be generated</li>
                      <li>👥 Others can join using your shareable link</li>
                      <li>🎮 Only you can manage the tournament</li>
                      <li>⏰ Registration window will be enforced automatically</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateTournament}
                disabled={isCreating || !tournamentName.trim() || !creatorName.trim() || participants.length < 4}
                variant="gradient"
                className="w-full h-16 text-xl font-bold"
                size="lg"
              >
                {isCreating ? (
                  <>Creating Tournament...</>
                ) : (
                  <>
                    <Shuffle className="w-6 h-6 mr-2" />
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
