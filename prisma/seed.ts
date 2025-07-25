import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create clubs
  const clubs = await Promise.all([
    prisma.club.upsert({
      where: { type: "ASCEND" },
      update: {},
      create: {
        name: "Ascend",
        type: "ASCEND",
        description: "Programming challenges, hackathons, and tech innovation",
        color: "#3B82F6",
        icon: "💻",
        guidelines: "Focus on coding excellence and technological advancement.",
      },
    }),
    prisma.club.upsert({
      where: { type: "ASTER" },
      update: {},
      create: {
        name: "Aster",
        type: "ASTER",
        description:
          "Communication workshops, leadership training, and interpersonal skills",
        color: "#10B981",
        icon: "🗣️",
        guidelines: "Develop communication and leadership skills.",
      },
    }),
    prisma.club.upsert({
      where: { type: "ACHIEVERS" },
      update: {},
      create: {
        name: "Achievers",
        type: "ACHIEVERS",
        description:
          "Graduate school preparation and competitive exam guidance",
        color: "#8B5CF6",
        icon: "🎓",
        guidelines:
          "Focus on academic excellence and higher studies preparation.",
      },
    }),
    prisma.club.upsert({
      where: { type: "ALTOGETHER" },
      update: {},
      create: {
        name: "Altogether",
        type: "ALTOGETHER",
        description:
          "Life skills, wellness, and holistic personality development",
        color: "#F59E0B",
        icon: "🌟",
        guidelines: "Focus on overall personality development and wellness.",
      },
    }),
  ]);

  console.log("✅ Clubs created");

  // Create users
  const hashedPassword = await hashPassword("demo123");

  const users = await Promise.all([
    // Demo user
    prisma.user.upsert({
      where: { email: "demo@zenith.edu" },
      update: {},
      create: {
        email: "demo@zenith.edu",
        username: "demo_user",
        firstName: "Demo",
        lastName: "User",
        password: hashedPassword,
        role: "MEMBER",
      },
    }),
    // President
    prisma.user.upsert({
      where: { email: "president@zenith.edu" },
      update: {},
      create: {
        email: "president@zenith.edu",
        username: "zenith_president",
        firstName: "Alex",
        lastName: "Johnson",
        password: hashedPassword,
        role: "PRESIDENT",
      },
    }),
    // Ascend Coordinator
    prisma.user.upsert({
      where: { email: "ascend.coordinator@zenith.edu" },
      update: {},
      create: {
        email: "ascend.coordinator@zenith.edu",
        username: "ascend_lead",
        firstName: "Sarah",
        lastName: "Chen",
        password: hashedPassword,
        role: "COORDINATOR",
      },
    }),
    // Aster Coordinator
    prisma.user.upsert({
      where: { email: "aster.coordinator@zenith.edu" },
      update: {},
      create: {
        email: "aster.coordinator@zenith.edu",
        username: "aster_lead",
        firstName: "Michael",
        lastName: "Brown",
        password: hashedPassword,
        role: "COORDINATOR",
      },
    }),
  ]);

  console.log("✅ Users created");

  // Create club memberships
  await Promise.all([
    // Demo user joins all clubs
    prisma.clubMember.upsert({
      where: { userId_clubId: { userId: users[0].id, clubId: clubs[0].id } },
      update: {},
      create: { userId: users[0].id, clubId: clubs[0].id, role: "MEMBER" },
    }),
    // Ascend coordinator membership
    prisma.clubMember.upsert({
      where: { userId_clubId: { userId: users[2].id, clubId: clubs[0].id } },
      update: {},
      create: { userId: users[2].id, clubId: clubs[0].id, role: "COORDINATOR" },
    }),
    // Aster coordinator membership
    prisma.clubMember.upsert({
      where: { userId_clubId: { userId: users[3].id, clubId: clubs[1].id } },
      update: {},
      create: { userId: users[3].id, clubId: clubs[1].id, role: "COORDINATOR" },
    }),
  ]);

  console.log("✅ Club memberships created");

  // Create sample announcements
  await Promise.all([
    prisma.announcement.create({
      data: {
        title: "Welcome to Zenith Forum!",
        content:
          "We are excited to launch our new forum platform. Explore the clubs and start connecting!",
        authorId: users[1].id,
        isGlobal: true,
        isPinned: true,
      },
    }),
    prisma.announcement.create({
      data: {
        title: "Upcoming Hackathon",
        content:
          "Join us for a 48-hour coding challenge next month. Registration opens soon!",
        authorId: users[2].id,
        clubId: clubs[0].id,
      },
    }),
  ]);

  console.log("✅ Announcements created");

  // Create sample events
  await Promise.all([
    prisma.event.create({
      data: {
        title: "Tech Talk: AI in Education",
        description:
          "Learn about the latest AI applications in educational technology.",
        location: "Auditorium A",
        startDate: new Date("2025-01-30T14:00:00Z"),
        endDate: new Date("2025-01-30T16:00:00Z"),
        authorId: users[2].id,
        clubId: clubs[0].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Leadership Workshop",
        description:
          "Develop your leadership skills with practical exercises and discussions.",
        location: "Conference Room B",
        startDate: new Date("2025-02-02T10:00:00Z"),
        endDate: new Date("2025-02-02T12:00:00Z"),
        authorId: users[3].id,
        clubId: clubs[1].id,
      },
    }),
  ]);

  console.log("✅ Events created");

  // Create sample FAQs for the chatbot
  await Promise.all([
    prisma.fAQ.create({
      data: {
        question: "How do I join a club?",
        answer:
          'You can join clubs through your dashboard after logging in. Click on any club card and select "Join Club".',
        category: "General",
      },
    }),
    prisma.fAQ.create({
      data: {
        question: "What is Ascend club about?",
        answer:
          "Ascend is our coding club focused on programming challenges, hackathons, and tech innovation.",
        category: "Clubs",
      },
    }),
    prisma.fAQ.create({
      data: {
        question: "How do I become a club coordinator?",
        answer:
          "Club coordinators are elected by club members. Contact the current coordinator for information about upcoming elections.",
        category: "Roles",
      },
    }),
  ]);

  console.log("✅ FAQs created");

  console.log("🎉 Database seeding completed!");
  console.log("\n📝 Demo credentials:");
  console.log("Email: demo@zenith.edu");
  console.log("Password: demo123");
  console.log("\n🔑 Admin credentials:");
  console.log("Email: president@zenith.edu");
  console.log("Password: demo123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
