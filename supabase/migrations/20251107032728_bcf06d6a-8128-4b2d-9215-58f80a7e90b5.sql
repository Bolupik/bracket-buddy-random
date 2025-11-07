-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add columns to tournaments table for registration
ALTER TABLE public.tournaments
ADD COLUMN status TEXT DEFAULT 'registration',
ADD COLUMN max_participants INTEGER DEFAULT 16,
ADD COLUMN registered_users JSONB DEFAULT '[]'::jsonb,
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;

-- Update RLS policies for tournaments
DROP POLICY IF EXISTS "Anyone can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Anyone can update tournaments" ON public.tournaments;

CREATE POLICY "Admins can create tournaments"
ON public.tournaments
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tournaments"
ON public.tournaments
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can register for tournaments"
ON public.tournaments
FOR UPDATE
USING (status = 'registration')
WITH CHECK (status = 'registration');