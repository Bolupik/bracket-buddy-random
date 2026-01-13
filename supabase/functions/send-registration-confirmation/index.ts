import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationRequest {
  participantName: string;
  participantEmail: string;
  tournamentName: string;
  tournamentId: string;
  tournamentStartAt?: string;
  participantCount: number;
  maxParticipants: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      participantName,
      participantEmail,
      tournamentName,
      tournamentId,
      tournamentStartAt,
      participantCount,
      maxParticipants,
    }: RegistrationRequest = await req.json();

    if (!participantEmail || !participantEmail.includes("@")) {
      return new Response(
        JSON.stringify({ success: true, message: "No email provided, skipping confirmation" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tournamentUrl = `${req.headers.get("origin") || "https://bracket-buddy-random.lovable.app"}/tournament/${tournamentId}`;
    
    const startTimeHtml = tournamentStartAt
      ? `
        <div style="background: #374151; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">📅 Tournament Starts:</p>
          <p style="color: #f3f4f6; margin: 0; font-size: 16px; font-weight: bold;">
            ${new Date(tournamentStartAt).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      `
      : "";

    const emailResponse = await resend.emails.send({
      from: "Tournament Registration <onboarding@resend.dev>",
      to: [participantEmail],
      subject: `🎮 You're registered for ${tournamentName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Registration Confirmed!</h1>
          </div>
          <div style="background: #1f2937; padding: 24px; border: 1px solid #374151; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px; color: #f3f4f6; margin-top: 0;">
              Hey ${participantName}! 👋
            </p>
            
            <p style="font-size: 16px; color: #d1d5db;">
              You've successfully registered for the tournament. Get ready to compete!
            </p>
            
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">🏆 ${tournamentName}</h2>
              <p style="color: #e0e7ff; margin: 0; font-size: 14px;">
                ${participantCount} / ${maxParticipants} participants registered
              </p>
            </div>
            
            ${startTimeHtml}
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${tournamentUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                View Tournament Details
              </a>
            </div>
            
            <div style="background: #374151; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="color: #fbbf24; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">📧 What's next?</p>
              <ul style="color: #d1d5db; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>You'll receive reminder emails before the tournament starts</li>
                <li>Check the tournament page for updates and announcements</li>
                <li>Make sure you're available at the scheduled start time</li>
              </ul>
            </div>
            
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #4b5563;" />
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 0; text-align: center;">
              You're receiving this because you registered for ${tournamentName}.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Registration confirmation sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending registration confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
