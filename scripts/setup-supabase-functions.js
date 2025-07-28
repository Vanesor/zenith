/**
 * Setup required SQL functions in Supabase
 * This script creates the necessary SQL functions for the schema migration
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DB_HOST = process.env.SUPABASE_DB_HOST;
const DB_PORT = process.env.SUPABASE_DB_PORT || 5432;
const DB_NAME = process.env.SUPABASE_DB_NAME || 'postgres';
const DB_USER = process.env.SUPABASE_DB_USER || 'postgres';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local file');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY defined');
  process.exit(1);
}

// Required SQL functions
const requiredFunctions = [
  {
    name: 'exec_sql',
    sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },
  {
    name: 'exec_sql_with_results',
    sql: `
      CREATE OR REPLACE FUNCTION exec_sql_with_results(sql_query TEXT)
      RETURNS TABLE(result JSONB) AS $$
      BEGIN
        RETURN QUERY EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  }
];

/**
 * Make a HTTP request to the Supabase API
 */
async function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const httpModule = url.startsWith('https') ? https : http;
    
    const req = httpModule.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (error) {
            resolve(data); // Return raw data if not JSON
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Check if a function exists in the database
 */
async function checkFunctionExists(functionName) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql_with_results`;
    const body = JSON.stringify({
      sql_query: `
        SELECT COUNT(*) > 0 as exists
        FROM pg_proc
        WHERE proname = '${functionName}'
      `
    });
    
    const options = {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      body
    };
    
    const data = await makeRequest(url, options);
    return data && data.length > 0 && data[0].exists;
  } catch (error) {
    // Try direct REST API access to pg_proc
    try {
      const url = `${SUPABASE_URL}/rest/v1/pg_proc?select=proname&proname=eq.${functionName}`;
      
      const options = {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      };
      
      const data = await makeRequest(url, options);
      return data && data.length > 0;
    } catch (restError) {
      console.error(`Error checking function ${functionName}:`, restError.message);
      return false;
    }
  }
}

/**
 * Create a SQL function in the database
 */
async function createFunction(functionDef) {
  try {
    // First try direct SQL execution
    try {
      const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
      const body = JSON.stringify({
        sql_query: functionDef.sql
      });
      
      const options = {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        body
      };
      
      await makeRequest(url, options);
      console.log(`✅ Created function ${functionDef.name} successfully`);
      return true;
    } catch (error) {
      console.error(`Error creating function ${functionDef.name}:`, error.message);
      return false;
    }
  } catch (error) {
    console.error(`Error creating function ${functionDef.name}:`, error.message);
    return false;
  }
}

/**
 * Setup all required SQL functions
 */
async function setupFunctions() {
  console.log('Setting up required SQL functions for Supabase...');
  console.log('=================================================');
  
  for (const functionDef of requiredFunctions) {
    console.log(`\nChecking function: ${functionDef.name}`);
    
    try {
      const exists = await checkFunctionExists(functionDef.name);
      
      if (exists) {
        console.log(`✅ Function ${functionDef.name} already exists`);
      } else {
        console.log(`Creating function ${functionDef.name}...`);
        const success = await createFunction(functionDef);
        
        if (!success) {
          console.log('\n❌ Failed to create function automatically');
          console.log('Please run the following SQL in the Supabase SQL Editor:');
          console.log(functionDef.sql);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing function ${functionDef.name}:`, error.message);
      console.log('\nPlease run the following SQL in the Supabase SQL Editor:');
      console.log(functionDef.sql);
    }
  }
  
  console.log('\n=================================================');
  console.log('SQL function setup completed');
  console.log('Now you can run the main schema migration script:');
  console.log('npm run db:setup:supabase');
}

// Run the setup
setupFunctions();
