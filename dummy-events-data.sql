-- Dummy Events Data for Zenith
-- This file contains sample events for different clubs

-- Insert dummy events
INSERT INTO events (id, title, description, event_date, event_time, location, club_id, status, created_by, event_incharge, event_coordinator, max_attendees, created_at, updated_at) VALUES 
-- Computer Science Club Events
('e1000001-1111-2222-3333-444444444444', 'AI Workshop Series', 'Learn the fundamentals of artificial intelligence and machine learning with hands-on coding exercises.', '2025-08-25', '14:00:00', 'Computer Lab A', 'cs', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Dr. Sarah Chen', 'Alex Rodriguez', 50, NOW(), NOW()),
('e1000002-1111-2222-3333-444444444444', 'Hackathon 2025', 'Join our 48-hour coding marathon where teams compete to build innovative solutions to real-world problems.', '2025-09-15', '09:00:00', 'Main Auditorium', 'cs', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Prof. Mike Johnson', 'Sarah Kim', 100, NOW(), NOW()),
('e1000003-1111-2222-3333-444444444444', 'Tech Talk: Cloud Computing', 'Industry experts discuss the latest trends in cloud computing and DevOps practices.', '2025-08-28', '16:30:00', 'Lecture Hall B', 'cs', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Dr. Emily Wong', 'David Park', 75, NOW(), NOW()),

-- Robotics Club Events
('e2000001-1111-2222-3333-444444444444', 'Robot Building Workshop', 'Learn to build your first robot from scratch using Arduino and sensors.', '2025-08-26', '13:00:00', 'Robotics Lab', 'robotics', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Dr. John Martinez', 'Lisa Chen', 30, NOW(), NOW()),
('e2000002-1111-2222-3333-444444444444', 'RoboWars Competition', 'Epic robot battle competition where teams compete with their custom-built combat robots.', '2025-09-20', '15:00:00', 'Sports Arena', 'robotics', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Prof. Anna Lee', 'Tom Wilson', 200, NOW(), NOW()),

-- Drama Club Events
('e3000001-1111-2222-3333-444444444444', 'Acting Masterclass', 'Professional acting techniques workshop with renowned theater director.', '2025-08-30', '18:00:00', 'Theater Hall', 'drama', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Ms. Rachel Green', 'Michael Brown', 40, NOW(), NOW()),
('e3000002-1111-2222-3333-444444444444', 'Annual Drama Festival', 'Showcase of original plays and performances by our talented drama club members.', '2025-10-05', '19:30:00', 'Main Theater', 'drama', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Director James Wilson', 'Emma Davis', 300, NOW(), NOW()),

-- Music Club Events
('e4000001-1111-2222-3333-444444444444', 'Jazz Night', 'An evening of smooth jazz performances by our talented student musicians.', '2025-09-01', '20:00:00', 'Music Hall', 'music', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Prof. Maria Garcia', 'Chris Taylor', 120, NOW(), NOW()),
('e4000002-1111-2222-3333-444444444444', 'Battle of the Bands', 'Student bands compete for the title of best campus band in this exciting musical showdown.', '2025-09-25', '17:00:00', 'Outdoor Amphitheater', 'music', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Mr. Daniel Lee', 'Sophie Anderson', 500, NOW(), NOW()),

-- Art Club Events
('e5000001-1111-2222-3333-444444444444', 'Digital Art Workshop', 'Learn digital painting and illustration techniques using professional software.', '2025-08-27', '15:30:00', 'Art Studio', 'art', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Ms. Jennifer Adams', 'Ryan Mitchell', 25, NOW(), NOW()),
('e5000002-1111-2222-3333-444444444444', 'Student Art Exhibition', 'Annual showcase of student artwork including paintings, sculptures, and digital art.', '2025-10-10', '10:00:00', 'Gallery Space', 'art', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Prof. Robert Kim', 'Ashley White', 150, NOW(), NOW()),

-- Sports Club Events
('e6000001-1111-2222-3333-444444444444', 'Basketball Tournament', 'Inter-college basketball championship with teams from across the region.', '2025-09-10', '16:00:00', 'Basketball Court', 'sports', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Coach Mark Thompson', 'Kevin Johnson', 1000, NOW(), NOW()),
('e6000002-1111-2222-3333-444444444444', 'Fitness Challenge', 'Multi-sport fitness competition testing endurance, strength, and agility.', '2025-08-29', '08:00:00', 'Sports Complex', 'sports', 'upcoming', '550e8400-e29b-41d4-a716-446655440020', 'Ms. Laura Wilson', 'Jake Martinez', 80, NOW(), NOW());

-- Insert some event attendees (sample data)
INSERT INTO event_attendees (id, event_id, user_id, attendance_status, registered_at) VALUES 
('a1000001-1111-2222-3333-444444444444', 'e1000001-1111-2222-3333-444444444444', '550e8400-e29b-41d4-a716-446655440020', 'registered', NOW()),
('a1000002-1111-2222-3333-444444444444', 'e1000002-1111-2222-3333-444444444444', '550e8400-e29b-41d4-a716-446655440020', 'registered', NOW()),
('a1000003-1111-2222-3333-444444444444', 'e2000001-1111-2222-3333-444444444444', '550e8400-e29b-41d4-a716-446655440020', 'registered', NOW());

-- Update club names in the clubs table if needed (ensure clubs exist)
INSERT INTO clubs (id, name, description, type, coordinator_id, member_count, created_at, updated_at) VALUES 
('cs', 'Computer Science Club', 'A community for programming enthusiasts and tech innovators', 'technical', '550e8400-e29b-41d4-a716-446655440020', 85, NOW(), NOW()),
('robotics', 'Robotics Club', 'Building the future with robots and automation', 'technical', '550e8400-e29b-41d4-a716-446655440020', 45, NOW(), NOW()),
('drama', 'Drama Club', 'Express yourself through theater and performing arts', 'cultural', '550e8400-e29b-41d4-a716-446655440020', 62, NOW(), NOW()),
('music', 'Music Club', 'Harmony and rhythm for music lovers', 'cultural', '550e8400-e29b-41d4-a716-446655440020', 78, NOW(), NOW()),
('art', 'Art Club', 'Visual arts and creative expression', 'cultural', '550e8400-e29b-41d4-a716-446655440020', 38, NOW(), NOW()),
('sports', 'Sports Club', 'Athletics and physical fitness for everyone', 'sports', '550e8400-e29b-41d4-a716-446655440020', 120, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  coordinator_id = EXCLUDED.coordinator_id,
  member_count = EXCLUDED.member_count,
  updated_at = NOW();
