-- Add registration window columns to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_open_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registration_close_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tournament_start_at TIMESTAMP WITH TIME ZONE;

-- Drop the old permissive update policy that allows anyone to update
DROP POLICY IF EXISTS "Anyone can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Users can register for tournaments" ON public.tournaments;

-- Create new policy that enforces registration window
CREATE POLICY "Users can register during registration window" 
ON public.tournaments 
FOR UPDATE 
USING (
  status = 'registration' 
  AND (
    registration_open_at IS NULL 
    OR (NOW() >= registration_open_at AND (registration_close_at IS NULL OR NOW() <= registration_close_at))
  )
)
WITH CHECK (
  status = 'registration' 
  AND (
    registration_open_at IS NULL 
    OR (NOW() >= registration_open_at AND (registration_close_at IS NULL OR NOW() <= registration_close_at))
  )
);

-- Allow admins to update tournaments anytime
CREATE POLICY "Admins can update tournaments anytime" 
ON public.tournaments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add comment for documentation
COMMENT ON COLUMN public.tournaments.registration_open_at IS 'UTC timestamp when registration opens';
COMMENT ON COLUMN public.tournaments.registration_close_at IS 'UTC timestamp when registration closes';
COMMENT ON COLUMN public.tournaments.tournament_start_at IS 'UTC timestamp when tournament starts';