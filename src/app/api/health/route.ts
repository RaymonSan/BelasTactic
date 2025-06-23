import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: await checkDatabaseConnection(),
      ollama: await checkOllamaConnection(),
      environment: checkEnvironmentVariables(),
    },
  };

  const allHealthy = Object.values(checks.services).every(service => service.status === 'healthy');
  
  return NextResponse.json(
    {
      ...checks,
      status: allHealthy ? 'healthy' : 'degraded',
    },
    { status: allHealthy ? 200 : 503 }
  );
}

async function checkDatabaseConnection() {
  // For now, just check if environment variables are set
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  return {
    status: supabaseUrl && supabaseKey ? 'healthy' : 'unhealthy',
    message: supabaseUrl && supabaseKey ? 'Environment variables configured' : 'Missing database configuration',
  };
}

async function checkOllamaConnection() {
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      const hasLlama = data.models?.some((model: any) => model.name.includes('llama3.1:8b'));
      
      return {
        status: hasLlama ? 'healthy' : 'degraded',
        message: hasLlama ? 'Ollama connected with Llama 3.1 8B' : 'Ollama connected but missing required model',
        models: data.models?.map((m: any) => m.name) || [],
      };
    } else {
      return {
        status: 'unhealthy',
        message: `Ollama API error: ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error connecting to Ollama',
    };
  }
}

function checkEnvironmentVariables() {
  const requiredVars = [
    'OLLAMA_BASE_URL',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    status: missing.length === 0 ? 'healthy' : 'degraded',
    message: missing.length === 0 
      ? 'All required environment variables are set' 
      : `Missing environment variables: ${missing.join(', ')}`,
    configured: requiredVars.length - missing.length,
    total: requiredVars.length,
  };
} 