import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser, HiArrowRight } from 'react-icons/hi';
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

  if (score <= 1) return { score, level: 1, label: "Weak", bar: "bg-red-500", text: "text-red-400" };
  if (score <= 3) return { score, level: 2, label: "Fair", bar: "bg-yellow-500", text: "text-yellow-400" };
  if (score <= 4) return { score, level: 3, label: "Good", bar: "bg-green-500", text: "text-green-400" };
  return { score, level: 4, label: "Strong", bar: "bg-green-500", text: "text-green-400" };
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
  
  if (isAuthenticated) {
    return null;
  }

  // Shown after a successful registration: clear confirmation that the
  // verification email was sent (instead of silently redirecting to login).
  if (registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-lowest fade-in px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 group justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
          </Link>

          <div className="bg-surface rounded-2xl border border-surface-variant p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiMail className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
            <p className="text-outline mb-2 leading-relaxed">
              We've sent a verification link to <span className="text-white font-medium">{registeredEmail}</span>.
            </p>
            <p className="text-outline mb-6 text-sm">
              Click the link in the email to verify your account and log in. Didn't get it? Check your spam folder.
            </p>
            <button onClick={() => navigate('/login')} className="btn btn-primary w-full py-3">
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
    <div className="min-h-screen flex bg-surface-lowest fade-in">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
            </Link>
            <h2 className="text-3xl font-bold text-white">Create an account</h2>
            <p className="mt-2 text-sm text-outline">
              Join thousands of makers building the future. Free to join — browse, wishlist, and buy projects with instant download.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-outline mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiUser className="h-5 w-5 text-outline" />
                </div>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input pl-10 w-full ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-outline mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiMail className="h-5 w-5 text-outline" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input pl-10 w-full ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-outline mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLockClosed className="h-5 w-5 text-outline" />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 w-full ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}

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
              <p className="mt-1 text-xs text-outline">
                At least 6 characters. Use a mix of upper & lower case letters, numbers and symbols for a stronger password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-outline mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLockClosed className="h-5 w-5 text-outline" />
                </div>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 mt-1 text-primary bg-surface-lowest border-surface-variant rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-outline">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:text-primary-dim">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:text-primary-dim">Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}

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
            <Link to="/login" className="font-medium text-primary hover:text-primary-dim">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-surface relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 to-surface opacity-90" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'overlay'
          }}
        />
        <div className="relative z-10 text-center px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Join the Community</h2>
          <p className="text-outline text-lg max-w-md mx-auto">
            Access premium projects and connect with fellow engineers.
          </p>
        </div>
      </div>

      {/* Email already registered popup */}
      {existingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl border border-surface-variant p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiMail className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Email already registered</h3>
            <p className="text-outline mb-1">
              An account with <span className="text-white font-medium">{existingEmail}</span> already exists.
            </p>
            <p className="text-outline text-sm mb-6">
              Try logging in instead, or sign up with a different email address.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/login')} className="btn btn-primary w-full py-3">
                Go to Login
              </button>
              <button onClick={() => setExistingEmail('')} className="text-sm text-outline hover:text-white transition-colors">
                Use a different email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
