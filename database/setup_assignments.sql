-- ==============================================================================
-- ZENITH FORUM - SAMPLE ASSIGNMENTS DATA
-- ==============================================================================
-- This script creates sample assignment data for all clubs
-- ==============================================================================

-- Clear existing assignments
DELETE FROM assignment_submissions;
DELETE FROM assignments;

-- ==============================================================================
-- 1. ASCEND CLUB ASSIGNMENTS (Technical Focus)
-- ==============================================================================
INSERT INTO assignments (id, title, description, club_id, assigned_by, due_date, max_points, instructions, status, created_at) VALUES
('550e8400-a001-41d4-a716-446655440001', 'Web Development Project', 'Create a responsive website using React and Node.js', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 100, 'Build a full-stack web application with user authentication, responsive design, and database integration. Include proper documentation and deployment instructions.', 'active', CURRENT_TIMESTAMP),

('550e8400-a001-41d4-a716-446655440002', 'Machine Learning Model', 'Develop a predictive model using Python', 'ascend', '550e8400-e29b-41d4-a716-446655440010', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 120, 'Create a machine learning model to solve a real-world problem. Use libraries like scikit-learn or TensorFlow. Include data preprocessing, model training, evaluation, and visualization.', 'active', CURRENT_TIMESTAMP),

('550e8400-a001-41d4-a716-446655440003', 'Mobile App Development', 'Build a cross-platform mobile application', 'ascend', '550e8400-e29b-41d4-a716-446655440011', CURRENT_TIMESTAMP + INTERVAL '4 weeks', 150, 'Develop a mobile app using React Native or Flutter. The app should include multiple screens, local storage, and API integration. Focus on user experience and performance.', 'active', CURRENT_TIMESTAMP),

('550e8400-a001-41d4-a716-446655440004', 'Algorithm Design Challenge', 'Solve complex algorithmic problems', 'ascend', '550e8400-e29b-41d4-a716-446655440012', CURRENT_TIMESTAMP + INTERVAL '1 week', 80, 'Complete a series of algorithmic challenges focusing on data structures, dynamic programming, and graph algorithms. Submit solutions with complexity analysis.', 'active', CURRENT_TIMESTAMP);

-- ==============================================================================
-- 2. GENESIS CLUB ASSIGNMENTS (Business & Entrepreneurship Focus)
-- ==============================================================================
INSERT INTO assignments (id, title, description, club_id, assigned_by, due_date, max_points, instructions, status, created_at) VALUES
('550e8400-a002-41d4-a716-446655440001', 'Business Plan Development', 'Create a comprehensive business plan for a startup idea', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 100, 'Develop a detailed business plan including market analysis, financial projections, marketing strategy, and operational plan. Present your idea with supporting research and data.', 'active', CURRENT_TIMESTAMP),

('550e8400-a002-41d4-a716-446655440002', 'Market Research Project', 'Conduct market research for a product/service', 'genesis', '550e8400-e29b-41d4-a716-446655440020', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 90, 'Perform comprehensive market research for a chosen product or service. Include competitor analysis, target audience identification, and market size estimation with proper data collection methods.', 'active', CURRENT_TIMESTAMP),

('550e8400-a002-41d4-a716-446655440003', 'Digital Marketing Campaign', 'Design and execute a digital marketing strategy', 'genesis', '550e8400-e29b-41d4-a716-446655440021', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 110, 'Create a comprehensive digital marketing campaign including social media strategy, content calendar, SEO optimization, and performance metrics. Execute the campaign and analyze results.', 'active', CURRENT_TIMESTAMP),

('550e8400-a002-41d4-a716-446655440004', 'Financial Analysis Report', 'Analyze the financial performance of a company', 'genesis', '550e8400-e29b-41d4-a716-446655440022', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 85, 'Select a public company and conduct thorough financial analysis including ratio analysis, trend analysis, and investment recommendations. Use real financial data and provide insights.', 'active', CURRENT_TIMESTAMP);

-- ==============================================================================
-- 3. PHOENIX CLUB ASSIGNMENTS (Cultural & Creative Focus)
-- ==============================================================================
INSERT INTO assignments (id, title, description, club_id, assigned_by, due_date, max_points, instructions, status, created_at) VALUES
('550e8400-a003-41d4-a716-446655440001', 'Digital Art Portfolio', 'Create a diverse digital art portfolio', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP + INTERVAL '4 weeks', 120, 'Develop a comprehensive digital art portfolio showcasing various techniques and styles. Include concept art, illustrations, and digital paintings. Present your work with artist statements.', 'active', CURRENT_TIMESTAMP),

('550e8400-a003-41d4-a716-446655440002', 'Music Composition Project', 'Compose and produce an original music piece', 'phoenix', '550e8400-e29b-41d4-a716-446655440030', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 100, 'Create an original musical composition using digital audio workstation. Include sheet music, audio recording, and production notes. Demonstrate understanding of music theory and composition techniques.', 'active', CURRENT_TIMESTAMP),

('550e8400-a003-41d4-a716-446655440003', 'Cultural Event Planning', 'Design and plan a cultural event', 'phoenix', '550e8400-e29b-41d4-a716-446655440031', CURRENT_TIMESTAMP + INTERVAL '2 weeks', 95, 'Plan a comprehensive cultural event including venue selection, program design, budget planning, marketing strategy, and logistics coordination. Create detailed event timeline and contingency plans.', 'active', CURRENT_TIMESTAMP),

('550e8400-a003-41d4-a716-446655440004', 'Photography Exhibition', 'Curate a photography exhibition', 'phoenix', '550e8400-e29b-41d4-a716-446655440032', CURRENT_TIMESTAMP + INTERVAL '3 weeks', 110, 'Create a themed photography exhibition with 15-20 original photographs. Include artist statement, exhibition layout, and technical specifications for each piece. Focus on storytelling through imagery.', 'active', CURRENT_TIMESTAMP);

-- ==============================================================================
-- 4. SAMPLE ASSIGNMENT SUBMISSIONS
-- ==============================================================================
-- Some sample submissions to show the system working

-- ASCEND submissions
INSERT INTO assignment_submissions (id, assignment_id, user_id, submission_text, submitted_at, status) VALUES
('550e8400-s001-41d4-a716-446655440001', '550e8400-a001-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440100', 'I have completed the web development project. The application includes user authentication, responsive design, and database integration as requested. GitHub repository: https://github.com/student/web-project', CURRENT_TIMESTAMP - INTERVAL '1 day', 'submitted'),

('550e8400-s001-41d4-a716-446655440002', '550e8400-a001-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440101', 'Completed all algorithmic challenges. Solutions include time and space complexity analysis. Average time complexity achieved: O(n log n) for sorting problems, O(n) for most optimization problems.', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'submitted');

-- GENESIS submissions  
INSERT INTO assignment_submissions (id, assignment_id, user_id, submission_text, submitted_at, status) VALUES
('550e8400-s002-41d4-a716-446655440001', '550e8400-a002-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440200', 'Market research completed for sustainable fashion e-commerce platform. Identified target market of 18-35 year olds interested in eco-friendly fashion. Market size estimated at $2.3B with 15% annual growth.', CURRENT_TIMESTAMP - INTERVAL '3 hours', 'submitted');

-- PHOENIX submissions
INSERT INTO assignment_submissions (id, assignment_id, user_id, submission_text, submitted_at, status) VALUES
('550e8400-s003-41d4-a716-446655440001', '550e8400-a003-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440300', 'Cultural event plan completed for "Art Fusion Festival". Event will showcase interdisciplinary art forms with budget of $5000, expecting 200+ attendees. Detailed timeline and vendor contracts included.', CURRENT_TIMESTAMP - INTERVAL '1 day', 'submitted');

-- ==============================================================================
-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_assignments_club_id ON assignments(club_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_id ON assignment_submissions(user_id);

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================
-- Uncomment to verify the data has been inserted correctly

-- SELECT 'Assignments Created:' as info, count(*) as total FROM assignments;
-- SELECT 'Submissions Created:' as info, count(*) as total FROM assignment_submissions;
-- 
-- SELECT 
--   c.name as club_name,
--   count(a.id) as assignment_count,
--   count(ass.id) as submission_count
-- FROM clubs c
-- LEFT JOIN assignments a ON c.id = a.club_id
-- LEFT JOIN assignment_submissions ass ON a.id = ass.assignment_id
-- GROUP BY c.id, c.name
-- ORDER BY c.name;

-- ==============================================================================
-- SETUP COMPLETE
-- ==============================================================================
-- Assignments system is now properly initialized with:
-- ✅ 4 ASCEND assignments (technical projects)
-- ✅ 4 GENESIS assignments (business focused)
-- ✅ 4 PHOENIX assignments (creative projects)
-- ✅ Sample submissions for demonstration
-- ✅ Proper indexes for performance
-- ==============================================================================
