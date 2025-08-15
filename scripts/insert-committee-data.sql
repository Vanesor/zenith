-- Insert Main Committee
INSERT INTO committees (name, description, hierarchy_level, is_active)
VALUES ('Zenith Main Committee', 'The main student committee for Zenith organization', 1, true)
ON CONFLICT (name) DO NOTHING;
