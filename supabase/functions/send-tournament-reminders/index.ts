import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Participant {
  name: string;
  email?: string;
}

interface Tournament {
  id: string;
  name: string;
  tournament_start_at: string;
  participants: Participant[];
  reminders_sent: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Window buffers (15 minutes before and after target times)
    const oneHourWindowStart = new Date(oneHourFromNow.getTime() - 15 * 60 * 1000);
    const oneHourWindowEnd = new Date(oneHourFromNow.getTime() + 15 * 60 * 1000);
    const twentyFourWindowStart = new Date(twentyFourHoursFromNow.getTime() - 15 * 60 * 1000);
    const twentyFourWindowEnd = new Date(twentyFourHoursFromNow.getTime() + 15 * 60 * 1000);

    console.log("Checking for tournaments starting around 1 hour from now:", oneHourFromNow.toISOString());
    console.log("Checking for tournaments starting around 24 hours from now:", twentyFourHoursFromNow.toISOString());

    // Get tournaments starting in ~1 hour that haven't received 1-hour reminder
    const { data: oneHourTournaments, error: oneHourError } = await supabaseClient
      .from("tournaments")
      .select("id, name, tournament_start_at, participants, reminders_sent")
      .gte("tournament_start_at", oneHourWindowStart.toISOString())
      .lte("tournament_start_at", oneHourWindowEnd.toISOString())
      .eq("status", "registration");

    if (oneHourError) {
      console.error("Error fetching 1-hour tournaments:", oneHourError);
    }

    // Get tournaments starting in ~24 hours that haven't received 24-hour reminder
    const { data: twentyFourHourTournaments, error: twentyFourError } = await supabaseClient
      .from("tournaments")
      .select("id, name, tournament_start_at, participants, reminders_sent")
      .gte("tournament_start_at", twentyFourWindowStart.toISOString())
      .lte("tournament_start_at", twentyFourWindowEnd.toISOString())
      .eq("status", "registration");

    if (twentyFourError) {
      console.error("Error fetching 24-hour tournaments:", twentyFourError);
    }

    const emailResults: { tournamentId: string; type: string; sent: number; failed: number }[] = [];

    // Send 1-hour reminder emails (only if not already sent)
    if (oneHourTournaments && oneHourTournaments.length > 0) {
      for (const tournament of oneHourTournaments as Tournament[]) {
        const remindersSent = Array.isArray(tournament.reminders_sent) ? tournament.reminders_sent : [];
        if (!remindersSent.includes("1-hour")) {
          const result = await sendReminderEmails(
            tournament,
            "1 hour",
            "🚨 Starting in 1 Hour!",
            supabaseClient,
            "1-hour"
          );
          emailResults.push({ tournamentId: tournament.id, type: "1-hour", ...result });
        }
      }
    }

    // Send 24-hour reminder emails (only if not already sent)
    if (twentyFourHourTournaments && twentyFourHourTournaments.length > 0) {
      for (const tournament of twentyFourHourTournaments as Tournament[]) {
        const remindersSent = Array.isArray(tournament.reminders_sent) ? tournament.reminders_sent : [];
        if (!remindersSent.includes("24-hour")) {
          const result = await sendReminderEmails(
            tournament,
            "24 hours",
            "⏰ Starting Tomorrow!",
            supabaseClient,
            "24-hour"
          );
          emailResults.push({ tournamentId: tournament.id, type: "24-hour", ...result });
        }
      }
    }

    console.log("Reminder results:", emailResults);

    return new Response(
      JSON.stringify({
        success: true,
        oneHourTournaments: oneHourTournaments?.length || 0,
        twentyFourHourTournaments: twentyFourHourTournaments?.length || 0,
        emailResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-tournament-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function sendReminderEmails(
  tournament: Tournament,
  timeLeft: string,
  subjectPrefix: string,
  supabaseClient: any,
  reminderType: string
): Promise<{ sent: number; failed: number }> {
  const participants = Array.isArray(tournament.participants)
    ? tournament.participants
    : [];

  const emailParticipants = participants.filter(
    (p) => p.email && p.email.includes("@")
  );

  if (emailParticipants.length === 0) {
    console.log(`No participants with emails for tournament ${tournament.name}`);
    return { sent: 0, failed: 0 };
  }

  const startTime = new Date(tournament.tournament_start_at);
  const formattedStartTime = startTime.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const results = await Promise.allSettled(
    emailParticipants.map(({ name, email }) =>
      resend.emails.send({
        from: "Tournament Reminders <onboarding@resend.dev>",
        to: [email!],
        subject: `${subjectPrefix} ${tournament.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Tournament Reminder</h1>
            </div>
            <div style="background: #1f2937; padding: 24px; border: 1px solid #374151; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 18px; color: #f3f4f6; margin-top: 0;">
                Hey ${name}! 👋
              </p>
              
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">🏆 ${tournament.name}</h2>
                <p style="color: #e0e7ff; margin: 0; font-size: 16px;">
                  Starts in <strong style="color: #fbbf24;">${timeLeft}</strong>
                </p>
              </div>
              
              <div style="background: #374151; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">📅 Start Time:</p>
                <p style="color: #f3f4f6; margin: 0; font-size: 16px; font-weight: bold;">
                  ${formattedStartTime}
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #9ca3af; font-size: 14px;">
                  Get ready to compete! Make sure you're available when the tournament begins.
                </p>
              </div>
              
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #4b5563;" />
              <p style="font-size: 12px; color: #6b7280; margin-bottom: 0; text-align: center;">
                You're receiving this because you're registered for ${tournament.name}.
              </p>
            </div>
          </div>
        `,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Mark reminder as sent if at least one email was successful
  if (sent > 0) {
    const remindersSent = Array.isArray(tournament.reminders_sent) ? tournament.reminders_sent : [];
    const updatedReminders = [...remindersSent, reminderType];
    
    await supabaseClient
      .from("tournaments")
      .update({ reminders_sent: updatedReminders })
      .eq("id", tournament.id);
    
    console.log(`Marked ${reminderType} reminder as sent for tournament ${tournament.name}`);
  }

  console.log(`Tournament ${tournament.name}: ${sent} sent, ${failed} failed`);

  return { sent, failed };
}
