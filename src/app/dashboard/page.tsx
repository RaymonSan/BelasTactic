'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
}

interface Household {
  id: string;
  name: string;
  filing_year: number;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setHouseholds(data.households);
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect anyway
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BelasTactic Dashboard</h1>
              <p className="text-gray-600">Welcome, {user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎉 Phase 2 Complete!</h2>
          <p className="text-gray-600 mb-4">
            Your authentication system is now set up and working. You've successfully logged in with an access code!
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">✅ Completed Features</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Access code authentication</li>
                <li>• Secure JWT token system</li>
                <li>• User profile management</li>
                <li>• Database with GDPR compliance</li>
                <li>• GitHub repository setup</li>
                <li>• Automated backup system</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">🚀 Coming Next (Phase 3)</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Dynamic tax questionnaire</li>
                <li>• Household management</li>
                <li>• Data validation with Zod</li>
                <li>• Auto-save functionality</li>
                <li>• Progress tracking</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="text-gray-900 capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Login</label>
                <p className="text-gray-900">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tax Households</h3>
            {households.length > 0 ? (
              <div className="space-y-3">
                {households.map((household) => (
                  <div key={household.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{household.name}</p>
                    <p className="text-sm text-gray-600">Filing Year: {household.filing_year}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tax households set up yet</p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50" disabled>
                  Create Household (Phase 3)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Development Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <span className="font-medium text-gray-800">Phase 1: Foundation & AI Setup</span>
                <span className="ml-2 text-sm text-green-600">✅ Complete</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <span className="font-medium text-gray-800">Phase 2: Infrastructure & Authentication</span>
                <span className="ml-2 text-sm text-green-600">✅ Complete</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded-full mr-4"></div>
              <div className="flex-1">
                <span className="font-medium text-gray-800">Phase 3: Tax Questionnaire & Data Model</span>
                <span className="ml-2 text-sm text-yellow-600">🔄 Next</span>
              </div>
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

        {/* Development Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Development Note</h3>
          <p className="text-yellow-700">
            Phase 2 is complete! The authentication system, database schema, and GitHub repository are all set up. 
            In the next phase, we'll build the dynamic tax questionnaire that will gather information needed for tax optimization.
          </p>
        </div>
      </main>
    </div>
  );
} 