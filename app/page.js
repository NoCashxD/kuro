'use client';

import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Eye, EyeOff, User, Lock, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStep, selectedUsername } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    await login(username.trim(), '', 1);
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    setLoading(true);
    await login(selectedUsername, password, 2);
    setLoading(false);
  };

  const handleBack = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-w-screen">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-text" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-text">
            Kuro Panel
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            License Management System
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-accent rounded-lg shadow-xl p-8">
          {loginStep === 1 ? (
            // Step 1: Username
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium ">
                  Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-600 placeholder-gray-400 text-text bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-text bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text"></div>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          ) : (
            // Step 2: Password
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Welcome back,</p>
                <p className="text-lg font-medium text-text">{selectedUsername}</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium ">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-12 py-3 border border-gray-600 placeholder-gray-400 text-text bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-600 text-sm font-medium rounded-md  bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !password.trim()}
                  className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-text bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text"></div>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure authentication with device binding
          </p>
        </div>
      </div>
    </div>
  );
}
