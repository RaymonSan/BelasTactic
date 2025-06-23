'use client';

import { useState } from 'react';

export default function TestPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<string>('');
  const [chatLoading, setChatLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthStatus({ error: 'Failed to fetch health status' });
    } finally {
      setIsLoading(false);
    }
  };

  const testOllamaChat = async () => {
    setChatLoading(true);
    setChatResponse('');
    
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          messages: [
            {
              role: 'user',
              content: 'What are the main Dutch tax boxes? Give a brief overview in 2-3 sentences.'
            }
          ],
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.message?.content || 'No response content');
      } else {
        setChatResponse(`Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      setChatResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          BelasTactic - Phase 1 Test Page
        </h1>
        
        {/* Health Check Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">System Health Check</h2>
          <button
            onClick={checkHealth}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Check Health Status'}
          </button>
          
          {healthStatus && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Ollama Direct Test Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Direct Ollama Test</h2>
          <p className="text-gray-600 mb-4">
            This tests direct communication with the local Ollama instance.
          </p>
          <button
            onClick={testOllamaChat}
            disabled={chatLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {chatLoading ? 'Asking AI...' : 'Test Dutch Tax Question'}
          </button>
          
          {chatResponse && (
            <div className="mt-4 p-4 bg-green-50 rounded">
              <h3 className="font-medium mb-2">AI Response:</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{chatResponse}</p>
            </div>
          )}
        </div>

        {/* Phase 1 Completion Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Phase 1 Deliverables</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Next.js 14 monorepo with app router</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>TypeScript configuration with strict mode</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Core dependencies installed (tRPC, Zod, etc.)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Ollama installation and Llama 3.1 8B model</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Basic AI service abstraction layer</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Environment variables template</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Basic health check endpoint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 