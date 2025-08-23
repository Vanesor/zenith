import { NextRequest, NextResponse } from "next/server";
import QRCode from 'qrcode';
import { authenticator } from 'otplib';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing QR code generation...');
    
    // Test basic QR code generation
    const testData = 'otpauth://totp/test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Zenith%20Platform';
    const qrCodeDataUrl = await QRCode.toDataURL(testData);
    
    console.log('✅ Test QR code generated:', qrCodeDataUrl.substring(0, 50) + '...');
    
    // Test authenticator keyuri
    const secret = 'JBSWY3DPEHPK3PXP';
    const email = 'test@example.com';
    const issuer = 'Zenith Platform';
    const otpauth = authenticator.keyuri(email, issuer, secret);
    
    console.log('✅ OTP auth URI:', otpauth);
    
    const qrCode2 = await QRCode.toDataURL(otpauth);
    console.log('✅ Authenticator QR code generated:', qrCode2.substring(0, 50) + '...');
    
    return NextResponse.json({
      success: true,
      testQrCode: qrCodeDataUrl,
      authQrCode: qrCode2,
      otpauth: otpauth
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'QR generation failed' },
      { status: 500 }
    );
  }
}
