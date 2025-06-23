import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '../../../../../packages/core/src/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  accessCode: z.string().length(8, 'Access code must be 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, accessCode } = loginSchema.parse(body);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize auth service
    const authService = createAuthService();

    // User lookup function for the auth service
    const userLookupFn = async (email: string) => {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, role, access_code_hash, access_code_salt')
        .eq('email', email)
        .eq('deleted_at', null)
        .maybeSingle();

      if (!user) return null;

      return {
        id: user.id,
        accessCodeHash: user.access_code_hash,
        accessCodeSalt: user.access_code_salt,
        role: user.role as 'user' | 'admin',
      };
    };

    // Authenticate with access code
    const authResult = await authService.authenticateWithAccessCode(
      email,
      accessCode,
      userLookupFn
    );

    if (!authResult.success) {
      // Log failed login attempt
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('deleted_at', null)
        .maybeSingle();

      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'login',
          resource_type: 'user',
          resource_id: user.id,
          old_values: { success: false, reason: authResult.error },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        });
      }

      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', authResult.userId);

    // Log successful login
    await supabase.from('audit_logs').insert({
      user_id: authResult.userId,
      action: 'login',
      resource_type: 'user',
      resource_id: authResult.userId,
      new_values: { success: true },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    // Clear the access code after successful login (one-time use)
    await supabase
      .from('users')
      .update({
        access_code_hash: null,
        access_code_salt: null,
      })
      .eq('id', authResult.userId);

    // Set HTTP-only cookie with JWT token
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      userId: authResult.userId,
    });

    // Set secure cookie with JWT token
    response.cookies.set('auth-token', authResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid login data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check for the login service
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'login',
    timestamp: new Date().toISOString(),
  });
} 