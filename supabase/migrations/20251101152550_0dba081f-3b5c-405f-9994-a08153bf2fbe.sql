-- Add creator_id to tournaments table to track who created each tournament
ALTER TABLE public.tournaments
ADD COLUMN creator_id text;

-- Add index for better query performance
CREATE INDEX idx_tournaments_creator_id ON public.tournaments(creator_id);