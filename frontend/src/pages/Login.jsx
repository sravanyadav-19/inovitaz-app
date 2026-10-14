import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import { HiMail, HiLockClosed, HiArrowRight, HiEye, HiEyeOff, HiCheckCircle } from 'react-icons/hi';
import Input from '../components/ui/Input';
import AuthPane from '../components/auth/AuthPane';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [notFoundEmail, setNotFoundEmail] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // Fix: use useEffect instead of calling navigate during render
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!unverifiedEmail && !notFoundEmail) return undefined;

    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setUnverifiedEmail('');
      setNotFoundEmail('');
      setResent(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [unverifiedEmail, notFoundEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      const low = errorMessage.toLowerCase();
      if (low.includes('verify')) {
        setUnverifiedEmail(formData.email);
      } else if (low.includes('no account') || low.includes('sign up') || low.includes('not registered') || low.includes('not found')) {
        setNotFoundEmail(formData.email);
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const res = await authAPI.resendVerification(unverifiedEmail);
      setResent(true);
      toast.success(res.message || 'Verification email sent! Check your inbox (and spam).');
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex fade-in">

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
            </Link>
            <div className="t-label text-primary-dim mb-2">Sign in</div>
            <h2 className="t-h1 text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-outline">Please enter your details to sign in.</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                id="login-email"
                name="email"
                label="Email address"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                icon={<HiMail className="h-5 w-5" />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                id="login-password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                icon={<HiLockClosed className="h-5 w-5" />}
                rightSlot={(
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="w-11 h-11 inline-flex items-center justify-center text-outline hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                  </button>
                )}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary bg-surface-lowest border-surface-variant rounded focus:ring-primary focus:ring-offset-surface-lowest"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-dim hover:text-primary-fixed transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex justify-center items-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <HiArrowRight /></>
              )}
            </button>
          </form>

          <p className="mt-2 text-center text-sm text-outline">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-dim hover:text-primary-fixed transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side — shared CSS brand pane (F8: no external imagery) */}
      <AuthPane
        eyebrow="Secure sign-in"
        title="Build the future"
        subtitle="Join thousands of developers building amazing IoT projects."
        footnote="system access — status: ready"
      />

      {/* Unverified-email popup */}
      {unverifiedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 fade-in">
          <section role="dialog" aria-modal="true" aria-labelledby="unverified-email-title" aria-describedby="unverified-email-description" className="bg-surface rounded-2xl border border-surface-variant p-8 max-w-md w-full text-center fade-in">
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiMail className="w-8 h-8 text-warning-fg" />
            </div>
            <h3 id="unverified-email-title" className="text-xl font-bold text-white mb-2">Email not verified yet</h3>
            <p className="text-outline mb-1">
              We sent a verification link to <span className="text-white font-medium">{unverifiedEmail}</span>.
            </p>
            <p id="unverified-email-description" className="text-outline text-sm mb-6">
              Please check your inbox (and spam folder), click the link to verify your email, then try logging in again.
            </p>
            <div className="flex flex-col gap-3">
              {resent ? (
                <div className="bg-success/15 border border-success/40 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-success-fg font-medium flex items-center justify-center gap-2">
                    <HiCheckCircle className="w-5 h-5" /> Verification email sent! Check your inbox (and spam).
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  autoFocus
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="btn btn-primary w-full py-3"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setUnverifiedEmail(''); setResent(false); }}
                className="text-sm text-outline hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* No account found popup */}
      {notFoundEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 fade-in">
          <section role="dialog" aria-modal="true" aria-labelledby="no-account-title" aria-describedby="no-account-description" className="bg-surface rounded-2xl border border-surface-variant p-8 max-w-md w-full text-center fade-in">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiMail className="w-8 h-8 text-primary-dim" />
            </div>
            <h3 id="no-account-title" className="text-xl font-bold text-white mb-2">No account found</h3>
            <p className="text-outline mb-1">
              There's no account registered with <span className="text-white font-medium">{notFoundEmail}</span>.
            </p>
            <p id="no-account-description" className="text-outline text-sm mb-6">
              You need to create an account before you can log in.
            </p>
            <div className="flex flex-col gap-3">
              <button type="button" autoFocus onClick={() => navigate('/signup')} className="btn btn-primary w-full py-3">
                Go to Sign Up
              </button>
              <button type="button" onClick={() => setNotFoundEmail('')} className="text-sm text-outline hover:text-white transition-colors">
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Login;
