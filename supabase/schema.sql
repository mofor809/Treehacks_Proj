-- Wavelength Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension (should be enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
-- Extends Supabase auth.users with additional profile info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  school_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- WIDGETS TABLE
-- =============================================
-- Posts/profile blocks that make up a user's profile
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('text', 'image', 'repost')) NOT NULL,
  content TEXT,
  image_url TEXT,
  original_widget_id UUID REFERENCES widgets(id) ON DELETE SET NULL,
  interest_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  position INT DEFAULT 0
);

-- Enable RLS
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for widgets
CREATE POLICY "Widgets are viewable by everyone"
  ON widgets FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own widgets"
  ON widgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets"
  ON widgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets"
  ON widgets FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster user widget queries
CREATE INDEX IF NOT EXISTS widgets_user_id_idx ON widgets(user_id);
CREATE INDEX IF NOT EXISTS widgets_created_at_idx ON widgets(created_at DESC);

-- =============================================
-- PROMPTS TABLE
-- =============================================
-- Daily/weekly prompts for user engagement
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  type TEXT CHECK (type IN ('daily', 'weekly', 'random')) NOT NULL,
  active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts
CREATE POLICY "Prompts are viewable by everyone"
  ON prompts FOR SELECT
  USING (true);

-- Only admins can manage prompts (via service role)
-- Users cannot insert/update/delete prompts directly

-- =============================================
-- PROMPT RESPONSES TABLE
-- =============================================
-- User responses to prompts
CREATE TABLE IF NOT EXISTS prompt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image_url TEXT,
  interest_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one response per user per prompt
  UNIQUE(prompt_id, user_id)
);

-- Enable RLS
ALTER TABLE prompt_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_responses
CREATE POLICY "Prompt responses are viewable by everyone"
  ON prompt_responses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own responses"
  ON prompt_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON prompt_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON prompt_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS prompt_responses_prompt_id_idx ON prompt_responses(prompt_id);
CREATE INDEX IF NOT EXISTS prompt_responses_user_id_idx ON prompt_responses(user_id);

-- =============================================
-- MATCHES TABLE
-- =============================================
-- Interest-based matches between users
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shared_tags TEXT[] DEFAULT '{}',
  conversation_starter TEXT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure unique pairs (order doesn't matter)
  CONSTRAINT unique_match CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Matches are created by the system/service role, not directly by users

-- Indexes
CREATE INDEX IF NOT EXISTS matches_user1_id_idx ON matches(user1_id);
CREATE INDEX IF NOT EXISTS matches_user2_id_idx ON matches(user2_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- USER MATCHES TABLE (AI-powered)
-- =============================================
-- Stores AI-generated matches between users based on semantic interest analysis
CREATE TABLE IF NOT EXISTS user_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shared_interests JSONB NOT NULL DEFAULT '{}',  -- {"concept": "explanation"}
  match_score FLOAT NOT NULL DEFAULT 0,           -- 0.0 to 1.0
  conversation_starter TEXT,                       -- AI-generated opener
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure unique pairs (order doesn't matter, user1_id < user2_id)
  CONSTRAINT unique_user_match CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_matches
CREATE POLICY "Users can view their own matches"
  ON user_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow service role to insert/update matches (for AI processing)
CREATE POLICY "Service role can manage matches"
  ON user_matches FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS user_matches_user1_id_idx ON user_matches(user1_id);
CREATE INDEX IF NOT EXISTS user_matches_user2_id_idx ON user_matches(user2_id);
CREATE INDEX IF NOT EXISTS user_matches_score_idx ON user_matches(match_score DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS user_matches_updated_at ON user_matches;
CREATE TRIGGER user_matches_updated_at
  BEFORE UPDATE ON user_matches
  FOR EACH ROW EXECUTE FUNCTION update_user_matches_updated_at();

-- =============================================
-- STORAGE BUCKETS
-- =============================================
-- Run these commands to set up storage buckets

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true);

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('widgets', 'widgets', true);

-- Storage policies (run in SQL editor)
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Widget images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'widgets');

-- CREATE POLICY "Users can upload widget images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'widgets' AND auth.uid()::text = (storage.foldername(name))[1]);
