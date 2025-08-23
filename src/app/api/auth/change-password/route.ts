import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { error: "This endpoint is under development" },
      { status: 501 }
    );
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
