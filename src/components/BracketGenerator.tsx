import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Shuffle } from "lucide-react";
import { toast } from "sonner";

interface Match {
  player1: string | null;
  player2: string | null;
  winner?: string | null;
}

interface Round {
  matches: Match[];
}

export const BracketGenerator = () => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [bracket, setBracket] = useState<Round[]>([]);

  const addParticipant = () => {
    const name = currentName.trim();
    if (name && !participants.includes(name)) {
      setParticipants([...participants, name]);
      setCurrentName("");
      toast.success(`${name} added to the tournament!`);
    } else if (participants.includes(name)) {
      toast.error("This name is already in the tournament!");
    }
  };

  const removeParticipant = (index: number) => {
    const removed = participants[index];
    setParticipants(participants.filter((_, i) => i !== index));
    toast.info(`${removed} removed from tournament`);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateBracket = () => {
    if (participants.length < 2) {
      toast.error("Add at least 2 participants to create a bracket!");
      return;
    }

    const shuffled = shuffleArray([...participants]);
    const rounds: Round[] = [];
    let currentRound = shuffled;

    // Create first round with all participants
    const firstRoundMatches: Match[] = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      firstRoundMatches.push({
        player1: currentRound[i],
        player2: currentRound[i + 1] || null, // Handle odd number
      });
    }
    rounds.push({ matches: firstRoundMatches });

    // Create subsequent rounds
    let matchCount = firstRoundMatches.length;
    while (matchCount > 1) {
      matchCount = Math.ceil(matchCount / 2);
      const roundMatches: Match[] = [];
      for (let i = 0; i < matchCount; i++) {
        roundMatches.push({
          player1: null,
          player2: null,
        });
      }
      rounds.push({ matches: roundMatches });
    }

    setBracket(rounds);
    toast.success("Bracket generated! Let the games begin!");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tournament Bracket
          </h1>
          <p className="text-xl text-muted-foreground">
            Create random tournament brackets in seconds
          </p>
        </div>

        {/* Input Section */}
        <Card className="p-6 shadow-[var(--shadow-glow)]">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter participant name..."
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addParticipant()}
                className="flex-1"
              />
              <Button onClick={addParticipant} size="lg">
                Add
              </Button>
            </div>

            {participants.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2">
                  {participants.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg group hover:bg-destructive/10 transition-colors"
                    >
                      <span className="font-medium">{name}</span>
                      <button
                        onClick={() => removeParticipant(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={generateBracket}
                  variant="gradient"
                  size="lg"
                  className="w-full text-lg font-bold"
                >
                  <Shuffle className="w-5 h-5" />
                  Generate Random Bracket
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Bracket Display */}
        {bracket.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-center">Tournament Bracket</h2>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-8 min-w-max">
                {bracket.map((round, roundIndex) => (
                  <div key={roundIndex} className="flex flex-col gap-4 min-w-[250px]">
                    <h3 className="text-lg font-bold text-center text-primary">
                      {roundIndex === bracket.length - 1
                        ? "Final"
                        : roundIndex === bracket.length - 2
                        ? "Semi-Final"
                        : `Round ${roundIndex + 1}`}
                    </h3>
                    <div className="flex flex-col gap-4 justify-around">
                      {round.matches.map((match, matchIndex) => (
                        <Card
                          key={matchIndex}
                          className="p-4 space-y-2 bg-card hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <span className="font-semibold">
                              {match.player1 || "TBD"}
                            </span>
                          </div>
                          <div className="text-center text-xs text-muted-foreground font-bold">
                            VS
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <span className="font-semibold">
                              {match.player2 || "TBD"}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
