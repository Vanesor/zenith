import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database-consolidated";
import { Database } from "@/lib/database-consolidated";

interface Props {
  params: Promise<{ id: string }>;
}

// POST /api/events/[id]/register
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const { user_id, registration_data } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        event_id: id,
        user_id: user_id
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "User already registered for this event" },
        { status: 409 }
      );
    }

    // Register user
    const registration = await prisma.eventRegistration.create({
      data: {
        event_id: id,
        user_id: user_id,
      }
    });

    // Get user info for response
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { name: true, avatar: true, role: true }
    });

    return NextResponse.json(
      {
        registration,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/register
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const deletedRegistration = await prisma.eventRegistration.deleteMany({
      where: {
        event_id: id,
        user_id: userId
      }
    });

    if (deletedRegistration.count === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/register - Get registrations for event
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const registrations = await prisma.eventRegistration.findMany({
      where: { event_id: id },
      orderBy: { id: 'desc' },
      take: limit,
      skip: offset
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
