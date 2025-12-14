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
    <div className="min-h-screen flex bg-white fade-in">
      
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className="text-xl font-bold text-secondary-900">Inovitaz</span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">Please enter your details to sign in.</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-gray-400" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-gray-400" />
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
              </div>
              <div className="text-sm">
                <Link to="/support" className="font-medium text-primary-600 hover:text-primary-500">Forgot password?</Link>
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

          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Art */}
      <div className="hidden lg:flex flex-1 bg-secondary-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900 opacity-90" />
        <div className="absolute inset-0" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'overlay' }}></div>
        <div className="relative z-10 text-center px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Build the Future</h2>
          <p className="text-primary-100 text-lg max-w-md mx-auto">Join thousands of developers building amazing IoT projects.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;