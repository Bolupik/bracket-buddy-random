-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the reminder edge function
CREATE OR REPLACE FUNCTION public.trigger_tournament_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_id bigint;
  supabase_url text;
  anon_key text;
BEGIN
  -- Get the Supabase URL and anon key from vault (or use hardcoded for now)
  supabase_url := current_setting('app.settings.supabase_url', true);
  anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  -- If settings not available, use the project URL directly
  IF supabase_url IS NULL THEN
    supabase_url := 'https://uofezadisilwjmbkgdsq.supabase.co';
  END IF;
  
  IF anon_key IS NULL THEN
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZmV6YWRpc2lsd2ptYmtnZHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDMyNDUsImV4cCI6MjA3Njg3OTI0NX0.NhjHLbIZr3v6nbtRiMWJjSBZeEKWoaWl8z8usJyJFoU';
  END IF;

  -- Call the edge function using pg_net
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-tournament-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  ) INTO response_id;
  
  RAISE NOTICE 'Tournament reminder triggered, response_id: %', response_id;
END;
$$;

-- Schedule the reminder function to run every 30 minutes
-- This ensures we catch tournaments in both the 24-hour and 1-hour windows
SELECT cron.schedule(
  'tournament-reminders',
  '*/30 * * * *',  -- Every 30 minutes
  $$SELECT public.trigger_tournament_reminders()$$
);

-- Add a last_reminder_sent column to track which reminders have been sent
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS reminders_sent jsonb DEFAULT '[]'::jsonb;