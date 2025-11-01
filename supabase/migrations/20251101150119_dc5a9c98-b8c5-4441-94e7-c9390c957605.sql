-- Add UPDATE policy so anyone with the link can update tournament results
CREATE POLICY "Anyone can update tournaments" 
ON public.tournaments 
FOR UPDATE 
USING (true)
WITH CHECK (true);