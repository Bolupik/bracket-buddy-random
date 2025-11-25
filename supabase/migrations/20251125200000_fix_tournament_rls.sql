-- Drop the restrictive policies
DROP POLICY IF EXISTS "Admins can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can update tournaments" ON public.tournaments;

-- Re-create the permissive policies
CREATE POLICY "Anyone can create tournaments" 
ON public.tournaments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tournaments" 
ON public.tournaments 
FOR UPDATE 
USING (true);
