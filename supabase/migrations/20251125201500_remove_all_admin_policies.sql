-- Courts
DROP POLICY IF EXISTS "Admins can manage courts" ON public.courts;
CREATE POLICY "Anyone can manage courts"
ON public.courts
FOR ALL
USING (true)
WITH CHECK (true);

-- Scheduled Matches
DROP POLICY IF EXISTS "Admins can manage scheduled matches" ON public.scheduled_matches;
CREATE POLICY "Anyone can manage scheduled matches"
ON public.scheduled_matches
FOR ALL
USING (true)
WITH CHECK (true);

-- Player Availability
DROP POLICY IF EXISTS "Admins can view all availability" ON public.player_availability;
-- We keep the user-specific policies but add a public read/write policy for flexibility if needed, 
-- or we can just rely on the fact that we are relaxing everything. 
-- For "free to use to everyone", we should probably allow anyone to view/edit availability if they have the link/id.
-- But availability is tied to user_id. Let's make it permissive for now.
CREATE POLICY "Anyone can view availability"
ON public.player_availability
FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage availability"
ON public.player_availability
FOR ALL
USING (true)
WITH CHECK (true);

-- Tournament Notifications
DROP POLICY IF EXISTS "Admins can create notifications" ON public.tournament_notifications;
CREATE POLICY "Anyone can create notifications"
ON public.tournament_notifications
FOR INSERT
WITH CHECK (true);
