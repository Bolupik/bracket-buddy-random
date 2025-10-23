import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, RotateCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Participant {
  name: string;
  image?: string;
}

interface WinnerWheelProps {
  participants: Participant[];
}

export const WinnerWheel = ({ participants }: WinnerWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const colors = [
    "hsl(130 70% 55%)",
    "hsl(140 75% 60%)",
    "hsl(150 65% 58%)",
    "hsl(160 70% 55%)",
    "hsl(120 75% 60%)",
  ];

  const spinWheel = () => {
    if (isSpinning || participants.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    // Random spins (5-10 full rotations) + random position
    const spins = 5 + Math.floor(Math.random() * 5);
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + spins * 360 + randomDegree;

    setRotation(totalRotation);

    // Calculate winner after animation
    setTimeout(() => {
      const segmentAngle = 360 / participants.length;
      const normalizedRotation = totalRotation % 360;
      const winnerIndex = Math.floor((360 - normalizedRotation + 90) / segmentAngle) % participants.length;
      
      setWinner(participants[winnerIndex]);
      setIsSpinning(false);
      setShowWinnerDialog(true);
      toast.success(`🎉 Winner: ${participants[winnerIndex].name}!`);
    }, 4000);
  };

  const resetWheel = () => {
    setRotation(0);
    setWinner(null);
    setShowWinnerDialog(false);
  };

  if (participants.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/90 backdrop-blur-sm border-2 border-primary/20">
        <p className="text-xl text-muted-foreground">
          No participants available. Please create a tournament first.
        </p>
      </Card>
    );
  }

  const segmentAngle = 360 / participants.length;

  return (
    <div className="space-y-8">
      {/* Wheel Container */}
      <div className="relative flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-primary drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-[500px] h-[500px] rounded-full shadow-[0_0_60px_rgba(34,197,94,0.4)] border-8 border-primary/30"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {/* Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary border-4 border-primary-foreground shadow-[0_0_20px_rgba(34,197,94,0.6)] z-10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* Wheel Segments */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {participants.map((participant, index) => {
              const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

              const x1 = 100 + 100 * Math.cos(startAngle);
              const y1 = 100 + 100 * Math.sin(startAngle);
              const x2 = 100 + 100 * Math.cos(endAngle);
              const y2 = 100 + 100 * Math.sin(endAngle);

              const largeArcFlag = segmentAngle > 180 ? 1 : 0;

              const textAngle = index * segmentAngle;
              const textRadius = 65;
              const textX = 100 + textRadius * Math.cos((textAngle - 90) * (Math.PI / 180));
              const textY = 100 + textRadius * Math.sin((textAngle - 90) * (Math.PI / 180));

              return (
                <g key={index}>
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={colors[index % colors.length]}
                    stroke="hsl(165 40% 15%)"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="hsl(165 40% 10%)"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                  >
                    {participant.name.length > 12
                      ? participant.name.substring(0, 12) + "..."
                      : participant.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <Button
            onClick={spinWheel}
            disabled={isSpinning}
            size="lg"
            variant="gradient"
            className="text-xl px-8 py-6"
          >
            {isSpinning ? (
              <>
                <RotateCw className="w-6 h-6 animate-spin" />
                Spinning...
              </>
            ) : (
              <>
                <Trophy className="w-6 h-6" />
                Spin the Wheel!
              </>
            )}
          </Button>

          {winner && (
            <Button onClick={resetWheel} size="lg" variant="outline">
              Reset
            </Button>
          )}
        </div>

        {/* Winner Display */}
        {winner && (
          <Card className="p-6 bg-primary/20 border-2 border-primary animate-scale-in shadow-[var(--shadow-intense)]">
            <div className="text-center space-y-2">
              <Trophy className="w-12 h-12 mx-auto text-primary" />
              <p className="text-2xl font-bold text-primary">Winner!</p>
              <p className="text-3xl font-black text-foreground">{winner.name}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Winner Announcement Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 border-4 border-primary">
          <DialogHeader>
            <DialogTitle className="text-center text-4xl font-black text-primary flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 animate-pulse" />
              WINNER ANNOUNCED!
              <Sparkles className="w-10 h-10 animate-pulse" />
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="relative">
              <Trophy className="w-32 h-32 text-primary animate-bounce" />
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-6xl font-black text-foreground animate-scale-in">
                {winner?.name}
              </p>
              <p className="text-2xl text-primary font-bold">
                Congratulations! 🎉
              </p>
            </div>
            <Button
              onClick={() => setShowWinnerDialog(false)}
              size="lg"
              variant="dark"
              className="text-xl px-12 py-6"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
