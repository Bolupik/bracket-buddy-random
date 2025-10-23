import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Trophy, X } from "lucide-react";

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

interface MatchCardProps {
  match: Match;
  participantName: string;
  onUpdateResult: (participantName: string, opponentName: string, score: string, result: 'win' | 'loss' | 'draw') => void;
}

export const MatchCard = ({ match, participantName, onUpdateResult }: MatchCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(match.score || "");

  const handleResult = (result: 'win' | 'loss' | 'draw') => {
    if (!score.trim()) {
      return;
    }
    onUpdateResult(participantName, match.opponent.name, score, result);
    setIsEditing(false);
  };

  const getResultBadge = () => {
    if (!match.result) return null;
    
    const badges = {
      win: { text: 'WIN', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
      loss: { text: 'LOSS', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
      draw: { text: 'DRAW', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' }
    };
    
    const badge = badges[match.result];
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (match.completed && !isEditing) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg transition-all bg-primary/10 border-2 border-primary/30">
        <Avatar className="w-10 h-10 border border-border">
          <AvatarImage src={match.opponent.image} alt={match.opponent.name} />
          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <span className="font-semibold text-primary block">
            {match.opponent.name}
          </span>
          {match.score && (
            <span className="text-sm text-muted-foreground">
              Score: {match.score}
            </span>
          )}
        </div>
        {getResultBadge()}
        <Button
          onClick={() => setIsEditing(true)}
          variant="ghost"
          size="sm"
        >
          Edit
        </Button>
      </div>
    );
  }

  if (isEditing || !match.completed) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 border-2 border-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={match.opponent.image} alt={match.opponent.name} />
            <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground flex-1">
            {match.opponent.name}
          </span>
          {isEditing && (
            <Button
              onClick={() => {
                setIsEditing(false);
                setScore(match.score || "");
              }}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <Input
            placeholder="Enter score (e.g., 3-1, 21-19)"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="text-sm"
          />
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleResult('win')}
              variant="outline"
              size="sm"
              className="flex-1 bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-600"
              disabled={!score.trim()}
            >
              <Trophy className="w-4 h-4 mr-1" />
              Win
            </Button>
            <Button
              onClick={() => handleResult('draw')}
              variant="outline"
              size="sm"
              className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-600"
              disabled={!score.trim()}
            >
              Draw
            </Button>
            <Button
              onClick={() => handleResult('loss')}
              variant="outline"
              size="sm"
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-600"
              disabled={!score.trim()}
            >
              Loss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
