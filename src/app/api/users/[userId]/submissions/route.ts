import { NextRequest, NextResponse } from "next/server";
import { db, executeRawSQL, queryRawSQL } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") || null;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check if the requester is the user or an admin
    const isOwnProfile = authResult.user.id === userId;
    const isAdmin = authResult.user.role === "admin";
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view this user's submissions" },
        { status: 403 }
      );
    }
    
    // Build the query based on the status filter
    let query = `
      SELECT 
        s.id, 
        s.assignment_id, 
        s.status, 
        s.submitted_at, 
        s.total_score,
        s.percentage_score,
        s.feedback,
        a.title as assignment_title,
        a.total_points as assignment_total_points,
        a.due_date
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.user_id = $1
    `;
    
    const queryParams = [userId];
    
    if (status) {
      query += " AND s.status = $2";
      queryParams.push(status);
    }
    
    query += " ORDER BY s.submitted_at DESC LIMIT $" + (queryParams.length + 1) + " OFFSET $" + (queryParams.length + 2);
    queryParams.push(limit.toString(), offset.toString());
    
    const submissionsResult = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM assignment_submissions
      WHERE user_id = $1
    `;
    
    const countParams = [userId];
    
    if (status) {
      countQuery += " AND status = $2";
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    return NextResponse.json({
      submissions: submissionsResult.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
    
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user submissions" },
      { status: 500 }
    );
  }
}
