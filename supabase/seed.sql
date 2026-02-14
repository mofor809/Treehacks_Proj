-- Wavelength Seed Data
-- Run this after schema.sql to populate demo content

-- =============================================
-- SAMPLE PROMPTS (12 prompts)
-- =============================================
INSERT INTO prompts (id, question, type, active_date) VALUES
  ('11111111-1111-1111-1111-111111111111', 'What song has been stuck in your head lately?', 'daily', CURRENT_DATE),
  ('22222222-2222-2222-2222-222222222222', 'Share a photo of your current view', 'daily', CURRENT_DATE - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', 'What''s the last thing that made you laugh?', 'daily', CURRENT_DATE - INTERVAL '2 days'),
  ('44444444-4444-4444-4444-444444444444', 'If you could master any skill overnight, what would it be?', 'weekly', CURRENT_DATE),
  ('55555555-5555-5555-5555-555555555555', 'What''s your go-to study spot on campus?', 'daily', CURRENT_DATE - INTERVAL '3 days'),
  ('66666666-6666-6666-6666-666666666666', 'Share a book or podcast recommendation', 'weekly', CURRENT_DATE - INTERVAL '1 week'),
  ('77777777-7777-7777-7777-777777777777', 'What''s your unpopular opinion?', 'random', NULL),
  ('88888888-8888-8888-8888-888888888888', 'Describe your perfect weekend', 'random', NULL),
  ('99999999-9999-9999-9999-999999999999', 'What''s something you''re looking forward to?', 'daily', CURRENT_DATE + INTERVAL '1 day'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Share a childhood memory that shaped who you are', 'weekly', CURRENT_DATE + INTERVAL '1 week'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'What''s your comfort food?', 'random', NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'If you could live in any fictional world, which would it be?', 'random', NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DEMO USER SETUP INSTRUCTIONS
-- =============================================
--
-- To populate demo data with actual users:
--
-- 1. Create test accounts via Supabase Auth:
--    - Go to Authentication > Users in Supabase Dashboard
--    - Click "Add user" and create a few test users
--    - Or sign up through the app
--
-- 2. Note down the user IDs (UUIDs)
--
-- 3. Update the profiles manually if needed:
--    UPDATE profiles SET bio = 'Demo user bio' WHERE id = 'USER_UUID';
--
-- 4. Create sample widgets for each user:
--
--    -- Photography enthusiast
--    INSERT INTO widgets (user_id, type, content, interest_tags) VALUES
--      ('USER_UUID_1', 'text', 'Just got back from an amazing sunrise shoot at the beach!',
--       ARRAY['photography', 'nature', 'travel']),
--      ('USER_UUID_1', 'text', 'Anyone else love golden hour photography?',
--       ARRAY['photography', 'art']);
--
--    -- Music lover
--    INSERT INTO widgets (user_id, type, content, interest_tags) VALUES
--      ('USER_UUID_2', 'text', 'Can''t stop listening to this new indie album. The guitar riffs are insane!',
--       ARRAY['music', 'indie', 'rock']),
--      ('USER_UUID_2', 'text', 'Looking for concert buddies for next month!',
--       ARRAY['music', 'concerts']);
--
--    -- Tech/coding person
--    INSERT INTO widgets (user_id, type, content, interest_tags) VALUES
--      ('USER_UUID_3', 'text', 'Finally deployed my first Next.js app. The learning curve was worth it!',
--       ARRAY['coding', 'tech', 'programming']),
--      ('USER_UUID_3', 'text', 'Coffee + coding = perfect Sunday',
--       ARRAY['coding', 'coffee']);
--
--    -- Fitness person
--    INSERT INTO widgets (user_id, type, content, interest_tags) VALUES
--      ('USER_UUID_4', 'text', 'Morning gym sessions hit different. 5am club anyone?',
--       ARRAY['fitness', 'wellness']),
--      ('USER_UUID_4', 'text', 'Started yoga this month and my flexibility has improved so much!',
--       ARRAY['yoga', 'fitness', 'meditation']);
--
--    -- Foodie
--    INSERT INTO widgets (user_id, type, content, interest_tags) VALUES
--      ('USER_UUID_5', 'text', 'Made homemade ramen from scratch. Took 12 hours but worth every minute!',
--       ARRAY['cooking', 'foodie']),
--      ('USER_UUID_5', 'text', 'Best coffee shop discoveries this month. Thread coming soon!',
--       ARRAY['coffee', 'foodie']);
--
-- 5. Add sample prompt responses:
--
--    INSERT INTO prompt_responses (prompt_id, user_id, content, interest_tags) VALUES
--      ('11111111-1111-1111-1111-111111111111', 'USER_UUID_1',
--       'That one song from the new Radiohead album - can''t get it out of my head!',
--       ARRAY['music', 'rock']),
--      ('11111111-1111-1111-1111-111111111111', 'USER_UUID_2',
--       'Honestly? The Mario theme song. My little brother won''t stop playing.',
--       ARRAY['gaming', 'music']);
--
-- =============================================

-- Note: The profiles table is automatically populated when users sign up
-- via the handle_new_user() trigger function in schema.sql
