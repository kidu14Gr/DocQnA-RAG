import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { login, signup } from '../lib/api';

const AUTH_KEY = 'ai_doc_rag_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_KEY);
}

interface AuthSectionProps {
  onAuthenticated: (token: string) => void;
  initialMode?: 'signin' | 'signup';
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export function AuthSection({
  onAuthenticated,
  initialMode = 'signin',
  title,
  subtitle,
  onClose,
}: AuthSectionProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateSignup = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@') || trimmedEmail.length > 255) {
      setError('Invalid email');
      return false;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    const bytes = new TextEncoder().encode(password).length;
    if (bytes > 72) {
      setError('Password too long (must be 72 bytes or fewer).');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignup && !validateSignup()) return;
    setLoading(true);
    try {
      const res = isSignup
        ? await signup(email.trim(), password)
        : await login(email.trim(), password);
      setStoredToken(res.access_token);
      onAuthenticated(res.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">{title ?? (isSignup ? 'Create account' : 'Sign in')}</h2>
          <p className="text-slate-500 mt-1">
            {subtitle ??
              (isSignup ? 'Register to upload and chat with your documents' : 'Use your account to continue')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={isSignup ? 'Min 8 characters' : '••••••••'}
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
          >
            {isSignup ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError(null); }}
            className="text-indigo-600 hover:underline"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Continue as guest
          </button>
        )}
      </div>
    </div>
  );
}

