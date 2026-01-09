import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Pencil, Save, Trophy, Users, CalendarClock, Mail } from "lucide-react";

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

  const [notifyParticipants, setNotifyParticipants] = useState(true);

  const sendNotification = async (tournamentId: string, subject: string, message: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-tournament-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            tournamentId,
            subject,
            message,
          }),
        }
      );

      const result = await response.json();
      if (result.emailsSent > 0) {
        toast.success(`📧 Notified ${result.emailsSent} participant(s)`);
      }
      return result;
    } catch (error) {
      console.error("Failed to send notifications:", error);
    }
  };

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

      // Send notification if enabled
      if (notifyParticipants) {
        const changes: string[] = [];
        if (name.trim() !== tournament.name) changes.push("tournament name");
        if (maxParticipants !== tournament.max_participants) changes.push("participant limit");
        if (registrationOpenAt?.toISOString() !== tournament.registration_open_at) changes.push("registration open time");
        if (registrationCloseAt?.toISOString() !== tournament.registration_close_at) changes.push("registration close time");
        if (tournamentStartAt?.toISOString() !== tournament.tournament_start_at) changes.push("tournament start time");

        if (changes.length > 0) {
          const message = `The tournament details have been updated. Changes: ${changes.join(", ")}.${
            tournamentStartAt ? ` The tournament starts on ${new Date(tournamentStartAt).toLocaleString()}.` : ""
          }`;
          await sendNotification(tournament.id, "Tournament Updated", message);
        }
      }

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

          {/* Notify Participants */}
          <div className="flex items-center space-x-3 pt-4 border-t border-border">
            <Checkbox
              id="notify"
              checked={notifyParticipants}
              onCheckedChange={(checked) => setNotifyParticipants(checked === true)}
            />
            <label
              htmlFor="notify"
              className="flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <Mail className="w-4 h-4 text-primary" />
              Email participants about changes
            </label>
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
