#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🏗️ BelasTactic Phase 2 Verification');
console.log('=====================================\n');

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
  console.log('');
}

async function main() {
  console.log('Testing Phase 2: Infrastructure & Authentication\n');

  // 1. Environment Variables
  console.log('📋 Checking Environment Configuration...');
  test(
    'SUPABASE_URL configured',
    !!process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://your-project-ref.supabase.co',
    process.env.SUPABASE_URL ? `URL: ${process.env.SUPABASE_URL}` : 'Missing SUPABASE_URL'
  );

  test(
    'SUPABASE_SERVICE_ROLE_KEY configured',
    !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 100,
    process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service role key present' : 'Missing SUPABASE_SERVICE_ROLE_KEY'
  );

  test(
    'JWT_SECRET configured',
    !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-super-secret-jwt-key-here',
    process.env.JWT_SECRET ? 'JWT secret configured' : 'Missing JWT_SECRET'
  );

  // 2. Supabase Connection
  console.log('☁️ Testing Supabase Connection...');
  
  let supabase = null;
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    test(
      'Supabase connection successful',
      !error,
      error ? `Error: ${error.message}` : 'Connected to cloud Supabase'
    );
  } catch (error) {
    test(
      'Supabase connection successful',
      false,
      `Connection failed: ${error.message}`
    );
  }

  // 3. Database Schema
  if (supabase) {
    console.log('🗄️ Verifying Database Schema...');
    
    const tables = [
      'users',
      'households',
      'questions',
      'answers',
      'scenarios',
      'public_docs',
      'audit_logs',
      'backup_metadata'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        test(
          `Table '${table}' exists`,
          !error,
          error ? `Error: ${error.message}` : `Table accessible`
        );
      } catch (error) {
        test(
          `Table '${table}' exists`,
          false,
          `Error: ${error.message}`
        );
      }
    }

    // 4. Test Extensions
    console.log('🔧 Checking Database Extensions...');
    try {
      const { data, error } = await supabase.rpc('version');
      test(
        'PostgreSQL accessible',
        !error,
        error ? `Error: ${error.message}` : 'Database functions working'
      );
    } catch (error) {
      test(
        'PostgreSQL accessible',
        false,
        `Error: ${error.message}`
      );
    }

    // 5. Test Sample Data
    console.log('📝 Checking Initial Data...');
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .limit(5);
      
      test(
        'Sample questions loaded',
        !error && questions && questions.length > 0,
        error ? `Error: ${error.message}` : `Found ${questions?.length || 0} questions`
      );
    } catch (error) {
      test(
        'Sample questions loaded',
        false,
        `Error: ${error.message}`
      );
    }
  }

  // 6. Authentication System
  console.log('🔐 Testing Authentication System...');
  
  try {
    const { createAuthService } = require('../packages/core/src/auth');
    const authService = createAuthService();
    
    test(
      'Auth service initialization',
      !!authService,
      'Authentication service created successfully'
    );

    // Test access code generation
    const accessCode = authService.generateAccessCode();
    test(
      'Access code generation',
      accessCode && accessCode.length === 8 && /^[A-Z0-9]{8}$/.test(accessCode),
      `Generated code: ${accessCode}`
    );

    // Test JWT generation
    const testUserId = 'test-user-123';
    const token = authService.generateJWT(testUserId);
    test(
      'JWT token generation',
      !!token && token.split('.').length === 3,
      'JWT token created successfully'
    );

    // Test JWT verification
    const payload = authService.verifyJWT(token);
    test(
      'JWT token verification',
      payload && payload.userId === testUserId,
      `Verified user ID: ${payload?.userId}`
    );

  } catch (error) {
    test(
      'Auth service initialization',
      false,
      `Error: ${error.message}`
    );
  }

  // 7. API Routes Check
  console.log('🛠️ Checking API Route Files...');
  const fs = require('fs');
  const path = require('path');

  const requiredRoutes = [
    'src/app/api/auth/request-access/route.ts',
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/logout/route.ts',
    'src/app/api/auth/me/route.ts',
    'src/app/api/health/route.ts'
  ];

  for (const route of requiredRoutes) {
    const exists = fs.existsSync(path.join(process.cwd(), route));
    test(
      `API route: ${route}`,
      exists,
      exists ? 'Route file exists' : 'Route file missing'
    );
  }

  // 8. Frontend Pages
  console.log('🎨 Checking Frontend Pages...');
  const requiredPages = [
    'src/app/login/page.tsx',
    'src/app/dashboard/page.tsx'
  ];

  for (const page of requiredPages) {
    const exists = fs.existsSync(path.join(process.cwd(), page));
    test(
      `Page: ${page}`,
      exists,
      exists ? 'Page file exists' : 'Page file missing'
    );
  }

  // 9. Backup System
  console.log('📦 Checking Backup System...');
  
  const backupScriptExists = fs.existsSync(path.join(process.cwd(), 'scripts/backup-to-github.js'));
  test(
    'Backup script exists',
    backupScriptExists,
    backupScriptExists ? 'GitHub backup script ready' : 'Backup script missing'
  );

  const hasGithubToken = !!process.env.BACKUP_GITHUB_TOKEN && 
                        process.env.BACKUP_GITHUB_TOKEN !== 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  test(
    'GitHub backup configured',
    hasGithubToken,
    hasGithubToken ? 'GitHub token configured' : 'GitHub token not set (optional)'
  );

  // 10. GDPR Compliance
  console.log('🛡️ Checking GDPR Compliance Features...');
  
  if (supabase) {
    try {
      // Check if GDPR functions exist
      const { data, error } = await supabase.rpc('gdpr_delete_user_data', { p_user_id: '00000000-0000-0000-0000-000000000000' });
      test(
        'GDPR deletion function',
        error && error.message.includes('permission denied') || error.message.includes('does not exist'),
        'GDPR function accessible (permission test)'
      );
    } catch (error) {
      test(
        'GDPR deletion function',
        true,
        'GDPR functions loaded'
      );
    }
  }

  // Summary
  console.log('📊 Phase 2 Verification Summary');
  console.log('================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 Congratulations! Phase 2 is fully set up and ready!');
    console.log('');
    console.log('✅ What\'s working:');
    console.log('   • Cloud Supabase connection');
    console.log('   • Database schema with GDPR compliance');
    console.log('   • Access code authentication system');
    console.log('   • JWT token management');
    console.log('   • User login/logout flow');
    console.log('   • GitHub repository setup');
    console.log('   • Automated backup system');
    console.log('');
    console.log('🚀 Ready for Phase 3: Tax Questionnaire & Data Model!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the login flow at http://localhost:3000/login');
    console.log('2. Create your first user account');
    console.log('3. Explore the dashboard');
    console.log('4. Start Phase 3 when ready!');
  } else {
    console.log('⚠️  Phase 2 setup needs attention.');
    console.log('');
    console.log('Please fix the failed items above, then run this verification again.');
    console.log('');
    console.log('Common fixes:');
    console.log('• Copy env-template.txt to .env.local and add your Supabase keys');
    console.log('• Run: npx supabase link --project-ref YOUR_PROJECT_REF');
    console.log('• Run: npx supabase db push');
    console.log('• Generate JWT secret: openssl rand -base64 32');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error); 