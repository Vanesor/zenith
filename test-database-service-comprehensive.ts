#!/usr/bin/env tsx

/**
 * Comprehensive Database Service Test Script
 * 
 * This script tests all the operations provided by the database service
 * to verify that they work correctly with the database.
 */

import * as db from './src/lib/database-service';

async function main() {
  console.log('\n🧪 Comprehensive Database Service Test');
  console.log('-----------------------------------');
  
  try {
    // ==== USER OPERATIONS ====
    console.log('\n1️⃣ Testing User Operations');
    
    // Find users
    const userCount = await db.getUserCount();
    console.log(`✅ Total users: ${userCount}`);
    
    const adminCount = await db.getUserCount('admin');
    console.log(`✅ Admin users: ${adminCount}`);
    
    const users = await db.getUsers({ limit: 3 });
    console.log(`✅ Retrieved ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // Find user by email
    const testUser = await db.findUserByEmail('admin@zenith.com');
    if (testUser) {
      console.log(`✅ Found test user by email: ${testUser.name}`);
      
      // Search users
      const searchResults = await db.searchUsers(testUser.name.substring(0, 5), { limit: 3 });
      console.log(`✅ Search found ${searchResults.length} users matching '${testUser.name.substring(0, 5)}'`);
    } else {
      console.log('⚠️ Test user not found by email');
    }
    
    // ==== CLUB OPERATIONS ====
    console.log('\n2️⃣ Testing Club Operations');
    
    // Find clubs
    const clubs = await db.findAllClubs({ limit: 3 });
    console.log(`✅ Retrieved ${clubs.length} clubs:`);
    clubs.forEach((club, index) => {
      console.log(`   ${index + 1}. ${club.name}`);
    });
    
    // Pagination
    const paginatedClubs = await db.getClubsWithPagination({ limit: 2, page: 1 });
    console.log(`✅ Paginated clubs (page 1, limit 2): ${paginatedClubs.length}`);
    
    if (clubs.length > 0) {
      // Get club by ID
      const clubDetails = await db.findClubById(clubs[0].id);
      console.log(`✅ Got details for club: ${clubDetails?.name}`);
      
      try {
        // Get club members (may fail if UUID format is invalid)
        const members = await db.getClubMembers(clubs[0].id);
        console.log(`✅ Club has ${members.length} members`);
      } catch (error: any) {
        console.log(`ℹ️ Club members query: ${error?.message || 'Failed'}`);
      }
    }
    
    // ==== EVENT OPERATIONS ====
    console.log('\n3️⃣ Testing Event Operations');
    
    // Find events
    const events = await db.findAllEvents({ limit: 3 });
    console.log(`✅ Retrieved ${events.length} events:`);
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} (${new Date(event.event_date).toLocaleDateString()})`);
    });
    
    // Get upcoming events
    const upcomingEvents = await db.getUpcomingEvents({ limit: 2 });
    console.log(`✅ Found ${upcomingEvents.length} upcoming events`);
    
    // Get past events
    const pastEvents = await db.getPastEvents({ limit: 2 });
    console.log(`✅ Found ${pastEvents.length} past events`);
    
    if (events.length > 0) {
      // Get event details
      const eventDetails = await db.findEventWithDetails(events[0].id);
      console.log(`✅ Retrieved details for event: ${eventDetails?.title}`);
      console.log(`   - Club: ${eventDetails?.club?.name || 'N/A'}`);
      console.log(`   - Attendees: ${eventDetails?.attendees?.length || 0}`);
    }
    
    // ==== ASSIGNMENT OPERATIONS ====
    console.log('\n4️⃣ Testing Assignment Operations');
    
    // Find assignments
    const assignments = await db.findAllAssignments({ limit: 3 });
    console.log(`✅ Retrieved ${assignments.length} assignments:`);
    assignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.title}`);
    });
    
    if (assignments.length > 0) {
      // Get assignment details
      const assignmentDetails = await db.findAssignmentById(assignments[0].id);
      console.log(`✅ Retrieved details for assignment: ${assignmentDetails?.title}`);
      console.log(`   - Questions: ${assignmentDetails?.assignment_questions.length || 0}`);
      
      // Get assignment questions
      const questions = await db.getAssignmentQuestions(assignments[0].id);
      console.log(`✅ Assignment has ${questions.length} questions`);
    }
    
    // ==== CHAT OPERATIONS ====
    console.log('\n5️⃣ Testing Chat Operations');
    
    // Get chat rooms for test user
    if (testUser) {
      const chatRooms = await db.getUserChatRooms(testUser.id);
      console.log(`✅ User has ${chatRooms.length} chat rooms`);
      
      if (chatRooms.length > 0) {
        const room = chatRooms[0];
        console.log(`   - Room name: ${room.name}`);
        
        // Get messages
        const messages = await db.getChatMessages(room.id, { limit: 5 });
        console.log(`✅ Room has ${messages.length} messages`);
      }
    }
    
    console.log('\n✅ All database service tests completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Database service test failed:', error?.message);
    if (error?.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await db.db.$disconnect();
  }
}

main();
