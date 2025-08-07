// Check user table structure and add missing columns if needed
import { Database } from './src/lib/database';

async function checkAndUpdateUserTable() {
  console.log('=== Checking Users Table Structure ===\n');
  
  try {
    // Check current columns
    const result = await Database.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns in users table:');
    const existingColumns = [];
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
      existingColumns.push(row.column_name);
    });

    // Check if we need to add missing columns
    const requiredColumns = [
      { name: 'phone', type: 'VARCHAR(50)', nullable: true },
      { name: 'location', type: 'VARCHAR(255)', nullable: true },
      { name: 'website', type: 'VARCHAR(255)', nullable: true },
      { name: 'github', type: 'VARCHAR(255)', nullable: true },
      { name: 'linkedin', type: 'VARCHAR(255)', nullable: true },
      { name: 'twitter', type: 'VARCHAR(255)', nullable: true }
    ];

    console.log('\n=== Adding Missing Columns ===');
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        try {
          await Database.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Added ${column.name} column`);
        } catch (error) {
          console.log(`❌ Failed to add ${column.name}:`, error.message);
        }
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }

    // Check final structure
    console.log('\n=== Final Table Structure ===');
    const finalResult = await Database.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    finalResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await Database.close();
  }
}

checkAndUpdateUserTable();
