import React, { useState } from 'react';
import { 
  LandPlot, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  GraduationCap, 
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('officer.revenue');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate quick authentication
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        username: username.trim(),
        fullName: 'Dr. Ramesh K. (Project Officer)',
        role: 'Assistant Commissioner (Revenue)',
        department: 'Dept. of Land Resources & Public Works',
        isAuthenticated: true
      });
    }, 400);
  };

  const handleDemoFill = () => {
    setUsername('officer.revenue');
    setPassword('demo1234');
    setError('');
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
          <h2 className="text-lg font-bold text-slate-800">Officer Sign In</h2>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span>Remember session</span>
            </label>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Reset to Demo
            </button>
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
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access banner for student presentation convenience */}
        <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Examiner / Demo Login
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2">
            No signup required. Click below to explore all 9 project modules immediately.
          </p>
          <button
            id="btn-quick-demo-login"
            type="button"
            onClick={handleLogin}
            className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Launch Demo Dashboard Directly</span>
          </button>
        </div>
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
