import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface JoinTournamentDialogProps {
  open: boolean;
  tournamentName: string;
  onJoin: (name: string) => void;
}

export const JoinTournamentDialog = ({
  open,
  tournamentName,
  onJoin,
}: JoinTournamentDialogProps) => {
  const [name, setName] = useState("");

  const handleJoin = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onJoin(trimmedName);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Join Tournament
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Enter your name to join <span className="font-semibold text-foreground">{tournamentName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              className="pl-10 text-lg h-12"
              autoFocus
            />
          </div>
          <Button
            onClick={handleJoin}
            disabled={!name.trim()}
            size="lg"
            className="w-full"
          >
            Join Tournament
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
