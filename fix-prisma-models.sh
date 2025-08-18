#!/bin/bash

# Script to fix Prisma model names in the codebase
# This will update all files to use the correct plural forms of Prisma models

echo "Fixing Prisma model names from singular to plural..."

# Fix common model names
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.user\./prisma\.users\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.session\./prisma\.sessions\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.club\./prisma\.clubs\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.event\./prisma\.events\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.assignment\./prisma\.assignments\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.post\./prisma\.posts\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.comment\./prisma\.comments\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.notification\./prisma\.notifications\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.committee\./prisma\.committees\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.trustedDevice\./prisma\.trusted_devices\./g'

# Fix less common model names
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.chatRoom\./prisma\.chat_rooms\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.chatMessage\./prisma\.chat_messages\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.assignmentQuestion\./prisma\.assignment_questions\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.assignmentSubmission\./prisma\.assignment_submissions\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.eventAttendee\./prisma\.event_attendees\./g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/prisma\.clubMember\./prisma\.club_members\./g'

echo "Prisma model names fixed successfully."
