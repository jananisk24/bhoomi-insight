import React, { useState } from 'react';
import {
  LandPlot,
  Lock,
  User as UserIcon,
  ArrowRight,
  Info,
} from 'lucide-react';
import { User } from '../types';
import { API_BASE_URL } from '../api';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  username: string;
  role: User['role'];
}


export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (
    e: React.SyntheticEvent<HTMLFormElement>
  ) => { 
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}${isRegistering ? '/register' : '/login'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail =
          typeof body?.detail === 'string' ? body.detail : null;
        if (!isRegistering && response.status === 401) {
          throw new Error('Invalid username or password.');
        }

        throw new Error(
          detail ??
            `${isRegistering ? 'Registration' : 'Login'} failed (${response.status}).`
        );
      }

      if (isRegistering) {
        setIsRegistering(false);
        setPassword('');
        setMessage('Account created. Sign in with your new credentials.');
        return;
      }

      const data: LoginResponse = await response.json();
      if (!data.access_token) {
        throw new Error('The server did not return an access token.');
      }
      sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('token_type', data.token_type || 'bearer');

      onLoginSuccess({
        username: data.username,
        fullName: data.username,
        role: data.role,
        department: 'Land Resources',
        isAuthenticated: true,
      });
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Cannot connect to the backend. Check that the server is running.');
      } else {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle GovTech ambient background styling */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900 to-slate-950 -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* College Project Top Header */}
      <div className="mb-6 text-center max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium mb-3">
          <LandPlot className="w-4 h-4 text-blue-400" />
          <span>Predictive Analytics Monitoring System</span>
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <LandPlot className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-white tracking-tight">LandDelay Predict</h1>
            <p className="text-xs text-slate-400">Land Acquisition Predictive Analytics System</p>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {isRegistering ? 'Create Officer Account' : 'Officer Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access the predictive early-warning portal to monitor land delays
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="username-input">
              Username or Employee ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. officer.revenue"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password-input">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                minLength={isRegistering ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegistering ? 'Create Officer Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setIsRegistering((registering) => !registering);
            setError('');
            setMessage('');
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          {isRegistering ? 'Already registered? Sign in' : 'Need an account? Register as an officer'}
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500 max-w-md">
        <p className="font-medium text-slate-400">
          Predictive Analytics System for Early Detection of Land Acquisition Delays
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Government Infrastructure &amp; Land Resources Monitoring System
        </p>
      </div>
    </div>
  );
};
