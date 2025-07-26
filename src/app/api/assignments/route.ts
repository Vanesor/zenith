import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import jwt from "jsonwebtoken";

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
    const { title, description, clubId, dueDate, maxPoints, instructions } =
      body;

    if (!title || !description || !clubId || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user is a club admin/leader
    const memberCheck = await Database.query(
      "SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2",
      [userId, clubId]
    );

    if (!memberCheck.rows.length || memberCheck.rows[0].role === "member") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const result = await Database.query(
      `INSERT INTO assignments (title, description, club_id, created_by, due_date, max_points, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        description,
        clubId,
        userId,
        dueDate,
        maxPoints || 100,
        instructions || "",
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
