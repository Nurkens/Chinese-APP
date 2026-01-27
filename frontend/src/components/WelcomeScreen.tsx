import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, guestLogin } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });

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

  // If showing login form
  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-rose-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-light text-amber-900 mb-6 text-center">Log In</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
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
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
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

              {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-sm text-center">
                  {error}
                </div>
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
    </div>
  );
};

export default WelcomeScreen;
