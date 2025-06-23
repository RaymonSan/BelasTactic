'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const router = useRouter();

  const requestAccessCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsRequestingCode(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setShowCodeInput(true);
        
        // In development, show the access code
        if (data.accessCode) {
          setMessage(`${data.message}\n\nDevelopment Mode - Your access code: ${data.accessCode}`);
        }
      } else {
        setError(data.error || 'Failed to request access code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !accessCode) {
      setError('Please enter both email and access code');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Login successful! Redirecting...');
        // Redirect to dashboard or home page
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BelasTactic</h1>
          <p className="text-gray-600">Access your tax optimization dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
                required
                disabled={isLoading || isRequestingCode}
              />
              {!showCodeInput && (
                <button
                  type="button"
                  onClick={requestAccessCode}
                  disabled={isRequestingCode || !email}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRequestingCode ? 'Sending...' : 'Get Code'}
                </button>
              )}
            </div>
          </div>

          {/* Access Code Input */}
          {showCodeInput && (
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg tracking-widest"
                placeholder="ABCD1234"
                maxLength={8}
                required
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the 8-character code sent to your email
              </p>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm whitespace-pre-line">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Login Button */}
          {showCodeInput && (
            <button
              type="submit"
              disabled={isLoading || !email || !accessCode}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          )}
        </form>

        {/* Request New Code */}
        {showCodeInput && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setShowCodeInput(false);
                setAccessCode('');
                setMessage('');
                setError('');
              }}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Request a new access code
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Enter your email address</li>
            <li>2. Click "Get Code" to receive an access code</li>
            <li>3. Enter the 8-character code to sign in</li>
            <li>4. Access your tax optimization dashboard</li>
          </ol>
        </div>

        {/* Phase Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Phase 2: Infrastructure & Authentication ✅
          </p>
        </div>
      </div>
    </div>
  );
} 