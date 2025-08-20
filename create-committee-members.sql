-- SQL Script to Create Committee Members in Supabase
-- Run this script in your Supabase SQL Editor

BEGIN;

-- Step 1: Create the main committee (Student Committee/Executive Committee)
INSERT INTO public.committees (id, name, description, hierarchy_level, is_active) 
VALUES (
    gen_random_uuid(),
    'Student Executive Committee',
    'The main student executive committee responsible for overall governance and leadership',
    1,
    true
) 
ON CONFLICT (name) DO NOTHING;

-- Get the committee ID for reference
DO $$
DECLARE
    committee_uuid uuid;
    president_role_id uuid;
    vice_president_role_id uuid;
    secretary_role_id uuid;
    treasurer_role_id uuid;
    innovation_head_role_id uuid;
    media_head_role_id uuid;
    
    yash_user_id uuid;
    sarthak_user_id uuid;
    manasvi_user_id uuid;
    yogeshvar_user_id uuid;
    atharva_user_id uuid;
    kaiwalya_user_id uuid;
BEGIN
    -- Get the committee ID
    SELECT id INTO committee_uuid FROM public.committees WHERE name = 'Student Executive Committee';
    
    -- Step 2: Create the roles within the committee
    INSERT INTO public.committee_roles (id, committee_id, name, description, hierarchy, permissions) VALUES
    (gen_random_uuid(), committee_uuid, 'President', 'President of the Student Executive Committee', 1, ARRAY['all_permissions', 'admin_access', 'committee_management']),
    (gen_random_uuid(), committee_uuid, 'Vice President', 'Vice President of the Student Executive Committee', 2, ARRAY['executive_access', 'committee_management', 'event_management']),
    (gen_random_uuid(), committee_uuid, 'Secretary', 'Secretary of the Student Executive Committee', 3, ARRAY['documentation', 'meeting_management', 'communication']),
    (gen_random_uuid(), committee_uuid, 'Treasurer', 'Treasurer of the Student Executive Committee', 4, ARRAY['financial_management', 'budget_control', 'expense_tracking']),
    (gen_random_uuid(), committee_uuid, 'Innovation Head', 'Innovation Head of the Student Executive Committee', 5, ARRAY['innovation_projects', 'technology_initiatives', 'research_coordination']),
    (gen_random_uuid(), committee_uuid, 'Media Head', 'Media Head of the Student Executive Committee', 6, ARRAY['media_management', 'social_media', 'publicity', 'content_creation'])
    ON CONFLICT DO NOTHING;
    
    -- Get role IDs
    SELECT id INTO president_role_id FROM public.committee_roles WHERE committee_id = committee_uuid AND name = 'President';
    SELECT id INTO vice_president_role_id FROM public.committee_roles WHERE committee_id = committee_uuid AND name = 'Vice President';
    SELECT id INTO secretary_role_id FROM public.committee_roles WHERE committee_id = committee_uuid AND name = 'Secretary';
    SELECT id INTO treasurer_role_id FROM public.committee_roles WHERE committee_id = committee_uuid AND name = 'Treasurer';
    SELECT id INTO innovation_head_role_id FROM public.committee_roles WHERE committee_id = committee_uuid AND name = 'Innovation Head';
    SELECT id INTO media_head_role_id FROM public.committee_roles WHERE committee_id = committee_uuid AND name = 'Media Head';
    
    -- Step 3: Create user accounts (if they don't already exist)
    -- Note: You'll need to update passwords and other details as needed
    
    -- Yash Siddhabhatti - President
    INSERT INTO public.users (id, email, password_hash, name, role, created_at) VALUES
    (gen_random_uuid(), 'yash.siddhabhatti@zenith.edu', '$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy', 'Yash Siddhabhatti', 'president', CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;
    
    -- Sarthak Thote - Vice President
    INSERT INTO public.users (id, email, password_hash, name, role, created_at) VALUES
    (gen_random_uuid(), 'sarthak.thote@zenith.edu', '$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy', 'Sarthak Thote', 'vice_president', CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;
    
    -- Manasvi Giradkar - Secretary
    INSERT INTO public.users (id, email, password_hash, name, role, created_at) VALUES
    (gen_random_uuid(), 'manasvi.giradkar@zenith.edu', '$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy', 'Manasvi Giradkar', 'secretary', CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;
    
    -- Yogeshvar Chaudhari - Treasurer
    INSERT INTO public.users (id, email, password_hash, name, role, created_at) VALUES
    (gen_random_uuid(), 'yogeshvar.chaudhari@zenith.edu', '$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy', 'Yogeshvar Chaudhari', 'treasurer', CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;
    
    -- Atharva Naitam - Innovation Head
    INSERT INTO public.users (id, email, password_hash, name, role, created_at) VALUES
    (gen_random_uuid(), 'atharva.naitam@zenith.edu', '$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy', 'Atharva Naitam', 'innovation_head', CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;
    
    -- Kaiwalya Pund - Media Head
    INSERT INTO public.users (id, email, password_hash, name, role, created_at) VALUES
    (gen_random_uuid(), 'kaiwalya.pund@zenith.edu', '$2b$12$XbcEa4LED/o71VjyMDgIKOuVoOyOqCZG4AMVxVGt4nQZf13Cv3wcy', 'Kaiwalya Pund', 'media', CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;
    
    -- Get user IDs
    SELECT id INTO yash_user_id FROM public.users WHERE email = 'yash.siddhabhatti@zenith.edu';
    SELECT id INTO sarthak_user_id FROM public.users WHERE email = 'sarthak.thote@zenith.edu';
    SELECT id INTO manasvi_user_id FROM public.users WHERE email = 'manasvi.giradkar@zenith.edu';
    SELECT id INTO yogeshvar_user_id FROM public.users WHERE email = 'yogeshvar.chaudhari@zenith.edu';
    SELECT id INTO atharva_user_id FROM public.users WHERE email = 'atharva.naitam@zenith.edu';
    SELECT id INTO kaiwalya_user_id FROM public.users WHERE email = 'kaiwalya.pund@zenith.edu';
    
    -- Step 4: Assign users to committee roles
    INSERT INTO public.committee_members (committee_id, role_id, user_id, status, joined_at, term_start, term_end) VALUES
    (committee_uuid, president_role_id, yash_user_id, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year'),
    (committee_uuid, vice_president_role_id, sarthak_user_id, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year'),
    (committee_uuid, secretary_role_id, manasvi_user_id, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year'),
    (committee_uuid, treasurer_role_id, yogeshvar_user_id, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year'),
    (committee_uuid, innovation_head_role_id, atharva_user_id, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year'),
    (committee_uuid, media_head_role_id, kaiwalya_user_id, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Committee members created successfully!';
    RAISE NOTICE 'Committee ID: %', committee_uuid;
    RAISE NOTICE 'President: Yash Siddhabhatti (ID: %)', yash_user_id;
    RAISE NOTICE 'Vice President: Sarthak Thote (ID: %)', sarthak_user_id;
    RAISE NOTICE 'Secretary: Manasvi Giradkar (ID: %)', manasvi_user_id;
    RAISE NOTICE 'Treasurer: Yogeshvar Chaudhari (ID: %)', yogeshvar_user_id;
    RAISE NOTICE 'Innovation Head: Atharva Naitam (ID: %)', atharva_user_id;
    RAISE NOTICE 'Media Head: Kaiwalya Pund (ID: %)', kaiwalya_user_id;
    
END $$;

COMMIT;

-- Verification Query - Run this to verify the setup
SELECT 
    c.name as committee_name,
    cr.name as role_name,
    u.name as member_name,
    u.email as member_email,
    cm.status,
    cm.joined_at,
    cm.term_start,
    cm.term_end
FROM public.committees c
JOIN public.committee_roles cr ON c.id = cr.committee_id
JOIN public.committee_members cm ON cr.id = cm.role_id
JOIN public.users u ON cm.user_id = u.id
WHERE c.name = 'Student Executive Committee'
ORDER BY cr.hierarchy;
