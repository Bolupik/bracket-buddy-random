import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { tournamentId, subject, message } = await req.json();

    if (!tournamentId || !subject || !message) {
      throw new Error("Missing required fields");
    }

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from("tournaments")
      .select("name, registered_users")
      .eq("id", tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    const registeredUsers = Array.isArray(tournament.registered_users) 
      ? tournament.registered_users 
      : [];

    // Send notifications to database
    for (const user of registeredUsers) {
      await supabaseClient
        .from("tournament_notifications")
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          notification_type: "tournament_update",
          message: message,
        });
    }

    // Send emails
    const emailPromises = registeredUsers.map((user: any) => {
      if (!user.email) return Promise.resolve();
      
      return resend.emails.send({
        from: "Tournament Updates <onboarding@resend.dev>",
        to: [user.email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${tournament.name}</h2>
            <p style="font-size: 16px; color: #666;">${message}</p>
            <hr style="margin: 20px 0; border: 1px solid #eee;" />
            <p style="font-size: 14px; color: #999;">
              You're receiving this email because you're registered for this tournament.
            </p>
          </div>
        `,
      });
    });

    await Promise.allSettled(emailPromises);

    return new Response(
      JSON.stringify({ success: true, notificationsSent: registeredUsers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
