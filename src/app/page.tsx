import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            BelasTactic
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Dutch Tax Strategy SaaS
          </p>
          <p className="text-lg text-gray-500 italic">
            "Making Belastingdienst paperwork feel like a spa day."
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Phase 1 Status */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🚀</span>
              <h2 className="text-2xl font-semibold text-gray-800">
                Phase 1: Foundation & AI Setup
              </h2>
            </div>
            <div className="flex items-center mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ COMPLETE
              </span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Next.js 14 with TypeScript
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Ollama + Llama 3.1 8B Model
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                AI Service Layer
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Health Check API
              </div>
            </div>
            <Link 
              href="/test"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Test Phase 1 Setup →
            </Link>
          </div>

          {/* Next Phase Preview */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🏗️</span>
              <h2 className="text-2xl font-semibold text-gray-800">
                Phase 2: Infrastructure & Auth
              </h2>
            </div>
            <div className="flex items-center mb-4">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                📋 PLANNED
              </span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Supabase Database Setup
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Access Code Authentication
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                GDPR Compliance Foundation
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Automated Backups
              </div>
            </div>
            <button 
              disabled
              className="inline-block bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Project Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">🎯 Mission</h3>
              <p className="text-gray-600 text-sm">
                Help Dutch individuals optimize their tax strategy with AI-powered analysis and transparent calculations.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">🛠️ Technology</h3>
              <p className="text-gray-600 text-sm">
                Local-first AI with Ollama, Next.js 14, Supabase, and GDPR-compliant architecture.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">📈 Progress</h3>
              <p className="text-gray-600 text-sm">
                7-phase development plan. Currently in Phase 1 completion, targeting MVP in 7 weeks.
              </p>
            </div>
          </div>
        </div>

        {/* Development Progress */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Development Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <span className="font-medium text-gray-800">Phase 1: Foundation & AI Setup</span>
                <span className="ml-2 text-sm text-green-600">✅ Complete</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
              <span className="text-gray-600">Phase 2: Infrastructure & Authentication</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
              <span className="text-gray-600">Phase 3: Tax Questionnaire & Data Model</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
              <span className="text-gray-600">Phase 4: AI Integration & RAG Pipeline</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
              <span className="text-gray-600">Phase 5: Tax Rules Engine & Scenarios</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
              <span className="text-gray-600">Phase 6: Export & GDPR Compliance</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-4"></div>
              <span className="text-gray-600">Phase 7: Testing & Launch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
