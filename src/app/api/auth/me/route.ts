import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '../../../../../packages/core/src/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify the JWT token
    const authService = createAuthService();
    const payload = authService.verifyJWT(authToken);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        consent_given_at,
        consent_version,
        data_retention_until,
        created_at,
        updated_at,
        last_login_at
      `)
      .eq('id', payload.userId)
      .eq('deleted_at', null)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's households
    const { data: households } = await supabase
      .from('households')
      .select(`
        id,
        name,
        filing_year,
        created_at,
        updated_at
      `)
      .or(`primary_user_id.eq.${payload.userId},partner_user_id.eq.${payload.userId}`)
      .eq('deleted_at', null)
      .order('filing_year', { ascending: false });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        consentGivenAt: user.consent_given_at,
        consentVersion: user.consent_version,
        dataRetentionUntil: user.data_retention_until,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at,
      },
      households: households || [],
      tokenValid: true,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify the JWT token
    const authService = createAuthService();
    const payload = authService.verifyJWT(authToken);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consentVersion } = body;

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update user data (limited fields for security)
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    // Allow consent version updates for GDPR compliance
    if (consentVersion !== undefined) {
      updates.consent_version = consentVersion;
      updates.consent_given_at = new Date().toISOString();
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', payload.userId)
      .eq('deleted_at', null)
      .select('id, email, role, consent_version, updated_at')
      .single();

    if (error || !updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    // Log the update
    await supabase.from('audit_logs').insert({
      user_id: payload.userId,
      action: 'update',
      resource_type: 'user',
      resource_id: payload.userId,
      new_values: updates,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 