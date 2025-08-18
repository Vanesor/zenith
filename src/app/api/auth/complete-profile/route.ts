import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from '@/lib/database-service';
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to complete your profile" },
        { status: 401 }
      );
    }

    const { firstName, lastName, phone, dateOfBirth, interests } = await request.json();

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Name fields are required" },
        { status: 400 }
      );
    }

        // Check if user exists and update profile
    try {
      const user = await db.users.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, name: true }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Update user profile using Prisma
      await db.users.update({
        where: { id: user.id },
        data: {
          name: `${firstName} ${lastName}`,
          phone: phone || null,
          // Note: date_of_birth and preferences columns may need to be added to schema
          // For now, only updating available fields
        }
      });

      return NextResponse.json({
        success: true,
        message: "Profile completed successfully"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error completing profile:", error);
    return NextResponse.json(
      { error: "An error occurred while updating your profile" },
      { status: 500 }
    );
  }
}
