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
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
      <div className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-red-700 text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-rose-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-light text-amber-900 mb-6 text-center">Log In</h2>
            {error && <ErrorNotification message={error} onDismiss={() => setError('')} />}
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-amber-900/70 font-light py-2 hover:text-amber-900"
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-rose-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-light text-amber-900 mb-6 text-center">Sign Up</h2>
            {error && <ErrorNotification message={error} onDismiss={() => setError('')} />}
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={signupForm.username}
                onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="w-full text-amber-900/70 font-light py-2 hover:text-amber-900"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main welcome screen - Desktop Layout
  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-rose-100">
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-green-600/10 rounded-full blur-3xl"></div>
      <div className="absolute top-40 right-32 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl"></div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding & Image */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-light tracking-widest text-amber-900 mb-4">
              JOURNEY OF WORDS
            </h1>
            <p className="text-xl text-amber-800/80 font-light">
              Learn Chinese with <span className="italic">peace</span> and <span className="italic">joy</span>
            </p>
          </div>

          {/* Panda Character */}
          <div className="relative">
            <div className="absolute inset-0 bg-orange-300/30 rounded-full blur-3xl scale-150"></div>
            <div className="relative w-96 h-96 bg-white rounded-full shadow-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl mb-4">🐼</div>
                <div className="text-4xl">🙏</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Title - shown only on small screens */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-4xl font-light tracking-widest text-amber-900 mb-2">
                JOURNEY OF WORDS
              </h1>
              <p className="text-sm text-amber-800/80 font-light">
                Learn Chinese with <span className="italic">peace</span> and <span className="italic">joy</span>
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10">
              <h2 className="text-3xl font-light text-amber-900 mb-8 text-center">Welcome Back</h2>

              {displayError && (
                <ErrorNotification
                  message={displayError}
                  onDismiss={() => {
                    setError('');
                    clearGoogleError();
                  }}
                />
              )}

              <div className="space-y-4">
                {/* Log In Button */}
                <button
                  onClick={() => setShowLogin(true)}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                >
                  Log In
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={() => setShowSignup(true)}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 text-primary border-2 border-primary font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                >
                  Sign Up
                </button>

                {/* Divider */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-amber-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-amber-600">or</span>
                  </div>
                </div>

                {/* Google Login Button - GSI rendered button */}
                <div
                  ref={googleButtonRef}
                  className="w-full flex justify-center"
                  style={{ minHeight: '44px' }}
                ></div>

                {/* Continue as Guest */}
                <button
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-amber-900/70 font-light py-3 hover:text-amber-900 transition-colors disabled:opacity-50 hover:bg-amber-50 rounded-xl"
                >
                  <span className="text-xl">👤</span>
                  <span>{loading ? 'Loading...' : 'Continue as Guest'}</span>
                </button>
              </div>
            </div>

            {/* Footer text */}
            <p className="text-center text-amber-800/60 text-sm mt-6">
              Start your Chinese learning journey today
            </p>
          </div>
        </div>
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
