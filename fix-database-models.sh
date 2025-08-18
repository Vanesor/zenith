#!/bin/bash

# Fix model type references in database.ts (export statements at the bottom)
sed -i 's/  users as User,/  User,/g' src/lib/database.ts
sed -i 's/  clubs as Club,/  Club,/g' src/lib/database.ts
sed -i 's/  assignments as Assignment,/  Assignment,/g' src/lib/database.ts
sed -i 's/  posts as Post,/  Post,/g' src/lib/database.ts
sed -i 's/  sessions as Session,/  Session,/g' src/lib/database.ts
sed -i 's/  committees as Committee,/  Committee,/g' src/lib/database.ts

# Fix Prisma model references
sed -i 's/Prisma\.usersCreateInput/Prisma\.UserCreateInput/g' src/lib/database.ts
sed -i 's/Prisma\.usersUpdateInput/Prisma\.UserUpdateInput/g' src/lib/database.ts
sed -i 's/Prisma\.sessionsCreateInput/Prisma\.SessionCreateInput/g' src/lib/database.ts
sed -i 's/Prisma\.assignmentsCreateInput/Prisma\.AssignmentCreateInput/g' src/lib/database.ts
sed -i 's/Prisma\.postsCreateInput/Prisma\.PostCreateInput/g' src/lib/database.ts

# Fix client access references in database.ts
sed -i 's/this\.client\.users/this.client.user/g' src/lib/database.ts
sed -i 's/this\.client\.sessions/this.client.session/g' src/lib/database.ts
sed -i 's/this\.client\.clubs/this.client.club/g' src/lib/database.ts
sed -i 's/this\.client\.assignments/this.client.assignment/g' src/lib/database.ts
sed -i 's/this\.client\.posts/this.client.post/g' src/lib/database.ts
sed -i 's/this\.client\.committees/this.client.committee/g' src/lib/database.ts

# Fix direct access to prisma client
sed -i 's/await prisma\.users/await prisma.user/g' src/lib/database.ts
sed -i 's/prisma\.users\./prisma.user./g' src/lib/database.ts
sed -i 's/prisma\.sessions\./prisma.session./g' src/lib/database.ts
sed -i 's/prisma\.assignments\./prisma.assignment./g' src/lib/database.ts
sed -i 's/prisma\.posts\./prisma.post./g' src/lib/database.ts
sed -i 's/prisma\.clubs\./prisma.club./g' src/lib/database.ts
sed -i 's/prisma\.committees\./prisma.committee./g' src/lib/database.ts

# Fix other files directly accessing prisma
sed -i 's/prisma\.users\./prisma.user./g' src/lib/TwoFactorAuthService.ts
sed -i 's/prisma\.sessions\./prisma.session./g' src/lib/SessionManager.ts
sed -i 's/prisma\.users\./prisma.user./g' src/lib/NotificationService.ts
sed -i 's/prisma\.clubs\./prisma.club./g' src/lib/NotificationService.ts
sed -i 's/prisma\.assignments\./prisma.assignment./g' src/lib/NotificationService.ts
sed -i 's/prisma\.events\./prisma.event./g' src/lib/NotificationService.ts

# Fix test-prisma-direct.ts
sed -i 's/prisma\.users\./prisma.user./g' src/lib/test-prisma-direct.ts
sed -i 's/prisma\.clubs\./prisma.club./g' src/lib/test-prisma-direct.ts
sed -i 's/prisma\.sessions\./prisma.session./g' src/lib/test-prisma-direct.ts
sed -i 's/prisma\.assignments\./prisma.assignment./g' src/lib/test-prisma-direct.ts

echo "Fixed Prisma model references"
