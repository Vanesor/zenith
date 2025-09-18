# Unified Role System Design

## Current Problems Identified:

1. **Role Inconsistency**: Same user has different role representations
   - users.role = 'innovation_head' vs committee_roles.name = 'Innovation Head'
   - users.role = 'president' vs committee_roles.name = 'President'

2. **Missing Mappings**: Users with roles in users table don't have committee/club memberships
   - 27 users with non-student roles, but only some have committee/club memberships

3. **Duplicate Role Storage**: Roles stored in multiple places
   - users.role column
   - club_members.role column  
   - committee_members.role_id (via committee_roles table)

## New Unified Role System:

### Single Source of Truth: users.role Column

All roles will be stored in the users.role column using standardized names:

#### Role Hierarchy (ascending authority):
1. `student` - Regular student
2. `member` - Club member
3. `secretary` - Club secretary
4. `media` - Club media head
5. `co_coordinator` - Club co-coordinator
6. `coordinator` - Club coordinator
7. `joint_secretary` - Committee joint secretary
8. `joint_treasurer` - Committee joint treasurer
9. `outreach_head` - Committee outreach head
10. `media_head` - Committee media head
11. `secretary_committee` - Committee secretary
12. `treasurer` - Committee treasurer
13. `innovation_head` - Committee innovation head
14. `vice_president` - Committee vice president
15. `president` - Committee president
16. `admin` - System admin
17. `super_admin` - Super admin

### Table Modifications:

1. **users table**: Keep role column as primary role storage
2. **club_members table**: Remove role column, use users.role
3. **committee_members table**: Remove role_id, use users.role
4. **committee_roles table**: Keep for role definitions but not user assignments

### Permission Mapping:

#### Club Permissions (club-level access):
- `coordinator`, `co_coordinator`: Can manage club members, view submissions
- `secretary`, `media`: Can assist with club activities

#### Committee Permissions (zenith-level access):
- `joint_secretary`, `joint_treasurer`, `outreach_head`, `media_head`, `secretary_committee`, `treasurer`, `innovation_head`, `vice_president`, `president`: Full Zenith access

#### Admin Permissions (system-level access):
- `admin`: System administration
- `super_admin`: Full system access

## Implementation Plan:

1. Create migration script to standardize role names
2. Update database schema to remove redundant role columns
3. Modify RoleHierarchy.ts to use single role source
4. Update all queries to use users.role consistently