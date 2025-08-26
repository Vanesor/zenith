-- Insert upcoming events with future dates (after Aug 26, 2025)

-- ASCEND upcoming events
INSERT INTO events (id, title, description, event_date, event_time, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'AI & Machine Learning Workshop', 'Comprehensive workshop on artificial intelligence, machine learning algorithms, and practical implementations using Python and TensorFlow.', '2025-09-15', '10:00:00', 'Computer Lab Block A', 60, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Full Stack Development Bootcamp', 'Intensive bootcamp covering modern web development with React, Node.js, databases, and deployment strategies.', '2025-10-08', '09:30:00', 'Main Auditorium', 100, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASCEND'), NOW(), NOW());

-- ASTER upcoming events  
INSERT INTO events (id, title, description, event_date, event_time, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Mental Health Awareness Campaign', 'Community outreach program focused on mental health awareness, stress management, and peer support systems.', '2025-09-12', '14:30:00', 'Student Plaza', 200, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASTER'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Volunteer Drive for Community Service', 'Organizing volunteers for local community service projects including teaching underprivileged children and environmental cleanup.', '2025-10-05', '11:00:00', 'Community Center', 80, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ASTER'), NOW(), NOW());

-- ACHIEVERS upcoming events
INSERT INTO events (id, title, description, event_date, event_time, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'GATE Preparation Masterclass', 'Comprehensive preparation session for GATE exam covering key topics, solving strategies, and mock tests.', '2025-09-20', '10:30:00', 'Library Auditorium', 150, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ACHIEVERS'), NOW(), NOW()),
    
    (gen_random_uuid(), 'International Scholarship Fair', 'Information session featuring international universities, scholarship opportunities, and application guidance for global education.', '2025-10-12', '15:00:00', 'Exhibition Hall', 250, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ACHIEVERS'), NOW(), NOW());

-- ARTOVERT upcoming events
INSERT INTO events (id, title, description, event_date, event_time, location, max_attendees, status, club_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Cultural Fest - Kaleidoscope 2025', 'Annual cultural festival featuring dance, music, drama performances, art exhibitions, and creative competitions.', '2025-09-25', '16:00:00', 'Main Campus Grounds', 500, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ARTOVERT'), NOW(), NOW()),
    
    (gen_random_uuid(), 'Creative Writing & Poetry Workshop', 'Interactive workshop on creative writing, poetry composition, storytelling techniques, and literary expression.', '2025-10-18', '13:30:00', 'Literature Hall', 75, 'upcoming', 
     (SELECT id FROM clubs WHERE name = 'ARTOVERT'), NOW(), NOW());

-- Verify insertion
SELECT 'New upcoming events added:' as info, COUNT(*) as count FROM events WHERE event_date > CURRENT_DATE;

-- Show breakdown of all events by status
SELECT 
    c.name as club_name,
    COUNT(CASE WHEN e.status = 'past' OR e.event_date < CURRENT_DATE THEN 1 END) as past_events,
    COUNT(CASE WHEN e.status = 'upcoming' AND e.event_date >= CURRENT_DATE THEN 1 END) as upcoming_events,
    COUNT(e.id) as total_events
FROM clubs c
LEFT JOIN events e ON c.id = e.club_id
GROUP BY c.name
ORDER BY c.name;
