#!/bin/bash

echo "🚀 Setting up SQLite database for Zenith project..."

# Backup current schema
echo "💾 Backing up current Prisma schema..."
cp prisma/schema.prisma prisma/schema.prisma.backup

# Update schema to use SQLite
echo "🔄 Updating Prisma schema for SQLite..."
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model users {
  id                        String    @id @default(cuid())
  email                     String    @unique
  name                      String
  password_hash             String?
  role                      String    @default("student")
  profile_picture           String?
  phone                     String?
  student_id               String?   @unique
  department               String?
  year                     String?
  section                  String?
  is_active                Boolean   @default(true)
  email_verified           Boolean   @default(false)
  email_verification_token String?
  password_reset_token     String?
  password_reset_expires   DateTime?
  last_login               DateTime?
  created_at               DateTime  @default(now())
  updated_at               DateTime  @updatedAt
  
  // Relations
  assignments              assignments[]
  assignment_submissions   assignment_submissions[]
  announcements           announcements[]
  events                  events[]
  club_memberships        club_memberships[]
  chat_messages           chat_messages[]
  ai_assignment_generations ai_assignment_generations[]
  notifications           notifications[]
  created_clubs           clubs[] @relation("ClubCreator")
  coordinated_clubs       clubs[] @relation("ClubCoordinator")
}

model clubs {
  id                   String              @id @default(cuid())
  name                 String              @unique
  description          String?
  type                 String              @default("academic")
  color                String              @default("#3B82F6")
  is_active            Boolean             @default(true)
  max_members          Int?                @default(50)
  join_code            String?             @unique
  created_by           String
  coordinator_id       String?
  created_at           DateTime            @default(now())
  updated_at           DateTime            @updatedAt
  
  // Relations
  creator              users               @relation("ClubCreator", fields: [created_by], references: [id])
  coordinator          users?              @relation("ClubCoordinator", fields: [coordinator_id], references: [id])
  memberships          club_memberships[]
  assignments          assignments[]
  announcements        announcements[]
  events               events[]
  chat_rooms          chat_rooms[]
}

model club_memberships {
  id         String   @id @default(cuid())
  user_id    String
  club_id    String
  role       String   @default("member")
  joined_at  DateTime @default(now())
  is_active  Boolean  @default(true)
  
  // Relations
  user       users    @relation(fields: [user_id], references: [id])
  club       clubs    @relation(fields: [club_id], references: [id])
  
  @@unique([user_id, club_id])
}

model assignments {
  id                    String                      @id @default(cuid())
  title                 String
  description           String?
  due_date              DateTime?
  points                Int?                        @default(100)
  club_id               String?
  created_by            String
  is_active             Boolean                     @default(true)
  assignment_type       String                      @default("manual")
  template_id           String?
  file_url              String?
  created_at            DateTime                    @default(now())
  updated_at            DateTime                    @updatedAt
  
  // Relations
  creator               users                       @relation(fields: [created_by], references: [id])
  club                  clubs?                      @relation(fields: [club_id], references: [id])
  template              assignment_templates?       @relation(fields: [template_id], references: [id])
  submissions           assignment_submissions[]
  questions             assignment_questions[]
  ai_generations        ai_assignment_generations[]
}

model assignment_templates {
  id                    String                      @id @default(cuid())
  name                  String
  description           String?
  template_content      String
  subject_area          String?
  difficulty_level      String?                     @default("medium")
  estimated_duration    Int?
  is_active             Boolean                     @default(true)
  created_by            String?
  created_at            DateTime                    @default(now())
  updated_at            DateTime                    @updatedAt
  
  // Relations
  assignments           assignments[]
  ai_generations        ai_assignment_generations[]
}

model assignment_questions {
  id              String   @id @default(cuid())
  assignment_id   String
  question_text   String
  question_type   String   @default("text")
  points          Int?     @default(10)
  order_index     Int      @default(0)
  is_required     Boolean  @default(true)
  
  // Relations
  assignment      assignments @relation(fields: [assignment_id], references: [id])
  submissions     assignment_submission_answers[]
}

model assignment_submissions {
  id              String                          @id @default(cuid())
  assignment_id   String
  student_id      String
  status          String                          @default("draft")
  points_earned   Int?
  feedback        String?
  submitted_at    DateTime?
  graded_at       DateTime?
  created_at      DateTime                        @default(now())
  updated_at      DateTime                        @updatedAt
  
  // Relations
  assignment      assignments                     @relation(fields: [assignment_id], references: [id])
  student         users                           @relation(fields: [student_id], references: [id])
  answers         assignment_submission_answers[]
  
  @@unique([assignment_id, student_id])
}

model assignment_submission_answers {
  id            String                 @id @default(cuid())
  submission_id String
  question_id   String
  answer_text   String?
  file_url      String?
  points_earned Int?
  
  // Relations
  submission    assignment_submissions @relation(fields: [submission_id], references: [id])
  question      assignment_questions   @relation(fields: [question_id], references: [id])
  
  @@unique([submission_id, question_id])
}

model ai_assignment_generations {
  id                      String                @id @default(cuid())
  template_id             String?
  generated_assignment_id String?
  source_file_url         String
  generation_prompt       String?
  ai_model_used           String?
  generation_status       String?               @default("pending")
  questions_extracted     Int?                  @default(0)
  questions_created       Int?                  @default(0)
  processing_log          String?               @default("[]")
  error_details           String?
  generated_by            String?
  created_at              DateTime              @default(now())
  completed_at            DateTime?
  
  // Relations
  assignment              assignments?          @relation(fields: [generated_assignment_id], references: [id])
  template                assignment_templates? @relation(fields: [template_id], references: [id])
  user                    users?                @relation(fields: [generated_by], references: [id])
}

model announcements {
  id         String    @id @default(cuid())
  title      String
  content    String
  author_id  String?
  club_id    String?
  priority   String?   @default("normal")
  expires_at DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  
  // Relations
  author     users?    @relation(fields: [author_id], references: [id])
  club       clubs?    @relation(fields: [club_id], references: [id])
}

model events {
  id               String    @id @default(cuid())
  title            String
  description      String?
  start_time       DateTime
  end_time         DateTime?
  location         String?
  event_type       String    @default("general")
  club_id          String?
  organizer_id     String?
  max_participants Int?
  registration_fee Decimal?
  is_public        Boolean   @default(true)
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt
  
  // Relations
  club             clubs?    @relation(fields: [club_id], references: [id])
  organizer        users?    @relation(fields: [organizer_id], references: [id])
  registrations    event_registrations[]
}

model event_registrations {
  id            String   @id @default(cuid())
  event_id      String
  user_id       String
  status        String   @default("registered")
  registered_at DateTime @default(now())
  
  // Relations
  event         events   @relation(fields: [event_id], references: [id])
  user          users    @relation(fields: [user_id], references: [id])
  
  @@unique([event_id, user_id])
}

model chat_rooms {
  id          String         @id @default(cuid())
  name        String
  description String?
  club_id     String?
  type        String         @default("public")
  created_by  String?
  created_at  DateTime       @default(now())
  updated_at  DateTime       @updatedAt
  
  // Relations
  club        clubs?         @relation(fields: [club_id], references: [id])
  messages    chat_messages[]
  members     chat_room_members[]
}

model chat_room_members {
  id         String     @id @default(cuid())
  room_id    String
  user_id    String
  role       String     @default("member")
  joined_at  DateTime   @default(now())
  
  // Relations
  room       chat_rooms @relation(fields: [room_id], references: [id])
  user       users      @relation(fields: [user_id], references: [id])
  
  @@unique([room_id, user_id])
}

model chat_messages {
  id                    String    @id @default(cuid())
  room_id               String
  user_id               String
  message               String
  message_type          String    @default("text")
  file_url              String?
  reply_to_message_id   String?
  is_edited             Boolean   @default(false)
  is_deleted            Boolean   @default(false)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  
  // Relations
  room                  chat_rooms @relation(fields: [room_id], references: [id])
  user                  users      @relation(fields: [user_id], references: [id])
  reply_to              chat_messages? @relation("MessageReplies", fields: [reply_to_message_id], references: [id])
  replies               chat_messages[] @relation("MessageReplies")
}

model notifications {
  id         String    @id @default(cuid())
  user_id    String
  title      String
  message    String
  type       String    @default("info")
  is_read    Boolean   @default(false)
  link       String?
  created_at DateTime  @default(now())
  
  // Relations
  user       users     @relation(fields: [user_id], references: [id])
}
EOF

# Update .env for SQLite
echo "🔧 Updating .env for SQLite..."
cat > .env << 'EOF'
# SQLite Database
DATABASE_URL="file:./dev.db"

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# JWT
JWT_SECRET=your-jwt-secret-key-here

# Local development flag
NODE_ENV=development
EOF

echo "✅ SQLite setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run: npm run db:migrate:dev"
echo "   2. Run: npm run db:generate"
echo "   3. Run: npm run dev"
echo ""
echo "💡 Database file will be created at: ./dev.db"
echo "🔄 To restore PostgreSQL schema: cp prisma/schema.prisma.backup prisma/schema.prisma"
