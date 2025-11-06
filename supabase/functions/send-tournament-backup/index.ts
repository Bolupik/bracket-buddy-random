import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TournamentBackupRequest {
  tournamentName: string;
  tournamentId: string;
  participants: any[];
  matchups: any[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tournamentName, tournamentId, participants, matchups }: TournamentBackupRequest = await req.json();

    // Format tournament data for email
    const participantsList = participants.map(p => `- ${p.name}`).join('\n');
    
    const matchupsSummary = matchups.map((matchup, idx) => {
      const completedMatches = matchup.matches.filter((m: any) => m.completed).length;
      return `${idx + 1}. ${matchup.participant.name} - ${completedMatches}/${matchup.matches.length} matches completed`;
    }).join('\n');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22c55e; text-align: center;">🏆 Tournament Backup 🏆</h1>
        <h2 style="color: #333;">${tournamentName}</h2>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0284c7;">Tournament Details</h3>
          <p><strong>Tournament ID:</strong> ${tournamentId}</p>
          <p><strong>Total Participants:</strong> ${participants.length}</p>
          <p><strong>Backup Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #16a34a;">Participants</h3>
          <pre style="white-space: pre-wrap;">${participantsList}</pre>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #ca8a04;">Match Progress</h3>
          <pre style="white-space: pre-wrap;">${matchupsSummary}</pre>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="font-size: 14px; color: #6b7280;">
            This is a backup of your tournament data. You can use the Tournament ID to share or access this tournament.
          </p>
          <p style="font-size: 14px; color: #6b7280;">
            <strong>Tournament Link:</strong><br/>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/?tournament=${tournamentId}" 
               style="color: #22c55e; text-decoration: none;">
              View Tournament
            </a>
          </p>
        </div>
      </div>
    `;

    console.log('Sending tournament backup email for:', tournamentName);

    const emailResponse = await resend.emails.send({
      from: "Tournament Backup <onboarding@resend.dev>",
      to: ["ajayibolu22@gmail.com"],
      subject: `🏆 Tournament Backup: ${tournamentName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Tournament backup sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-tournament-backup function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
