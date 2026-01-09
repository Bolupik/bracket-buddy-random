import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Participant {
  name: string;
  email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { tournamentId, notificationType, subject, message } = await req.json();

    if (!tournamentId || !subject || !message) {
      throw new Error("Missing required fields: tournamentId, subject, message");
    }

    // Get tournament details with participants
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from("tournaments")
      .select("name, participants, registered_users")
      .eq("id", tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    // Get emails from participants array
    const participants: Participant[] = Array.isArray(tournament.participants) 
      ? tournament.participants 
      : [];

    const emails = participants
      .filter((p: Participant) => p.email && p.email.includes("@"))
      .map((p: Participant) => ({ name: p.name, email: p.email! }));

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, message: "No participants with emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send emails to all participants with email addresses
    const emailResults = await Promise.allSettled(
      emails.map(({ name, email }) =>
        resend.emails.send({
          from: "Tournament Updates <onboarding@resend.dev>",
          to: [email],
          subject: `${tournament.name}: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🏆 ${tournament.name}</h1>
              </div>
              <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${name},</p>
                <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 16px 0;">
                  <p style="font-size: 16px; color: #4b5563; margin: 0;">${message}</p>
                </div>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
                <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
                  You're receiving this email because you're registered for ${tournament.name}.
                </p>
              </div>
            </div>
          `,
        })
      )
    );

    const successCount = emailResults.filter(r => r.status === "fulfilled").length;
    const failedCount = emailResults.filter(r => r.status === "rejected").length;

    console.log(`Emails sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: successCount,
        emailsFailed: failedCount,
        totalParticipants: participants.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
