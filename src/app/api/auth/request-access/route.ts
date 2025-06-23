import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '../../../../../packages/core/src/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email('Valid email address required'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = requestSchema.parse(body);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize auth service
    const authService = createAuthService();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email)
      .eq('deleted_at', null)
      .maybeSingle();

    if (existingUser) {
      // User exists, generate new access code
      const accessCode = authService.generateAccessCode();
      const { hash, salt } = authService.hashAccessCode(accessCode);

      // Update user with new access code
      const { error: updateError } = await supabase
        .from('users')
        .update({
          access_code_hash: hash,
          access_code_salt: salt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Failed to update user access code:', updateError);
        return NextResponse.json(
          { error: 'Failed to generate access code' },
          { status: 500 }
        );
      }

      // Log the audit event
      await supabase.from('audit_logs').insert({
        user_id: existingUser.id,
        action: 'create',
        resource_type: 'access_code',
        resource_id: existingUser.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      });

      // In a real app, you would send this via email
      // For development/testing, we'll return it in the response
      return NextResponse.json({
        success: true,
        message: 'New access code generated',
        userId: existingUser.id,
        // Remove this in production - send via email instead
        ...(process.env.NODE_ENV === 'development' && { accessCode }),
      });
    } else {
      // Create new user
      const accessCode = authService.generateAccessCode();
      const { hash, salt } = authService.hashAccessCode(accessCode);

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          access_code_hash: hash,
          access_code_salt: salt,
          consent_given_at: new Date().toISOString(),
          consent_version: 1,
          data_retention_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('Failed to create user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      // Log the audit event
      await supabase.from('audit_logs').insert({
        user_id: newUser.id,
        action: 'create',
        resource_type: 'user',
        resource_id: newUser.id,
        new_values: { email },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      });

      // In a real app, you would send this via email
      // For development/testing, we'll return it in the response
      return NextResponse.json({
        success: true,
        message: 'Access code sent to your email',
        userId: newUser.id,
        // Remove this in production - send via email instead  
        ...(process.env.NODE_ENV === 'development' && { accessCode }),
      });
    }
  } catch (error) {
    console.error('Request access error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check for the auth service
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'access-code-request',
    timestamp: new Date().toISOString(),
  });
} 