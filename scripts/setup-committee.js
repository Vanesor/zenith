// Setup committee structure using existing database connection
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
});

const Database = {
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
};

async function setupCommitteeStructure() {
  try {
    console.log('🚀 Setting up committee structure...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'committee-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by statements and execute
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        console.log('Executing:', trimmedStatement.substring(0, 50) + '...');
        await Database.query(trimmedStatement);
      }
    }
    
    console.log('✅ Table structure created!');
    console.log('📝 Inserting committee data...');
    
    // Insert main committee
    await Database.query(`
      INSERT INTO committees (name, description, hierarchy_level, is_active)
      VALUES ('Zenith Main Committee', 'The main student committee for Zenith organization', 1, true)
      ON CONFLICT (name) DO NOTHING
    `);
    
    // Get committee ID
    const committeeResult = await Database.query('SELECT id FROM committees WHERE name = $1', ['Zenith Main Committee']);
    const committeeId = committeeResult.rows[0].id;
    
    console.log('📋 Committee ID:', committeeId);
    
    // Insert roles
    const roles = [
      ['President', 'Overall leadership and strategic direction', 1, ['MANAGE_ALL', 'APPROVE_EVENTS', 'MANAGE_MEMBERS', 'APPROVE_BUDGETS', 'SYSTEM_ADMIN']],
      ['Vice President', 'Support president and lead special initiatives', 2, ['MANAGE_EVENTS', 'MANAGE_MEMBERS', 'APPROVE_CONTENT', 'COORDINATE_ACTIVITIES']],
      ['Innovation Head', 'Lead technical initiatives and innovation projects', 3, ['MANAGE_TECH_EVENTS', 'APPROVE_PROJECTS', 'COORDINATE_WORKSHOPS', 'MANAGE_RESOURCES']],
      ['Secretary', 'Maintain records and manage communications', 4, ['MANAGE_COMMUNICATIONS', 'MAINTAIN_RECORDS', 'SCHEDULE_MEETINGS', 'COORDINATE_LOGISTICS']],
      ['Outreach Coordinator', 'Manage external relations and partnerships', 5, ['MANAGE_PARTNERSHIPS', 'COORDINATE_OUTREACH', 'MANAGE_PUBLICITY', 'ORGANIZE_COLLABORATIONS']],
      ['Media Coordinator', 'Manage social media and content creation', 6, ['MANAGE_SOCIAL_MEDIA', 'CREATE_CONTENT', 'MANAGE_PUBLICITY', 'COORDINATE_MEDIA']],
      ['Treasurer', 'Manage finances and budget planning', 7, ['MANAGE_FINANCES', 'TRACK_BUDGETS', 'APPROVE_EXPENSES', 'MAINTAIN_ACCOUNTS']]
    ];
    
    for (const [name, description, hierarchy, permissions] of roles) {
      await Database.query(`
        INSERT INTO committee_roles (committee_id, name, description, hierarchy, permissions)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (committee_id, name) DO NOTHING
      `, [committeeId, name, description, hierarchy, permissions]);
      console.log(`✅ Role created: ${name}`);
    }
    
    console.log('✅ Committee structure setup complete!');
    console.log('📊 Verifying setup...');
    
    // Verify the setup
    const committees = await Database.query('SELECT * FROM committees');
    console.log(`📋 Committees created: ${committees.rows.length}`);
    
    const roles_check = await Database.query('SELECT cr.*, c.name as committee_name FROM committee_roles cr JOIN committees c ON cr.committee_id = c.id');
    console.log(`👥 Roles created: ${roles_check.rows.length}`);
    
    roles_check.rows.forEach(role => {
      console.log(`  - ${role.name} (${role.committee_name})`);
    });
    
    console.log('\n🎉 Committee structure ready!');
    console.log('You can now:');
    console.log('1. Visit /committee to see the committee page');
    console.log('2. Add members through the API or admin panel');
    console.log('3. Start using the committee management features');
    
  } catch (error) {
    console.error('❌ Error setting up committee structure:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupCommitteeStructure();
