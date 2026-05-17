import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, guestLogin, initializeGoogleLogin, isAuthenticated, googleError, clearGoogleError } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ref for Google button container
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });

  // Initialize Google button when component mounts or when returning to main view
  useEffect(() => {
    if (!showLogin && !showSignup && googleButtonRef.current) {
      initializeGoogleLogin(googleButtonRef.current);
    }
  }, [showLogin, showSignup, initializeGoogleLogin]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear Google error when switching views
  useEffect(() => {
    if (showLogin || showSignup) {
      clearGoogleError();
    }
  }, [showLogin, showSignup, clearGoogleError]);

  // Combine local error with Google error
  const displayError = error || googleError;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(loginForm.username, loginForm.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(signupForm.username, signupForm.email, signupForm.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await guestLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Guest login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Error notification component
  const ErrorNotification = ({ message, onDismiss }: { message: string; onDismiss?: () => void }) => (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-shake">
      <div className="flex-shrink-0 w-5 h-5 text-red-400 mt-0.5">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-red-300 text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );

  // If showing login form
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Log In</h2>
            {error && <ErrorNotification message={error} onDismiss={() => setError('')} />}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-slate-400 hover:text-slate-300 font-medium py-2 transition-colors"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // If showing signup form
  if (showSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Sign Up</h2>
            {error && <ErrorNotification message={error} onDismiss={() => setError('')} />}
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={signupForm.username}
                onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/30 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="w-full text-slate-400 hover:text-slate-300 font-medium py-2 transition-colors"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main welcome screen - Clean & Beautiful Design
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6 text-6xl">🐼</div>
          <h1 className="text-4xl font-bold text-white mb-2">Journey of Words</h1>
          <p className="text-slate-400 text-sm">Master Chinese characters with ease</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          {displayError && (
            <ErrorNotification
              message={displayError}
              onDismiss={() => {
                setError('');
                clearGoogleError();
              }}
            />
          )}

          <div className="space-y-3">
            {/* Log In Button */}
            <button
              onClick={() => setShowLogin(true)}
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            >
              Log In
            </button>

            {/* Sign Up Button */}
            <button
              onClick={() => setShowSignup(true)}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-slate-600 disabled:opacity-50"
            >
              Sign Up
            </button>

            {/* Divider */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-slate-800/50 text-slate-400">or</span>
              </div>
            </div>

            {/* Google Login Button */}
            <div
              ref={googleButtonRef}
              className="w-full flex justify-center"
              style={{ minHeight: '44px' }}
            ></div>

            {/* Continue as Guest */}
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full text-slate-300 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 hover:bg-slate-700/30"
            >
              {loading ? '⏳ Loading...' : '👤 Continue as Guest'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-8">
          Begin your Chinese learning journey today
        </p>
      </div>

      {/* Add shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
