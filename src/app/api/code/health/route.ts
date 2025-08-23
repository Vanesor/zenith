import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check for code execution service
 * GET /api/code/health
 */
export async function GET(req: NextRequest) {
  try {
    const executionServiceUrl = process.env.CODE_EXECUTION_SERVICE_URL || 'http://localhost:4000';
    
    // Check if the code execution service is running
    const response = await fetch(`${executionServiceUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Code execution service is not responding properly',
          serviceStatus: 'unavailable'
        }, 
        { status: 503 }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(
      { 
        status: 'ok', 
        message: 'Code execution service is running',
        serviceStatus: 'available',
        serviceDetails: data
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to connect to code execution service',
        serviceStatus: 'unavailable'
      }, 
      { status: 503 }
    );
  }
}
