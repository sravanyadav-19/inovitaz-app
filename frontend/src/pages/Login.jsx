import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiMail, HiLockClosed, HiArrowRight, HiEye, HiEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-lowest fade-in">
      
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
            </Link>
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-outline">Please enter your details to sign in.</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-outline mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-surface-variant" />
                  </div>
                  <input
                    type="email"
                    required
                    className="input pl-10 w-full"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-outline mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-surface-variant" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input pl-10 pr-10 w-full"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-variant hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary bg-surface-lowest border-surface-variant rounded focus:ring-primary focus:ring-offset-surface-lowest" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white">Remember me</label>
              </div>
              <div className="text-sm">
                <Link to="/support" className="font-medium text-primary hover:text-primary-dim transition-colors">Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex justify-center items-center gap-2 py-3 shadow-lg hover:shadow-xl transition-all"
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
            <Link to="/signup" className="font-medium text-primary hover:text-primary-dim transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Art */}
      <div className="hidden lg:flex flex-1 bg-surface relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-surface opacity-90" />
        <div className="absolute inset-0" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'overlay' }}></div>
        <div className="relative z-10 text-center px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Build the Future</h2>
          <p className="text-outline text-lg max-w-md mx-auto">Join thousands of developers building amazing IoT projects.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;