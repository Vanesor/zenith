import { NextRequest, NextResponse } from "next/server";
import emailServiceV2 from "@/lib/EmailServiceV2";

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'test' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    let result = false;

    switch (type) {
      case 'verification':
        result = await emailServiceV2.sendVerificationEmail(
          email, 
          'test-token-' + Date.now(), 
          'Test User'
        );
        break;
      
      case 'otp':
        result = await emailServiceV2.sendOtpEmail(
          email, 
          '123456', 
          '2fa'
        );
        break;
      
      case 'password-reset':
        result = await emailServiceV2.sendPasswordResetEmail(
          email, 
          'test-reset-token-' + Date.now()
        );
        break;
      
      default:
        // Test connection
        result = await emailServiceV2.testConnection();
        break;
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: `${type} email sent successfully`,
        service: 'EmailServiceV2'
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get email statistics
    const stats = await emailServiceV2.getEmailStats(7);
    const connectionTest = await emailServiceV2.testConnection();

    return NextResponse.json({
      service: 'EmailServiceV2',
      connection: connectionTest ? 'OK' : 'Failed',
      stats,
      resendConfigured: !!process.env.RESEND_API_KEY,
      fallbackConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
    });

  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { 
        error: "Failed to get service status",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
