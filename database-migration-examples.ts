#!/usr/bin/env tsx

/**
 * This script shows examples of how to migrate from old database code
 * to the new Prisma client pattern.
 */

import { db } from './src/lib/db';

console.log('\n📘 Database Migration Examples');
console.log('---------------------------');
console.log('This script provides examples of how to migrate old database code to the new pattern.');

// Example 1: Basic query
console.log('\n1️⃣ Basic Query');
console.log('Old pattern:');
console.log('```typescript');
console.log(`import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getUsers() {
  const users = await prisma.users.findMany();
  return users;
}`);
console.log('```');

console.log('\nNew pattern:');
console.log('```typescript');
console.log(`import { db } from '@/lib/db';

async function getUsers() {
  const users = await db.users.findMany();
  return users;
}`);
console.log('```');

// Example 2: Transaction
console.log('\n2️⃣ Transactions');
console.log('Old pattern:');
console.log('```typescript');
console.log(`import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createUserWithProfile(userData, profileData) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: userData
    });
    
    const profile = await tx.profiles.create({
      data: {
        ...profileData,
        user_id: user.id
      }
    });
    
    return { user, profile };
  });
}`);
console.log('```');

console.log('\nNew pattern:');
console.log('```typescript');
console.log(`import { db } from '@/lib/db';

async function createUserWithProfile(userData, profileData) {
  return await db.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: userData
    });
    
    const profile = await tx.profiles.create({
      data: {
        ...profileData,
        user_id: user.id
      }
    });
    
    return { user, profile };
  });
}`);
console.log('```');

// Example 3: Field naming
console.log('\n3️⃣ Working with Snake_Case Field Names');
console.log('Example:');
console.log('```typescript');
console.log(`import { db } from '@/lib/db';

async function createNewUser(name: string, email: string) {
  return await db.users.create({
    data: {
      name,
      email,
      password_hash: 'hashed_password',  // snake_case field name
      created_at: new Date(),            // snake_case field name
      email_verified: false              // snake_case field name
    }
  });
}`);
console.log('```');

// Example 4: Complex Query
console.log('\n4️⃣ Complex Query with Relations');
console.log('Example:');
console.log('```typescript');
console.log(`import { db } from '@/lib/db';

async function getEventWithDetails(eventId: string) {
  const event = await db.events.findUnique({
    where: {
      id: eventId
    }
  });

  if (!event) {
    return null;
  }

  // Get related club
  const club = event.club_id ? await db.clubs.findUnique({
    where: { id: event.club_id }
  }) : null;
  
  // Get attendees
  const attendees = await db.event_attendees.findMany({
    where: { event_id: event.id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  
  return {
    ...event,
    club,
    attendees
  };
}`);
console.log('```');

console.log('\n✨ End of migration examples');
