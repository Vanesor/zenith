// Initialize Zenith Committee Structure
// Run this script to set up the committee structure in the database

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function initializeCommitteeStructure() {
  try {
    console.log('🚀 Initializing Zenith Committee Structure...');

    // 1. Create Main Committee
    const mainCommittee = await prisma.committee.upsert({
      where: { name: 'Zenith Main Committee' },
      update: {},
      create: {
        name: 'Zenith Main Committee',
        description: 'The main governing body of Zenith with 6 key positions',
        hierarchy_level: 1,
        is_active: true,
      },
    });

    console.log('✅ Main committee created:', mainCommittee.name);

    // 2. Create Committee Roles (6 positions)
    const committeeRoles = [
      {
        name: 'President',
        description: 'Overall leader of Zenith, responsible for strategic direction and major decisions',
        hierarchy: 1,
        permissions: [
          'manage_all_clubs',
          'manage_committee',
          'approve_events',
          'manage_users',
          'view_analytics',
          'manage_announcements',
        ],
      },
      {
        name: 'Vice President',
        description: 'Second-in-command, supports President and handles daily operations',
        hierarchy: 2,
        permissions: [
          'manage_clubs',
          'approve_events',
          'manage_users',
          'view_analytics',
          'manage_announcements',
        ],
      },
      {
        name: 'Innovation Head',
        description: 'Leads innovation initiatives, new projects, and technological advancement',
        hierarchy: 3,
        permissions: [
          'manage_assignments',
          'approve_projects',
          'manage_events',
          'view_analytics',
        ],
      },
      {
        name: 'Secretary',
        description: 'Handles documentation, meeting minutes, and administrative tasks',
        hierarchy: 4,
        permissions: [
          'manage_announcements',
          'manage_events',
          'view_analytics',
          'manage_documentation',
        ],
      },
      {
        name: 'Outreach Coordinator',
        description: 'Manages external partnerships, collaborations, and outreach programs',
        hierarchy: 5,
        permissions: [
          'manage_events',
          'manage_announcements',
          'manage_partnerships',
          'view_analytics',
        ],
      },
      {
        name: 'Media Coordinator',
        description: 'Handles social media, marketing, design, and promotional activities',
        hierarchy: 6,
        permissions: [
          'manage_media',
          'manage_announcements',
          'manage_events',
          'upload_files',
        ],
      },
      {
        name: 'Treasurer',
        description: 'Manages financial aspects, budgets, and resource allocation',
        hierarchy: 7,
        permissions: [
          'manage_finances',
          'view_analytics',
          'approve_expenses',
        ],
      },
    ];

    console.log('📝 Creating committee roles...');

    for (const roleData of committeeRoles) {
      const role = await prisma.committeeRole.upsert({
        where: {
          committee_id_name: {
            name: roleData.name,
            committee_id: mainCommittee.id,
          },
        },
        update: {
          description: roleData.description,
          permissions: roleData.permissions,
          hierarchy: roleData.hierarchy,
        },
        create: {
          name: roleData.name,
          description: roleData.description,
          committee_id: mainCommittee.id,
          permissions: roleData.permissions,
          hierarchy: roleData.hierarchy,
        },
      });

      console.log(`✅ Created role: ${role.name}`);
    }

    // 3. Create/Update Club Structures (4 clubs as mentioned)
    const clubs = [
      {
        id: 'tech-club',
        name: 'Tech Club',
        type: 'Technical',
        description: 'Focus on technology, programming, and innovation projects',
        icon: 'tech',
        color: '#3B82F6',
      },
      {
        id: 'creative-club',
        name: 'Creative Club', 
        type: 'Creative',
        description: 'Arts, design, media, and creative expression',
        icon: 'palette',
        color: '#EC4899',
      },
      {
        id: 'sports-club',
        name: 'Sports Club',
        type: 'Sports',
        description: 'Physical fitness, sports activities, and wellness',
        icon: 'trophy',
        color: '#10B981',
      },
      {
        id: 'cultural-club',
        name: 'Cultural Club',
        type: 'Cultural',
        description: 'Cultural events, traditions, and community building',
        icon: 'music',
        color: '#F59E0B',
      },
    ];

    console.log('🏢 Creating/updating clubs...');

    for (const clubData of clubs) {
      const club = await prisma.club.upsert({
        where: { id: clubData.id },
        update: {
          name: clubData.name,
          type: clubData.type,
          description: clubData.description,
          icon: clubData.icon,
          color: clubData.color,
          updated_at: new Date(),
        },
        create: {
          id: clubData.id,
          name: clubData.name,
          type: clubData.type,
          description: clubData.description,
          icon: clubData.icon,
          color: clubData.color,
          long_description: `The ${clubData.name} is dedicated to ${clubData.description.toLowerCase()}. Join us to explore your interests and develop your skills in this area.`,
        },
      });

      console.log(`✅ Created/updated club: ${club.name}`);
    }

    console.log('🎉 Committee structure initialization completed successfully!');
    console.log(`
📊 Summary:
- ✅ Main Committee created with 7 roles
- ✅ 4 clubs created/updated
- ✅ Permission system established
- ✅ Hierarchy structure in place

📋 Committee Roles Created:
1. President (Hierarchy: 1)
2. Vice President (Hierarchy: 2) 
3. Innovation Head (Hierarchy: 3)
4. Secretary (Hierarchy: 4)
5. Outreach Coordinator (Hierarchy: 5)
6. Media Coordinator (Hierarchy: 6)  
7. Treasurer (Hierarchy: 7)

🏢 Clubs Created:
1. Tech Club
2. Creative Club
3. Sports Club  
4. Cultural Club

Next steps:
- Assign users to committee roles
- Set up club coordinators
- Configure permissions
    `);

  } catch (error) {
    console.error('❌ Error initializing committee structure:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
if (require.main === module) {
  initializeCommitteeStructure()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default initializeCommitteeStructure;
