#!/usr/bin/env tsx

/**
 * Database Schema Verification Script
 * 
 * This script verifies that the Prisma schema has been properly generated and
 * can be used to access the database. It checks:
 * 
 * 1. Connection to the database
 * 2. Basic queries using the schema
 * 3. Relationship queries to verify joins work correctly
 */

import { db } from './src/lib/db';

async function main() {
  console.log('\n🔍 Zenith Database Schema Verification');
  console.log('-----------------------------------');

  try {
    // Test 1: Verify database connection by counting users
    console.log('1️⃣ Testing database connection...');
    const userCount = await db.users.count();
    console.log(`✅ Connected successfully! Found ${userCount} users in the database.`);

    // Test 2: Check if we can access various models
    console.log('\n2️⃣ Testing access to different models...');
    
    const modelsToTest = [
      { name: 'users', query: () => db.users.findFirst() },
      { name: 'clubs', query: () => db.clubs.findFirst() },
      { name: 'events', query: () => db.events.findFirst() },
      { name: 'assignments', query: () => db.assignments.findFirst() }
    ];
    
    for (const model of modelsToTest) {
      try {
        const result = await model.query();
        console.log(`✅ Successfully accessed ${model.name} table: ${result ? 'Record found' : 'No records'}`);
      } catch (error: any) {
        console.error(`❌ Failed to access ${model.name} table: ${error?.message || 'Unknown error'}`);
      }
    }

    // Test 3: Check relationships
    console.log('\n3️⃣ Testing relationship queries...');
    
    // Check user-club membership relationship
    const userWithClubs = await db.users.findFirst({
      where: { email: { not: '' } },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    if (userWithClubs) {
      // Now query the club_members table to find memberships
      const clubMemberships = await db.club_members.findMany({
        where: { user_id: userWithClubs.id },
      });
      
      console.log(`✅ Found user with possible club memberships:`);
      console.log(`   - User: ${userWithClubs.name || userWithClubs.email}`);
      console.log(`   - Club memberships found: ${clubMemberships.length}`);
      
      if (clubMemberships.length > 0) {
        for (const membership of clubMemberships) {
          // Get club details
          const club = await db.clubs.findUnique({
            where: { id: membership.club_id }
          });
          console.log(`     - Club: ${club?.name || 'Unknown'}`);
        }
      }
    } else {
      console.log('⚠️ No users found for relationship test');
    }

    // Test 4: Test a more complex query with multiple relations
    console.log('\n4️⃣ Testing complex relationship query...');
    const event = await db.events.findFirst();
    
    if (event) {
      // Get related club
      const club = event.club_id ? await db.clubs.findUnique({
        where: { id: event.club_id }
      }) : null;
      
      // Get attendees
      const attendees = await db.event_attendees.findMany({
        where: { event_id: event.id }
      });
      
      console.log(`✅ Successfully queried event with nested relationships:`);
      console.log(`   - Event: ${event.title}`);
      console.log(`   - Club: ${club?.name || 'N/A'}`);
      console.log(`   - Attendees: ${attendees?.length || 0}`);
    } else {
      console.log('⚠️ No events found for complex relationship test');
    }

    console.log('\n✨ All schema verification tests completed!');

  } catch (error: any) {
    console.error(`\n❌ Database verification failed: ${error?.message || 'Unknown error'}`);
    if (error?.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
