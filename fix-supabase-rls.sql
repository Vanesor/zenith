-- Fix RLS policies for custom JWT authentication
-- Disable RLS since we're using custom JWT auth instead of Supabase Auth
ALTER TABLE media_files DISABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('chat-attachments', 'chat-attachments', false),
('question-images', 'question-images', true),
('event-images', 'event-images', true),
('post-images', 'post-images', true),
('club-images', 'club-images', true)
ON CONFLICT (id) DO NOTHING;

-- Simple storage policies that work with service key
DROP POLICY IF EXISTS "Public bucket access" ON storage.objects;
DROP POLICY IF EXISTS "Service key access" ON storage.objects;

CREATE POLICY "Public bucket access" ON storage.objects  
  FOR ALL USING (bucket_id IN ('avatars', 'question-images', 'event-images', 'post-images', 'club-images'));

CREATE POLICY "Service key access" ON storage.objects  
  FOR ALL USING (bucket_id IN ('chat-attachments', 'assignment-files'));
