-- QRON Database Schema
-- Run: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  generations_remaining INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QRONs table
CREATE TABLE IF NOT EXISTS public.qrons (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  mode TEXT NOT NULL,
  target_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  video_url TEXT,
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  nft_token_id TEXT,
  nft_contract_address TEXT,
  is_public BOOLEAN DEFAULT false,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_qrons_user_id ON public.qrons(user_id);
CREATE INDEX IF NOT EXISTS idx_qrons_mode ON public.qrons(mode);
CREATE INDEX IF NOT EXISTS idx_qrons_created_at ON public.qrons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qrons_public ON public.qrons(is_public) WHERE is_public = true;

-- Scan events table (for analytics)
CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qron_id TEXT REFERENCES public.qrons(id),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT, -- Hashed for privacy
  country_code TEXT,
  device_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_scan_events_qron_id ON public.scan_events(qron_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_scanned_at ON public.scan_events(scanned_at DESC);

-- Referral/Affiliate tracking
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES public.profiles(id),
  referred_id UUID REFERENCES public.profiles(id),
  code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(3,2) DEFAULT 0.30, -- 30%
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qrons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- QRONs: Users can CRUD their own, view public ones
CREATE POLICY "Users can view own QRONs" ON public.qrons
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create QRONs" ON public.qrons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own QRONs" ON public.qrons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own QRONs" ON public.qrons
  FOR DELETE USING (auth.uid() = user_id);

-- Scan events: Anyone can insert (for tracking), only owner can view
CREATE POLICY "Anyone can log scan" ON public.scan_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view scan events" ON public.scan_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.qrons 
      WHERE qrons.id = scan_events.qron_id 
      AND qrons.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment scan count
CREATE OR REPLACE FUNCTION public.increment_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.qrons 
  SET scan_count = scan_count + 1,
      updated_at = NOW()
  WHERE id = NEW.qron_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for scan tracking
DROP TRIGGER IF EXISTS on_scan_event_created ON public.scan_events;
CREATE TRIGGER on_scan_event_created
  AFTER INSERT ON public.scan_events
  FOR EACH ROW EXECUTE FUNCTION public.increment_scan_count();
