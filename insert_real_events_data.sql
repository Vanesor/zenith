-- Insert real events data based on the event reports
-- This script adds past events for different clubs to showcase in homeclub pages

-- First, let's check existing events
SELECT 'Current events count:' as info, COUNT(*) as count FROM events;

-- Insert ASCEND events (Technical Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Problem Solving Based on Aptitude', 'Workshop focused on developing problem-solving skills and aptitude testing techniques for competitive exams and placements.', '2024-12-15', 'Computer Lab Block A', 80, 'past', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Hackathon Weekend', 'Two-day coding hackathon where participants build innovative solutions to real-world problems using latest technologies.', '2025-08-17', 'Computer Lab Block A', 50, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW());

-- Insert ASTER events (Social Service Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Women Empowerment and Career Insights', 'Comprehensive session on women empowerment, career guidance, and leadership development for female students.', '2025-01-20', 'Seminar Hall', 120, 'past', 
     (SELECT id FROM clubs WHERE name = 'ASTER'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Leadership Development Session', 'Interactive workshop focusing on leadership skills, team management, and effective communication for student leaders.', '2025-08-07', 'Conference Room B', 60, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASTER'), NOW(), NOW());

-- Insert ACHIEVERS events (Academic Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'GRE Preparation Strategy Session', 'Comprehensive workshop on GRE preparation strategies, tips, and techniques for students planning higher education abroad.', '2025-02-10', 'Library Auditorium', 100, 'past', 
     (SELECT id FROM clubs WHERE name = 'ACHIEVERS'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Research Methodology Workshop', 'Detailed session on research methodologies, paper writing, and academic research techniques for undergraduate students.', '2025-08-05', 'Library Auditorium', 120, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ACHIEVERS'), NOW(), NOW());

-- Insert ARTOVERT events (Cultural Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Holistic Development Workshop', 'Workshop focusing on overall personality development, creative thinking, and artistic expression for students.', '2025-03-05', 'Community Center', 150, 'past', 
     (SELECT id FROM clubs WHERE name = 'ARTOVERT'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Cross-Club Collaboration Meet', 'Inter-club collaboration meeting to plan joint events and cultural activities for the upcoming semester.', '2025-08-03', 'Community Center', 150, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ARTOVERT'), NOW(), NOW());

-- Check the inserted events
SELECT 'Events inserted successfully. Total count:' as info, COUNT(*) as count FROM events;

-- Show events by club
SELECT 'Events by Club:' as info;
SELECT 
    c.name as club_name,
    COUNT(e.id) as event_count,
    COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as past_events,
    COUNT(CASE WHEN e.status = 'upcoming' THEN 1 END) as upcoming_events
FROM clubs c
LEFT JOIN events e ON c.id = e.club_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Show recent events details
SELECT 'Recent Events Details:' as info;
SELECT 
    e.title,
    c.name as club_name,
    e.event_date,
    e.status,
    e.location,
    e.max_attendees
FROM events e
JOIN clubs c ON e.club_id = c.id
ORDER BY e.event_date DESC
LIMIT 10;
-- These are past events that have already occurred

-- Problem solving based on aptitude (Ascend Club)
INSERT INTO events (
  id, title, description, event_date, location, club_id, max_attendees, 
  status, created_at, updated_at, activity_type, coordinator_notes
) VALUES (
  'evt_aptitude_2025_07_18',
  'Problem solving based on aptitude',
  'To strengthen students analytical thinking, quantitative reasoning, and logical problem-solving abilities through aptitude-based exercises and challenges.',
  '2025-07-18 14:15:00',
  'BF',
  'ascend',
  50,
  'completed',
  NOW(),
  NOW(),
  'Workshop',
  'Student Coordinators: Manasvi Giradkar, Mayur Aglawe, Radhika, Yogesh Chaudhari. Target: Second Year students of computer engineering department section A.'
);

-- GitHub Profile Creation and Importance Session (Ascend Club)  
INSERT INTO events (
  id, title, description, event_date, location, club_id, max_attendees,
  status, created_at, updated_at, activity_type, coordinator_notes
) VALUES (
  'evt_github_2025_02_13',
  'GitHub Profile Creation and Importance Session',
  'To guide second-year students in creating a professional GitHub profile and highlight the importance of GitHub in building a strong technical portfolio and career foundation.',
  '2025-02-13 12:15:00',
  'BF08',
  'ascend',
  40,
  'completed',
  NOW(),
  NOW(),
  'Workshop',
  'Student Coordinators: Atharva Bhede, Uday Bhoyar, Ayush Kshirsagar, Mohit Telang, Aditya Yelne. Target: Second year section A students.'
);

-- Women Empowerment and Career Insights (Artovert Club)
INSERT INTO events (
  id, title, description, event_date, location, club_id, max_attendees,
  status, created_at, updated_at, activity_type, coordinator_notes
) VALUES (
  'evt_women_empowerment_2025_03_07',
  'Women Empowerment and Career Insights',
  'To inspire and empower female students to pursue their career ambitions. To provide insights into career growth, personal development, and networking. To encourage students to step out of their comfort zones and face challenges with resilience.',
  '2025-03-07 12:00:00',
  'BF-04 & BF-05',
  'artovert',
  60,
  'completed',
  NOW(),
  NOW(),
  'Alumni Interaction Session',
  'Resource Person: Miss Tanya Gupta, Alumna (Batch 2018), St. Vincent Pallotti College of Engineering and Technology, Nagpur. Student Coordinators: Tejasi Ritraft (Coordinator), Sanved Kabade (Co-Coordinator). Approximately 70-80% students benefited.'
);

-- C++ Programming Session (Ascend Club)
INSERT INTO events (
  id, title, description, event_date, location, club_id, max_attendees,
  status, created_at, updated_at, activity_type, coordinator_notes
) VALUES (
  'evt_cpp_programming_2025_04_12',
  'C++ Programming Session',
  'To introduce club members to competitive programming. The objective was to strengthen students foundational understanding of C++ programming by covering key topics such as C++ fundamentals, loops, and conditionals. It also aimed to enhance problem-solving skills through weekly problem discussions.',
  '2025-04-12 17:00:00',
  'Online',
  'ascend',
  30,
  'completed',
  NOW(),
  NOW(),
  'Meeting',
  'Student Coordinators: Atharva Bhede, Ayush Kshirsagar. Target: Members of Ascend Club. The session covered key C++ programming topics including if-else statements, loops (for, while), arrays, vectors, and vector functions.'
);

-- IoT Made Easy Workshop (Ascend Club)
INSERT INTO events (
  id, title, description, event_date, location, club_id, max_attendees,
  status, created_at, updated_at, activity_type, coordinator_notes
) VALUES (
  'evt_iot_workshop_2025_02_15',
  'IoT Made Easy Workshop',
  'To provide students with hands-on experience and in-depth knowledge of IoT applications, focusing on practical implementations like smart home automation, and to enhance their understanding of embedded systems and IoT technology.',
  '2025-02-15 09:15:00',
  'BF04A',
  'ascend',
  25,
  'completed',
  NOW(),
  NOW(),
  'Workshop',
  'Resource Person: Prof. Sumit Chafale. Faculty Coordinators: Prof. Ansar Sheikh. Student Coordinators: Atharva Bhede, Uday Bhoyar, Ayush Kshirsagar, Mohit Telang, Aditya Yelne. Target: Exclusive for students who enrolled.'
);

-- WireShark Workshop (Ascend Club)
INSERT INTO events (
  id, title, description, event_date, location, club_id, max_attendees,
  status, created_at, updated_at, activity_type, coordinator_notes
) VALUES (
  'evt_wireshark_2025_02_24',
  'WireShark Workshop - Network Traffic Analysis',
  'To provide students with hands-on experience in network traffic analysis using Wireshark, and to enhance their understanding of packet analysis, network protocols, and security through real-world case studies.',
  '2025-02-24 14:15:00',
  'BF08',
  'ascend',
  35,
  'completed',
  NOW(),
  NOW(),
  'Workshop',
  'Faculty Coordinators: Prof. Riddhi Doshi. Student Coordinators: Rochan Awasthi, Srujan Zanjal, Aditya Naggurikar, Krushik Shahu, Sayali Bambal. Target: Second Year Section A students. The workshop covered basics of Wireshark, NICs in packet analysis, HTTP vs HTTPS, and OSI model layers and protocols.'
);

-- Add some upcoming events for demonstration
INSERT INTO events (
  id, title, description, event_date, location, club_id, max_attendees,
  status, created_at, updated_at, activity_type
) VALUES (
  'evt_ai_workshop_2025_09_15',
  'Introduction to Artificial Intelligence',
  'Comprehensive workshop covering AI fundamentals, machine learning basics, and practical applications in modern technology.',
  '2025-09-15 14:00:00',
  'Computer Lab',
  'ascend',
  40,
  'upcoming',
  NOW(),
  NOW(),
  'Workshop'
),
(
  'evt_soft_skills_2025_09_20',
  'Communication and Leadership Workshop',
  'Interactive session focusing on developing effective communication skills and leadership qualities for professional growth.',
  '2025-09-20 10:00:00',
  'Seminar Hall',
  'aster',
  50,
  'upcoming',
  NOW(),
  NOW(),
  'Workshop'
),
(
  'evt_career_guidance_2025_09_25',
  'Higher Studies and Career Planning',
  'Guidance session for students planning higher education abroad, entrance exam preparation, and career path selection.',
  '2025-09-25 15:00:00',
  'Auditorium',
  'achievers',
  60,
  'upcoming',
  NOW(),
  NOW(),
  'Seminar'
);

-- Create event_registrations table if it doesn't exist for attendee tracking
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) REFERENCES events(id),
  user_id VARCHAR(255) REFERENCES users(id),
  registration_date TIMESTAMP DEFAULT NOW(),
  attendance_status VARCHAR(20) DEFAULT 'registered',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add some sample registrations for past events
INSERT INTO event_registrations (event_id, user_id, attendance_status)
SELECT 
  'evt_aptitude_2025_07_18',
  id,
  'attended'
FROM users 
WHERE club_id = 'ascend' 
LIMIT 15;

INSERT INTO event_registrations (event_id, user_id, attendance_status)
SELECT 
  'evt_github_2025_02_13',
  id,
  'attended'
FROM users 
WHERE club_id = 'ascend' 
LIMIT 12;

INSERT INTO event_registrations (event_id, user_id, attendance_status)
SELECT 
  'evt_women_empowerment_2025_03_07',
  id,
  'attended'
FROM users 
WHERE club_id = 'artovert' 
LIMIT 8;

-- Add gallery_images column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

-- Update some events with sample gallery images
UPDATE events 
SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
]
WHERE id IN ('evt_aptitude_2025_07_18', 'evt_github_2025_02_13');

UPDATE events 
SET gallery_images = ARRAY[
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
]
WHERE id = 'evt_women_empowerment_2025_03_07';
