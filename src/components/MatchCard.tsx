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
  isAdmin: boolean;
}

export const MatchCard = ({ match, participantName, onUpdateResult, isAdmin }: MatchCardProps) => {
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
      win: { text: '🏆 WON!', emoji: '🏆', color: 'bg-green-500/30 text-green-600 border-green-500/50' },
      loss: { text: '😢 Lost', emoji: '😢', color: 'bg-red-500/30 text-red-600 border-red-500/50' },
      draw: { text: '🤝 Draw', emoji: '🤝', color: 'bg-yellow-500/30 text-yellow-600 border-yellow-500/50' }
    };
    
    const badge = badges[match.result];
    return (
      <span className={`px-4 py-2 text-base font-bold rounded-lg border-2 ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (match.completed && !isEditing) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-xl transition-all duration-300 bg-primary/10 border-3 border-primary/30 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:bg-primary/15 animate-fade-in group">
        <Avatar className="w-14 h-14 border-3 border-primary/40 transition-transform duration-300 group-hover:scale-110">
          <AvatarImage src={match.opponent.image} alt={match.opponent.name} />
          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-lg">
            {match.opponent.name[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <span className="font-bold text-lg text-primary block transition-colors group-hover:text-accent">
            {match.opponent.name}
          </span>
          {match.score && (
            <span className="text-base text-foreground/80 font-semibold">
              Score: {match.score}
            </span>
          )}
        </div>
        <div className="animate-scale-in">{getResultBadge()}</div>
        {isAdmin && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="lg"
            className="h-12 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ✏️ Edit
          </Button>
        )}
      </div>
    );
  }

  if (isEditing || !match.completed) {
    return (
      <div className="p-5 rounded-xl bg-card/80 backdrop-blur-sm border-3 border-primary/30 space-y-4 shadow-lg animate-scale-in">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-3 border-primary/40 animate-pulse-soft">
            <AvatarImage src={match.opponent.image} alt={match.opponent.name} />
            <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-lg">
              {match.opponent.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-xl text-foreground flex-1">
            {match.opponent.name}
          </span>
          {isEditing && (
            <Button
              onClick={() => {
                setIsEditing(false);
                setScore(match.score || "");
              }}
              variant="ghost"
              size="lg"
              className="h-12 w-12 hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          <Input
            placeholder="Enter score (like 3-1 or 21-19) ⚽"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="text-lg h-14 text-center font-semibold border-2 transition-all duration-300 focus:shadow-[var(--shadow-subtle)] focus:scale-[1.02]"
          />
          
          <div className="grid grid-cols-3 gap-3 stagger-children">
            <Button
              onClick={() => handleResult('win')}
              variant="outline"
              size="lg"
              className="flex-col h-20 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50 text-green-700 font-bold hover:scale-105 transition-all"
              disabled={!score.trim()}
            >
              <Trophy className="w-6 h-6 mb-1" />
              🏆 Win!
            </Button>
            <Button
              onClick={() => handleResult('draw')}
              variant="outline"
              size="lg"
              className="flex-col h-20 bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500/50 text-yellow-700 font-bold hover:scale-105 transition-all"
              disabled={!score.trim()}
            >
              <span className="text-2xl mb-1">🤝</span>
              Draw
            </Button>
            <Button
              onClick={() => handleResult('loss')}
              variant="outline"
              size="lg"
              className="flex-col h-20 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-700 font-bold hover:scale-105 transition-all"
              disabled={!score.trim()}
            >
              <span className="text-2xl mb-1">😢</span>
              Loss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
