-- Additional dummy accounts for club management
-- Run this AFTER running complete_setup.sql
-- Insert coordinator and management accounts

-- First, insert the clubs data
INSERT INTO clubs (id, name, type, description, long_description, icon, color) VALUES
('ascend', 'Ascend', 'Coding Club', 'Programming challenges and tech innovation', 'Ascend is the premier coding club of Zenith, dedicated to fostering excellence in programming, software development, and technological innovation.', 'Code', 'from-blue-500 to-cyan-500'),
('aster', 'Aster', 'Soft Skills Club', 'Communication and leadership development', 'Aster focuses on developing essential soft skills including communication, leadership, teamwork, and interpersonal abilities.', 'MessageSquare', 'from-green-500 to-emerald-500'),
('achievers', 'Achievers', 'Higher Studies Club', 'Graduate preparation and academic excellence', 'Achievers is dedicated to helping students excel in their academic pursuits and prepare for higher studies.', 'GraduationCap', 'from-purple-500 to-violet-500'),
('altogether', 'Altogether', 'Holistic Growth', 'Wellness and personality development', 'Altogether focuses on holistic personality development, mental wellness, and life skills.', 'Heart', 'from-pink-500 to-rose-500');

-- Now insert management accounts
-- Ascend Club Management
INSERT INTO users (id, email, password_hash, name, role, clubs, bio, avatar) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'alex.chen.coord@zenith.edu', '$2b$10$example_hash', 'Alex Chen', 'coordinator', '{"ascend"}', 'Senior Software Engineer and Ascend Coordinator. Passionate about AI and full-stack development.', '/avatars/alex-chen.jpg'),
('550e8400-e29b-41d4-a716-446655440102', 'sarah.johnson.cocoord@zenith.edu', '$2b$10$example_hash', 'Sarah Johnson', 'co_coordinator', '{"ascend"}', 'Tech Lead and Co-Coordinator. Specializes in React and Node.js development.', '/avatars/sarah-johnson.jpg'),
('550e8400-e29b-41d4-a716-446655440103', 'mike.davis.sec@zenith.edu', '$2b$10$example_hash', 'Mike Davis', 'secretary', '{"ascend"}', 'DevOps Engineer and Secretary. Manages club documentation and logistics.', '/avatars/mike-davis.jpg'),
('550e8400-e29b-41d4-a716-446655440104', 'emily.zhang.media@zenith.edu', '$2b$10$example_hash', 'Emily Zhang', 'media', '{"ascend"}', 'UI/UX Designer and Media Head. Creates engaging content for social platforms.', '/avatars/emily-zhang.jpg'),

-- Aster Club Management
('550e8400-e29b-41d4-a716-446655440201', 'jessica.liu.coord@zenith.edu', '$2b$10$example_hash', 'Jessica Liu', 'coordinator', '{"aster"}', 'Communication expert and Aster Coordinator. 10+ years in corporate training.', '/avatars/jessica-liu.jpg'),
('550e8400-e29b-41d4-a716-446655440202', 'david.park.cocoord@zenith.edu', '$2b$10$example_hash', 'David Park', 'co_coordinator', '{"aster"}', 'Leadership coach and Co-Coordinator. Specializes in team building.', '/avatars/david-park.jpg'),
('550e8400-e29b-41d4-a716-446655440203', 'rachel.green.sec@zenith.edu', '$2b$10$example_hash', 'Rachel Green', 'secretary', '{"aster"}', 'Event coordinator and Secretary. Expert in workshop planning.', '/avatars/rachel-green.jpg'),
('550e8400-e29b-41d4-a716-446655440204', 'tom.wilson.media@zenith.edu', '$2b$10$example_hash', 'Tom Wilson', 'media', '{"aster"}', 'Content strategist and Media Head. Creates compelling presentations.', '/avatars/tom-wilson.jpg'),

-- Achievers Club Management
('550e8400-e29b-41d4-a716-446655440301', 'priya.sharma.coord@zenith.edu', '$2b$10$example_hash', 'Dr. Priya Sharma', 'coordinator', '{"achievers"}', 'PhD in Computer Science, Academic advisor and Achievers Coordinator.', '/avatars/priya-sharma.jpg'),
('550e8400-e29b-41d4-a716-446655440302', 'kevin.lee.cocoord@zenith.edu', '$2b$10$example_hash', 'Kevin Lee', 'co_coordinator', '{"achievers"}', 'Graduate student mentor and Co-Coordinator. Harvard MBA graduate.', '/avatars/kevin-lee.jpg'),
('550e8400-e29b-41d4-a716-446655440303', 'lisa.wang.sec@zenith.edu', '$2b$10$example_hash', 'Lisa Wang', 'secretary', '{"achievers"}', 'Research coordinator and Secretary. Manages academic programs.', '/avatars/lisa-wang.jpg'),
('550e8400-e29b-41d4-a716-446655440304', 'jake.thompson.media@zenith.edu', '$2b$10$example_hash', 'Jake Thompson', 'media', '{"achievers"}', 'Academic content creator and Media Head. PhD candidate.', '/avatars/jake-thompson.jpg'),

-- Altogether Club Management
('550e8400-e29b-41d4-a716-446655440401', 'maya.patel.coord@zenith.edu', '$2b$10$example_hash', 'Maya Patel', 'coordinator', '{"altogether"}', 'Licensed therapist and Altogether Coordinator. Mental health advocate.', '/avatars/maya-patel.jpg'),
('550e8400-e29b-41d4-a716-446655440402', 'chris.martinez.cocoord@zenith.edu', '$2b$10$example_hash', 'Chris Martinez', 'co_coordinator', '{"altogether"}', 'Wellness coach and Co-Coordinator. Certified mindfulness instructor.', '/avatars/chris-martinez.jpg'),
('550e8400-e29b-41d4-a716-446655440403', 'anna.brown.sec@zenith.edu', '$2b$10$example_hash', 'Anna Brown', 'secretary', '{"altogether"}', 'Program coordinator and Secretary. Organizes wellness activities.', '/avatars/anna-brown.jpg'),
('550e8400-e29b-41d4-a716-446655440404', 'sam.rodriguez.media@zenith.edu', '$2b$10$example_hash', 'Sam Rodriguez', 'media', '{"altogether"}', 'Social media manager and Media Head. Creates wellness content.', '/avatars/sam-rodriguez.jpg'),

-- Zenith Committee (Overall leadership)
('550e8400-e29b-41d4-a716-446655440501', 'robert.president@zenith.edu', '$2b$10$example_hash', 'Robert Johnson', 'president', '{"ascend", "aster", "achievers", "altogether"}', 'Computer Science senior and Zenith Forum President. Student government leader.', '/avatars/robert-johnson.jpg'),
('550e8400-e29b-41d4-a716-446655440502', 'maria.vp@zenith.edu', '$2b$10$example_hash', 'Maria Garcia', 'vice_president', '{"ascend", "aster", "achievers", "altogether"}', 'Business Administration senior and Vice President. Event management expert.', '/avatars/maria-garcia.jpg'),
('550e8400-e29b-41d4-a716-446655440503', 'james.innovation@zenith.edu', '$2b$10$example_hash', 'James Wilson', 'innovation_head', '{"ascend", "aster", "achievers", "altogether"}', 'Innovation Head focused on new technologies and club initiatives.', '/avatars/james-wilson.jpg'),
('550e8400-e29b-41d4-a716-446655440504', 'sophia.treasurer@zenith.edu', '$2b$10$example_hash', 'Sophia Chen', 'treasurer', '{"ascend", "aster", "achievers", "altogether"}', 'Finance major and Treasurer. Manages all club budgets and expenses.', '/avatars/sophia-chen.jpg'),
('550e8400-e29b-41d4-a716-446655440505', 'daniel.outreach@zenith.edu', '$2b$10$example_hash', 'Daniel Kim', 'outreach', '{"ascend", "aster", "achievers", "altogether"}', 'Communications major and Outreach coordinator. Builds external partnerships.', '/avatars/daniel-kim.jpg'),

-- Regular students with varied club memberships
('550e8400-e29b-41d4-a716-446655440601', 'student1@zenith.edu', '$2b$10$example_hash', 'John Smith', 'student', '{"ascend"}', 'Computer Science sophomore interested in AI and machine learning.', '/avatars/john-smith.jpg'),
('550e8400-e29b-41d4-a716-446655440602', 'student2@zenith.edu', '$2b$10$example_hash', 'Emma Davis', 'student', '{"aster", "altogether"}', 'Psychology major focused on communication and wellness.', '/avatars/emma-davis.jpg'),
('550e8400-e29b-41d4-a716-446655440603', 'student3@zenith.edu', '$2b$10$example_hash', 'Michael Brown', 'student', '{"achievers"}', 'Pre-med student preparing for graduate school.', '/avatars/michael-brown.jpg'),
('550e8400-e29b-41d4-a716-446655440604', 'student4@zenith.edu', '$2b$10$example_hash', 'Olivia Taylor', 'student', '{"ascend", "aster"}', 'Software Engineering major with leadership interests.', '/avatars/olivia-taylor.jpg'),
('550e8400-e29b-41d4-a716-446655440605', 'student5@zenith.edu', '$2b$10$example_hash', 'William Johnson', 'student', '{"altogether", "achievers"}', 'Philosophy major focused on personal development.', '/avatars/william-johnson.jpg');

-- Update club leadership references
UPDATE clubs SET 
  coordinator_id = '550e8400-e29b-41d4-a716-446655440101',
  co_coordinator_id = '550e8400-e29b-41d4-a716-446655440102',
  secretary_id = '550e8400-e29b-41d4-a716-446655440103',
  media_id = '550e8400-e29b-41d4-a716-446655440104'
WHERE id = 'ascend';

UPDATE clubs SET 
  coordinator_id = '550e8400-e29b-41d4-a716-446655440201',
  co_coordinator_id = '550e8400-e29b-41d4-a716-446655440202',
  secretary_id = '550e8400-e29b-41d4-a716-446655440203',
  media_id = '550e8400-e29b-41d4-a716-446655440204'
WHERE id = 'aster';

UPDATE clubs SET 
  coordinator_id = '550e8400-e29b-41d4-a716-446655440301',
  co_coordinator_id = '550e8400-e29b-41d4-a716-446655440302',
  secretary_id = '550e8400-e29b-41d4-a716-446655440303',
  media_id = '550e8400-e29b-41d4-a716-446655440304'
WHERE id = 'achievers';

UPDATE clubs SET 
  coordinator_id = '550e8400-e29b-41d4-a716-446655440401',
  co_coordinator_id = '550e8400-e29b-41d4-a716-446655440402',
  secretary_id = '550e8400-e29b-41d4-a716-446655440403',
  media_id = '550e8400-e29b-41d4-a716-446655440404'
WHERE id = 'altogether';
