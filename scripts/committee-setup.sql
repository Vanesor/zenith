-- Committee Structure Tables for Zenith

-- Create Committee table
CREATE TABLE IF NOT EXISTS committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    hierarchy_level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Committee Role table
CREATE TABLE IF NOT EXISTS committee_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hierarchy INTEGER NOT NULL DEFAULT 1,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(committee_id, name)
);

-- Create Committee Member table
CREATE TABLE IF NOT EXISTS committee_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES committee_roles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    term_start TIMESTAMP WITH TIME ZONE,
    term_end TIMESTAMP WITH TIME ZONE,
    achievements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(committee_id, role_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_committee_members_committee_id ON committee_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_user_id ON committee_members(user_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_role_id ON committee_members(role_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_status ON committee_members(status);
CREATE INDEX IF NOT EXISTS idx_committee_roles_committee_id ON committee_roles(committee_id);
