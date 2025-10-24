import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { WinnerWheel } from "@/components/WinnerWheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import stackingBanner from "@/assets/stacking-banner.png";

interface Participant {
  name: string;
  image?: string;
}

export default function RandomWheelPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState("");

  const addParticipant = () => {
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (participants.some((p) => p.name === newName.trim())) {
      toast.error("This name already exists");
      return;
    }

    setParticipants([...participants, { name: newName.trim() }]);
    setNewName("");
    toast.success("Name added!");
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter((p) => p.name !== name));
    toast.success("Name removed");
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-dark)] p-4 md:p-8">
      <Navigation />

      <div className="max-w-6xl mx-auto pt-24 space-y-8">
        {/* Banner */}
        <div className="w-full animate-fade-in">
          <img
            src={stackingBanner}
            alt="STACKING DAO"
            className="w-full h-auto rounded-lg shadow-[var(--shadow-intense)] border-2 border-primary/30"
          />
        </div>

        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            <span className="bg-[var(--gradient-primary)] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              RANDOM NAME SELECTOR
            </span>
          </h1>
          <p className="text-lg text-foreground/70 font-medium">
            Add names and spin the wheel to select randomly!
          </p>
        </div>

        {/* Add Participant Form */}
        <Card className="p-6 bg-card/90 backdrop-blur-sm border-2 border-primary/20 animate-scale-in">
          <div className="flex gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addParticipant()}
              placeholder="Enter a name..."
              className="flex-1 bg-background/50 border-primary/30 focus:border-primary text-lg"
            />
            <Button onClick={addParticipant} size="lg" className="px-8">
              <Plus className="w-5 h-5 mr-2" />
              Add
            </Button>
          </div>

          {/* Participant List */}
          {participants.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Participants ({participants.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {participants.map((participant) => (
                  <div
                    key={participant.name}
                    className="flex items-center justify-between bg-background/50 rounded-lg px-4 py-3 border border-primary/20 hover:border-primary/40 transition-colors"
                  >
                    <span className="font-medium">{participant.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(participant.name)}
                      className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Wheel */}
        {participants.length > 0 ? (
          <div className="animate-scale-in">
            <WinnerWheel participants={participants} />
          </div>
        ) : (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-2 border-dashed border-primary/30">
            <p className="text-xl text-muted-foreground">
              Add at least one name to start spinning the wheel!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
