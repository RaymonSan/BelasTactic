#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 BelasTactic Phase 1 Verification\n');

const checks = [
  {
    name: 'Next.js 14 project structure',
    verify: () => fs.existsSync('next.config.ts') && fs.existsSync('src/app'),
  },
  {
    name: 'TypeScript configuration',
    verify: () => fs.existsSync('tsconfig.json'),
  },
  {
    name: 'Tailwind CSS setup',
    verify: () => {
      // Check for Tailwind v4 installation via package.json
      if (!fs.existsSync('package.json')) return false;
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.dependencies?.['tailwindcss'] || pkg.devDependencies?.['tailwindcss'];
    },
  },
  {
    name: 'Environment configuration',
    verify: () => fs.existsSync('.env.example') && fs.existsSync('.env.local'),
  },
  {
    name: 'AI packages structure',
    verify: () => fs.existsSync('packages/ai/src/index.ts'),
  },
  {
    name: 'Health check API',
    verify: () => fs.existsSync('src/app/api/health/route.ts'),
  },
  {
    name: 'Test page',
    verify: () => fs.existsSync('src/app/test/page.tsx'),
  },
  {
    name: 'Updated README',
    verify: () => {
      if (!fs.existsSync('README.md')) return false;
      const content = fs.readFileSync('README.md', 'utf8');
      return content.includes('BelasTactic') && content.includes('Phase 1');
    },
  },
  {
    name: 'Package dependencies',
    verify: () => {
      if (!fs.existsSync('package.json')) return false;
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredDeps = ['@trpc/server', 'zod', 'react-hook-form', '@supabase/supabase-js'];
      return requiredDeps.every(dep => pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]);
    },
  },
];

function runChecks() {
  console.log('Running verification checks...\n');
  
  let passed = 0;
  let total = checks.length;
  
  checks.forEach((check, index) => {
    const success = check.verify();
    const status = success ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    if (success) passed++;
  });
  
  console.log(`\nResults: ${passed}/${total} checks passed\n`);
  
  if (passed === total) {
    console.log('🎉 Phase 1 setup is COMPLETE!');
    console.log('\nNext steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Visit http://localhost:3000 to see the project');
    console.log('3. Test the setup at http://localhost:3000/test');
    console.log('4. Check health at http://localhost:3000/api/health');
    console.log('\n✨ Ready to begin Phase 2: Infrastructure & Authentication!');
  } else {
    console.log('❌ Some checks failed. Please review the setup.');
    process.exit(1);
  }
}

// Also check Ollama if possible
function checkOllama() {
  return new Promise((resolve) => {
    exec('ollama list', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️  Ollama not available or not running');
        console.log('   Run: brew install ollama && brew services start ollama');
        console.log('   Then: ollama pull llama3.1:8b\n');
      } else if (stdout.includes('llama3.1:8b')) {
        console.log('✅ Ollama with Llama 3.1 8B model ready\n');
      } else {
        console.log('⚠️  Ollama running but missing Llama 3.1 8B model');
        console.log('   Run: ollama pull llama3.1:8b\n');
      }
      resolve();
    });
  });
}

async function main() {
  await checkOllama();
  runChecks();
}

main(); 