-- Drop restrictive admin-only policies
DROP POLICY IF EXISTS "Admins can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON public.tournaments;

-- Allow anyone to create tournaments
CREATE POLICY "Anyone can create tournaments"
ON public.tournaments
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update tournaments
CREATE POLICY "Anyone can update tournaments"
ON public.tournaments
FOR UPDATE
USING (true)
WITH CHECK (true);