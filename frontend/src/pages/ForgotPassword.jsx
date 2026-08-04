import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { HiMail, HiArrowLeft, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('If that email exists, a reset link is on its way.');
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-lowest fade-in px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.35)] group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
          </Link>

          {sent ? (
            <div className="bg-surface rounded-2xl border border-surface-variant p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">Check your inbox</h2>
              <p className="text-outline mb-6 leading-relaxed">
                If an account exists for <span className="text-white font-medium">{email}</span>, you'll receive an email with a link to reset your password. The link expires in 1 hour.
              </p>
              <button onClick={() => navigate('/login')} className="btn btn-primary w-full py-3">
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white">Forgot password?</h2>
              <p className="mt-2 text-sm text-outline">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-outline mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiMail className="h-5 w-5 text-outline" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      className="input pl-10 w-full"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
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
                    <>Send reset link <HiArrowRight /></>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-outline">
            <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-dim transition-colors">
              <HiArrowLeft /> Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
