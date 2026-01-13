import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Send, Users } from "lucide-react";

interface SendAnnouncementDialogProps {
  tournamentId: string;
  tournamentName: string;
  participantCount: number;
  emailCount: number;
}

export function SendAnnouncementDialog({
  tournamentId,
  tournamentName,
  participantCount,
  emailCount,
}: SendAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter both subject and message");
      return;
    }

    if (emailCount === 0) {
      toast.error("No participants have provided email addresses");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "notify-tournament-update",
        {
          body: {
            tournamentId,
            notificationType: "announcement",
            subject: subject.trim(),
            message: message.trim(),
          },
        }
      );

      if (error) throw error;

      toast.success(`📢 Announcement sent to ${data.emailsSent} participants!`, {
        description: data.emailsFailed > 0 ? `${data.emailsFailed} emails failed to send` : undefined,
      });
      
      setSubject("");
      setMessage("");
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to send announcement:", error);
      toast.error(error.message || "Failed to send announcement");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Megaphone className="w-4 h-4" />
          Send Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Send Announcement
          </DialogTitle>
          <DialogDescription>
            Send a custom message to all registered participants with email addresses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">
              <strong>{emailCount}</strong> of {participantCount} participants will receive this email
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Important Update, Schedule Change..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your announcement here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={1000}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!subject.trim() || !message.trim() || emailCount === 0 || sending}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send to All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
