-- Check current events count
SELECT 'Current events count:' as info, COUNT(*) as count FROM events;

-- Clear existing test events if any (optional)
-- DELETE FROM events WHERE title LIKE '%Test%' OR title LIKE '%Sample%';

-- Insert ASCEND events (Technical Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Problem Solving Based on Aptitude', 'Workshop focused on developing problem-solving skills and aptitude testing techniques for competitive exams and placements.', '2024-12-15', 'Computer Lab Block A', 80, 'past', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW()),
    
    (gen_random_uuid(), 'GitHub Profile Creation and Importance Session', 'Session to guide students in creating professional GitHub profiles and understanding the importance of GitHub in technical careers.', '2025-02-13', 'BF08', 40, 'past', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW()),
    
    (gen_random_uuid(), 'C++ Programming Session', 'Comprehensive session covering C++ fundamentals, loops, conditionals, and competitive programming techniques.', '2025-04-12', 'Online', 30, 'past', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW()),
    
    (gen_random_uuid(), 'IoT Made Easy Workshop', 'Hands-on workshop introducing Internet of Things concepts, sensor integration, and practical IoT project development.', '2025-05-15', 'Electronics Lab', 25, 'past', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Hackathon Weekend', 'Two-day coding hackathon where participants build innovative solutions to real-world problems using latest technologies.', '2025-08-17', 'Computer Lab Block A', 50, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW()),
     
    (gen_random_uuid(), 'Coding Summit 2025', 'Annual coding summit featuring industry experts, workshops on emerging technologies, and competitive programming contests.', '2025-08-10', 'Main Auditorium', 200, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW());

-- Insert ASTER events (Social Service Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Women Empowerment and Career Insights', 'Comprehensive session on women empowerment, career guidance, and leadership development for female students.', '2025-03-07', 'BF-04 & BF-05', 60, 'past', 
     (SELECT id FROM clubs WHERE name = 'ASTER'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Leadership Development Session', 'Interactive workshop focusing on leadership skills, team management, and effective communication for student leaders.', '2025-08-07', 'Conference Room B', 60, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASTER'), NOW(), NOW()),
     
    (gen_random_uuid(), 'Communication Skills Workshop', 'Practical workshop on effective communication, public speaking, and presentation skills for personal and professional development.', '2025-08-13', 'Seminar Hall', 100, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASTER'), NOW(), NOW());

-- Insert ACHIEVERS events (Academic Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'GRE Preparation Strategy Session', 'Comprehensive workshop on GRE preparation strategies, tips, and techniques for students planning higher education abroad.', '2025-02-10', 'Library Auditorium', 100, 'past', 
     (SELECT id FROM clubs WHERE name = 'ACHIEVERS'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Research Methodology Workshop', 'Detailed session on research methodologies, paper writing, and academic research techniques for undergraduate students.', '2025-08-05', 'Library Auditorium', 120, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ACHIEVERS'), NOW(), NOW()),
     
    (gen_random_uuid(), 'Higher Studies Fair', 'Information fair featuring universities, scholarship opportunities, and guidance for students planning higher education.', '2025-08-15', 'Exhibition Hall', 300, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ACHIEVERS'), NOW(), NOW());

-- Insert ARTOVERT events (Cultural Club)
INSERT INTO events (id, title, description, event_date, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Holistic Development Workshop', 'Workshop focusing on overall personality development, creative thinking, and artistic expression for students.', '2025-03-05', 'Community Center', 150, 'past', 
     (SELECT id FROM clubs WHERE name = 'ARTOVERT'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Cross-Club Collaboration Meet', 'Inter-club collaboration meeting to plan joint events and cultural activities for the upcoming semester.', '2025-08-03', 'Community Center', 150, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ARTOVERT'), NOW(), NOW()),
     
    (gen_random_uuid(), 'Holistic Development Fair', 'Cultural fair showcasing student talents, art exhibitions, and interactive sessions on creativity and personal growth.', '2025-08-20', 'Main Campus', 400, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ARTOVERT'), NOW(), NOW());

-- Check final count and verify insertion
SELECT 'Events inserted successfully. Total count:' as info, COUNT(*) as count FROM events;

-- Show breakdown by club
SELECT 'Events by Club:' as info;
SELECT 
    c.name as club_name,
    COUNT(e.id) as event_count,
    COUNT(CASE WHEN e.status = 'past' THEN 1 END) as past_events,
    COUNT(CASE WHEN e.status = 'upcoming' THEN 1 END) as upcoming_events
FROM clubs c
LEFT JOIN events e ON c.id = e.club_id
GROUP BY c.name
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
