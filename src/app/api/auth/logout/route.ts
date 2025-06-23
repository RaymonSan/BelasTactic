import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '../../../../../packages/core/src/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the token
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (authToken) {
      const authService = createAuthService();
      const payload = authService.verifyJWT(authToken);
      
      if (payload) {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Log the logout event
        await supabase.from('audit_logs').insert({
          user_id: payload.userId,
          action: 'logout',
          resource_type: 'user',
          resource_id: payload.userId,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        });
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}

// Health check for the logout service
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'logout',
    timestamp: new Date().toISOString(),
  });
} 