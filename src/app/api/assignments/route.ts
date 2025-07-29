import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";
import { NotificationService } from "@/lib/NotificationService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const clubId = searchParams.get("clubId");

    let query = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date as "dueDate",
        a.max_points as "maxPoints",
        a.instructions,
        a.created_at as "createdAt",
        c.name as club,
        u.name as "assignedBy",
        CASE 
          WHEN s.id IS NOT NULL THEN 'submitted'
          WHEN a.due_date < NOW() THEN 'overdue'
          ELSE 'pending'
        END as status,
        s.submitted_at as "submittedAt",
        s.grade,
        s.feedback
      FROM assignments a
      JOIN clubs c ON a.club_id = c.id
      JOIN users u ON a.created_by = u.id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.user_id = $1
      WHERE c.id = (
        SELECT u2.club_id FROM users u2 WHERE u2.id = $1
      )
    `;

    const queryParams: (string | number)[] = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      if (status === "submitted") {
        query += ` AND s.id IS NOT NULL`;
      } else if (status === "overdue") {
        query += ` AND a.due_date < NOW() AND s.id IS NULL`;
      } else if (status === "pending") {
        query += ` AND a.due_date >= NOW() AND s.id IS NULL`;
      }
    }

    if (clubId) {
      paramCount++;
      query += ` AND c.id = $${paramCount}`;
      queryParams.push(clubId);
    }

    query += ` ORDER BY a.due_date ASC LIMIT $${paramCount + 1} OFFSET $${
      paramCount + 2
    }`;
    queryParams.push(limit, offset);

    const result = await Database.query(query, queryParams);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    const body = await request.json();
    const { 
      title, 
      description, 
      clubId, 
      dueDate, 
      maxPoints, 
      instructions,
      assignmentType,
      targetAudience,
      targetClubs,
      timeLimit,
      allowNavigation,
      passingScore,
      isProctored,
      shuffleQuestions
    } = body;

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // If target audience is club, require clubId
    if (targetAudience === 'club' && !clubId) {
      return NextResponse.json(
        { error: "Club ID is required for club-specific assignments" },
        { status: 400 }
      );
    }
    
    // If target audience is specific clubs, require targetClubs
    if (targetAudience === 'specific_clubs' && (!targetClubs || !targetClubs.length)) {
      return NextResponse.json(
        { error: "Target clubs are required for specific clubs assignments" },
        { status: 400 }
      );
    }

    // Check if user is a manager (has management role)
    const userCheck = await Database.query(
      "SELECT role, club_id FROM users WHERE id = $1",
      [userId]
    );

    if (!userCheck.rows.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];
    const isManager = [
      "coordinator",
      "co_coordinator", 
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

    if (!isManager) {
      return NextResponse.json(
        { error: "Only management positions can create assignments" },
        { status: 403 }
      );
    }

    // Use the user's club_id instead of the provided clubId for security
    const actualClubId = user.club_id;

    if (!actualClubId) {
      return NextResponse.json(
        { error: "User is not associated with a club" },
        { status: 400 }
      );
    }

    const result = await Database.query(
      `INSERT INTO assignments (
        title, description, club_id, created_by, due_date, max_points, instructions,
        assignment_type, target_audience, target_clubs, time_limit,
        allow_navigation, passing_score, is_proctored, shuffle_questions
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        title,
        description,
        // Use clubId from request if targetAudience is specified, otherwise use user's club
        targetAudience ? (targetAudience === 'club' ? clubId : null) : actualClubId,
        userId,
        dueDate,
        maxPoints || 100,
        instructions || "",
        assignmentType || "regular",
        targetAudience || "club",
        targetClubs || [],
        timeLimit || null,
        allowNavigation !== undefined ? allowNavigation : true,
        passingScore || 60,
        isProctored !== undefined ? isProctored : false,
        shuffleQuestions !== undefined ? shuffleQuestions : false
      ]
    );

    // Create notifications for all club members
    const clubMembersQuery = `
      SELECT id FROM users WHERE club_id = $1 AND id != $2
    `;
    const clubMembers = await Database.query(clubMembersQuery, [
      actualClubId,
      userId,
    ]);

    if (clubMembers.rows.length > 0) {
      const clubQuery = `SELECT name FROM clubs WHERE id = $1`;
      const clubResult = await Database.query(clubQuery, [actualClubId]);
      const clubName = clubResult.rows[0]?.name || "Club";

      const memberIds = clubMembers.rows.map((member: { id: string }) => member.id);
      await NotificationService.notifyAssignmentCreated(
        result.rows[0].id,
        memberIds,
        clubName
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
