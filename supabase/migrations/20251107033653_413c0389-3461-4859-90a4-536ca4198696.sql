-- Create courts/venues table
CREATE TABLE public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scheduled_matches table
CREATE TABLE public.scheduled_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    match_number INTEGER NOT NULL,
    participant1_name TEXT NOT NULL,
    participant2_name TEXT NOT NULL,
    court_id UUID REFERENCES public.courts(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled',
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player_availability table
CREATE TABLE public.player_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    available_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tournament_id, user_id)
);

-- Create tournament_notifications table
CREATE TABLE public.tournament_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    notification_type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courts
CREATE POLICY "Everyone can view courts"
ON public.courts FOR SELECT USING (true);

CREATE POLICY "Admins can manage courts"
ON public.courts FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for scheduled_matches
CREATE POLICY "Everyone can view scheduled matches"
ON public.scheduled_matches FOR SELECT USING (true);

CREATE POLICY "Admins can manage scheduled matches"
ON public.scheduled_matches FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for player_availability
CREATE POLICY "Users can view their own availability"
ON public.player_availability FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their own availability"
ON public.player_availability FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability"
ON public.player_availability FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all availability"
ON public.player_availability FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tournament_notifications
CREATE POLICY "Users can view their own notifications"
ON public.tournament_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.tournament_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
ON public.tournament_notifications FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add trigger for scheduled_matches updated_at
CREATE TRIGGER update_scheduled_matches_updated_at
BEFORE UPDATE ON public.scheduled_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for player_availability updated_at
CREATE TRIGGER update_player_availability_updated_at
BEFORE UPDATE ON public.player_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_notifications;