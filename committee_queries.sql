-- Get all committee members with user details
SELECT cm.id, cm.committee_id, cm.user_id, cm.role, cm.priority, 
       u.name, u.email, u.avatar
FROM committee_members cm
JOIN users u ON cm.user_id = u.id
ORDER BY cm.committee_id, cm.priority ASC;

-- Get committee member columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'committee_members';

-- Get committees table structure
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'committees';

-- Get all committees
SELECT * FROM committees;

-- Get top 4 members by priority for each committee
SELECT cm.committee_id, c.name as committee_name, cm.user_id, cm.role, cm.priority, 
       u.name, u.email
FROM committee_members cm
JOIN users u ON cm.user_id = u.id
JOIN committees c ON cm.committee_id = c.id
WHERE cm.priority <= 4
ORDER BY cm.committee_id, cm.priority ASC;

-- Export top leadership for all committees
SELECT c.name as committee_name, c.id as committee_id, 
       u.name as member_name, u.id as user_id,
       cm.role, cm.priority
FROM committees c
JOIN committee_members cm ON c.id = cm.committee_id
JOIN users u ON cm.user_id = u.id
ORDER BY c.name, cm.priority ASC;
