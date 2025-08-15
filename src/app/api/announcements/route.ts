import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database-consolidated";
import { verifyAuth } from "@/lib/AuthMiddleware";
import { NotificationService } from "@/lib/NotificationService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const clubId = searchParams.get("clubId");

    let announcements;
    if (clubId) {
      announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            { club_id: clubId },
            { club_id: null }
          ]
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit ? parseInt(limit) : undefined,
        select: {
          id: true,
          title: true,
          content: true,
          priority: true,
        }
      });
    } else {
      announcements = await prisma.announcement.findMany({
        orderBy: {
          created_at: 'desc'
        },
        take: limit ? parseInt(limit) : undefined,
        select: {
          id: true,
          title: true,
          content: true,
          priority: true,
        }
      });
    }

    // Get author and club details for each announcement
    const announcementsWithDetails = await Promise.all(
      announcements.map(async (announcement: any) => {
        const [author, club] = await Promise.all([
          announcement.author_id
            ? prisma.user.findUnique({
                where: { id: announcement.author_id },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  role: true
                }
              })
            : null,
          announcement.club_id
            ? prisma.club.findUnique({
                where: { id: announcement.club_id },
                select: {
                  id: true,
                  name: true,
                  color: true,
                  icon: true
                }
              })
            : null,
        ]);

        return {
          ...announcement,
          author,
          club,
        };
      })
    );

    return NextResponse.json(announcementsWithDetails);
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = authResult.user;

    // Check if user has permission to create announcements
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, club_id: true }
    });

    if (!user || (user.role !== 'coordinator' && user.role !== 'co_coordinator')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { title, content, clubId, priority, expiresAt } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || 'normal',
      }
    });

    // Get author and club details
    const [author, club] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true
        }
      }),
      announcement.club_id
        ? prisma.club.findUnique({
            where: { id: announcement.club_id },
            select: {
              id: true,
              name: true,
              color: true,
              icon: true
            }
          })
        : null,
    ]);

    // Send notifications (optional - can be implemented later)
    console.log(`Announcement created: ${announcement.id} by user ${userId}`);

    return NextResponse.json({
      ...announcement,
      author,
      club
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
