import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, User, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

interface LeaderboardEntry {
  participant: Participant;
  wins: number;
  losses: number;
  draws: number;
  totalMatches: number;
}

interface LeaderboardProps {
  matchups: MatchUp[];
}

export const Leaderboard = ({ matchups }: LeaderboardProps) => {
  const navigate = useNavigate();

  // Calculate stats for each participant
  const leaderboardData: LeaderboardEntry[] = matchups.map(matchup => {
    const wins = matchup.matches.filter(m => m.result === 'win').length;
    const losses = matchup.matches.filter(m => m.result === 'loss').length;
    const draws = matchup.matches.filter(m => m.result === 'draw').length;
    const totalMatches = matchup.matches.filter(m => m.completed).length;

    return {
      participant: matchup.participant,
      wins,
      losses,
      draws,
      totalMatches,
    };
  });

  // Sort by wins (descending), then by losses (ascending), then by draws (descending)
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.draws - a.draws;
  });

  // Check if all participants have completed 3 matches
  const allMatchesComplete = sortedLeaderboard.every(entry => entry.totalMatches === 3);

  // Find tied participants (same wins and losses)
  const getTiedPlayers = () => {
    const tiedGroups: LeaderboardEntry[][] = [];
    const processed = new Set<string>();

    sortedLeaderboard.forEach((entry, index) => {
      if (processed.has(entry.participant.name)) return;

      const tied = sortedLeaderboard.filter(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.wins === entry.wins &&
          other.losses === entry.losses &&
          !processed.has(other.participant.name)
      );

      if (tied.length > 0) {
        const group = [entry, ...tied];
        group.forEach(e => processed.add(e.participant.name));
        tiedGroups.push(group);
      }
    });

    return tiedGroups;
  };

  const tiedGroups = allMatchesComplete ? getTiedPlayers() : [];

  const handleTiebreaker = (tiedPlayers: LeaderboardEntry[]) => {
    const participants = tiedPlayers.map(entry => entry.participant);
    localStorage.setItem("tiebreakerParticipants", JSON.stringify(participants));
    navigate("/wheel?mode=tiebreaker");
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-amber-700" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black bg-[var(--gradient-primary)] bg-clip-text text-transparent">
          LEADERBOARD
        </h2>
        <p className="text-muted-foreground">
          {allMatchesComplete
            ? "All matches completed! Final standings:"
            : "Tournament in progress..."}
        </p>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3">
        {sortedLeaderboard.map((entry, index) => (
          <Card
            key={entry.participant.name}
            className={`p-6 animate-scale-in bg-card/90 backdrop-blur-sm transition-all hover:shadow-[var(--shadow-glow)] ${
              index === 0 ? 'border-4 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'border-2 border-primary/20'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-16">
                {getRankIcon(index)}
              </div>

              {/* Avatar */}
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={entry.participant.image} alt={entry.participant.name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{entry.participant.name}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.totalMatches}/3 matches completed
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-3xl font-black text-green-500">{entry.wins}</p>
                  <p className="text-xs text-muted-foreground uppercase">Wins</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-red-500">{entry.losses}</p>
                  <p className="text-xs text-muted-foreground uppercase">Losses</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-yellow-500">{entry.draws}</p>
                  <p className="text-xs text-muted-foreground uppercase">Draws</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tiebreaker Section */}
      {allMatchesComplete && tiedGroups.length > 0 && (
        <Card className="p-6 bg-yellow-500/10 border-2 border-yellow-500/30 animate-scale-in">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-foreground">Tiebreakers Needed!</h3>
            </div>
            
            {tiedGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                <p className="text-muted-foreground">
                  Tied at {group[0].wins} wins, {group[0].losses} losses:
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  {group.map(entry => (
                    <span
                      key={entry.participant.name}
                      className="px-3 py-1 bg-card rounded-full text-sm font-semibold"
                    >
                      {entry.participant.name}
                    </span>
                  ))}
                  <Button
                    onClick={() => handleTiebreaker(group)}
                    variant="gradient"
                    size="sm"
                    className="ml-2"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Resolve Tiebreaker
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
