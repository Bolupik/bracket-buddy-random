import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/DateTimePicker";
import { Pencil, Save, Trophy, Users, CalendarClock } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  max_participants: number;
  registration_open_at: string | null;
  registration_close_at: string | null;
  tournament_start_at: string | null;
}

interface EditTournamentDialogProps {
  tournament: Tournament;
  onUpdate: () => void;
}

export const EditTournamentDialog = ({
  tournament,
  onUpdate,
}: EditTournamentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(tournament.name);
  const [maxParticipants, setMaxParticipants] = useState(tournament.max_participants);
  const [registrationOpenAt, setRegistrationOpenAt] = useState<Date | undefined>(
    tournament.registration_open_at ? new Date(tournament.registration_open_at) : undefined
  );
  const [registrationCloseAt, setRegistrationCloseAt] = useState<Date | undefined>(
    tournament.registration_close_at ? new Date(tournament.registration_close_at) : undefined
  );
  const [tournamentStartAt, setTournamentStartAt] = useState<Date | undefined>(
    tournament.tournament_start_at ? new Date(tournament.tournament_start_at) : undefined
  );

  // Reset form when tournament changes
  useEffect(() => {
    setName(tournament.name);
    setMaxParticipants(tournament.max_participants);
    setRegistrationOpenAt(
      tournament.registration_open_at ? new Date(tournament.registration_open_at) : undefined
    );
    setRegistrationCloseAt(
      tournament.registration_close_at ? new Date(tournament.registration_close_at) : undefined
    );
    setTournamentStartAt(
      tournament.tournament_start_at ? new Date(tournament.tournament_start_at) : undefined
    );
  }, [tournament]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Tournament name is required");
      return;
    }

    if (maxParticipants < 2) {
      toast.error("Maximum participants must be at least 2");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tournaments")
        .update({
          name: name.trim(),
          max_participants: maxParticipants,
          registration_open_at: registrationOpenAt?.toISOString() || null,
          registration_close_at: registrationCloseAt?.toISOString() || null,
          tournament_start_at: tournamentStartAt?.toISOString() || null,
        })
        .eq("id", tournament.id);

      if (error) throw error;

      toast.success("Tournament updated! ✨");
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update tournament");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="w-4 h-4" />
          Edit Tournament
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Edit Tournament
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tournament Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="w-4 h-4 text-primary" />
              Tournament Name
            </label>
            <Input
              placeholder="Tournament name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-primary" />
              Maximum Participants
            </label>
            <Input
              type="number"
              min={2}
              max={256}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 16)}
              className="h-12"
            />
          </div>

          {/* Registration Schedule */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="font-medium flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Registration Schedule
            </h4>

            <div className="grid gap-4">
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
              <DateTimePicker
                label="Tournament Starts"
                value={tournamentStartAt}
                onChange={setTournamentStartAt}
                placeholder="Select start date/time"
                minDate={registrationCloseAt || registrationOpenAt}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="gradient">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
