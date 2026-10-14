import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser, HiArrowRight } from 'react-icons/hi';
import Input from '../components/ui/Input';
import AuthPane from '../components/auth/AuthPane';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * Simple client-side password strength scorer.
 * (Display-only guidance; the backend still enforces its own rules.)
 */
function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, level: 0, label: "", bar: "bg-surface-variant", text: "text-outline" };
  }
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, level: 1, label: "Weak", bar: "bg-danger", text: "text-danger-fg" };
  if (score <= 3) return { score, level: 2, label: "Fair", bar: "bg-warning", text: "text-warning-fg" };
  if (score <= 4) return { score, level: 3, label: "Good", bar: "bg-success", text: "text-success-fg" };
  return { score, level: 4, label: "Strong", bar: "bg-success", text: "text-success-fg" };
}

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [existingEmail, setExistingEmail] = useState('');

  const strength = getPasswordStrength(formData.password);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!existingEmail) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setExistingEmail('');
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [existingEmail]);
  
  if (isAuthenticated) {
    return null;
  }

  // Shown after a successful registration: clear confirmation that the
  // verification email was sent (instead of silently redirecting to login).
  if (registeredEmail) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center fade-in px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
          </Link>

          <div className="bg-surface rounded-2xl border border-surface-variant p-8 text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiMail className="w-12 h-12 text-success-fg" />
            </div>
            <h2 className="t-h2 text-white mb-3">Check your email</h2>
            <p className="text-outline mb-2 leading-relaxed">
              We've sent a verification link to <span className="text-white font-medium">{registeredEmail}</span>.
            </p>
            <p className="text-outline mb-6 text-sm">
              Click the link in the email to verify your account and log in. Didn't get it? Check your spam folder.
            </p>
            <button type="button" autoFocus onClick={() => navigate('/login')} className="btn btn-primary w-full py-3">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      if (result.success) {
        setRegisteredEmail(formData.email);
        toast.success(`A verification link has been sent to ${formData.email}`);
      }
    } catch (error) {
      const msg = (error.message || '').toLowerCase();
      // Email already registered -> show a clear popup (not just a toast).
      if (msg.includes('already') || msg.includes('exists')) {
        setExistingEmail(formData.email);
      }
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex fade-in">
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
            <div className="t-label text-primary-dim mb-2">Create account</div>
            <h2 className="t-h1 text-white">Create an account</h2>
            <p className="mt-2 text-sm text-outline">
              Join thousands of makers building the future. Free to join — browse, wishlist, and buy projects with instant download.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input
              id="signup-name"
              name="name"
              label="Full Name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              icon={<HiUser className="h-5 w-5" />}
              placeholder="John Doe"
            />

            <Input
              id="signup-email"
              name="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<HiMail className="h-5 w-5" />}
              placeholder="you@example.com"
            />

            <div>
              <Input
                id="signup-password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={<HiLockClosed className="h-5 w-5" />}
                rightSlot={(
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="w-11 h-11 inline-flex items-center justify-center text-outline hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                  </button>
                )}
                placeholder="••••••••"
              />
              {/* Strength meter (shown once the user starts typing) */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength.level ? strength.bar : 'bg-surface-variant'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength.text}`}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
              <p className="mt-1 t-caption text-outline">
                At least 6 characters. A mix of upper/lower case, numbers and symbols makes it stronger.
              </p>
            </div>

            <Input
              id="signup-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={<HiLockClosed className="h-5 w-5" />}
              rightSlot={(
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                  className="w-11 h-11 inline-flex items-center justify-center text-outline hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                </button>
              )}
              placeholder="••••••••"
            />

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                aria-invalid={Boolean(errors.terms)}
                aria-describedby={errors.terms ? 'signup-terms-error' : undefined}
                className="h-4 w-4 mt-1 text-primary bg-surface-lowest border-surface-variant rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-outline">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-dim hover:text-primary-fixed">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-dim hover:text-primary-fixed">Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && <p id="signup-terms-error" role="alert" className="text-xs text-danger-fg">{errors.terms}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex justify-center items-center gap-2 py-3"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>Create Account <HiArrowRight /></>
              }
            </button>
          </form>

          <p className="mt-2 text-center text-sm text-outline">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-dim hover:text-primary-fixed">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side — shared CSS brand pane (F8: no external imagery) */}
      <AuthPane
        eyebrow="Membership"
        title="Join the community"
        subtitle="Access premium projects and connect with fellow engineers."
        footnote="registry: open — seats: unlimited"
      />

      {/* Email already registered popup */}
      {existingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 fade-in">
          <section role="dialog" aria-modal="true" aria-labelledby="existing-email-title" aria-describedby="existing-email-description" className="bg-surface rounded-2xl border border-surface-variant p-8 max-w-md w-full text-center fade-in">
            <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiMail className="w-8 h-8 text-danger-fg" />
            </div>
            <h3 id="existing-email-title" className="text-xl font-bold text-white mb-2">Email already registered</h3>
            <p className="text-outline mb-1">
              An account with <span className="text-white font-medium">{existingEmail}</span> already exists.
            </p>
            <p id="existing-email-description" className="text-outline text-sm mb-6">
              Try logging in instead, or sign up with a different email address.
            </p>
            <div className="flex flex-col gap-3">
              <button type="button" autoFocus onClick={() => navigate('/login')} className="btn btn-primary w-full py-3">
                Go to Login
              </button>
              <button type="button" onClick={() => setExistingEmail('')} className="text-sm text-outline hover:text-white transition-colors">
                Use a different email
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Signup;
