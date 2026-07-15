import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiMail } from 'react-icons/hi';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
      const json = await response.json();

      if (json.success) {
        setStatus('success');
        setMessage(json.message || 'Email verified successfully!');
        toast.success('Email verified! You can now log in.');
      } else {
        setStatus('error');
        setMessage(json.message || 'Verification failed.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    // Prompt for email
    const email = window.prompt('Enter your email address:');
    if (!email) return;

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();

      if (json.success) {
        toast.success(json.message || 'Verification email sent!');
      } else {
        toast.error(json.message || 'Failed to resend verification email.');
      }
    } catch {
      toast.error('Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-lowest px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
          </Link>
        </div>

        <div className="glass-panel rounded-2xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-20 h-20 bg-primary-DEFAULT/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-10 h-10 border-4 border-primary-DEFAULT/30 border-t-primary-DEFAULT rounded-full animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verifying your email...</h2>
              <p className="text-outline">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiCheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-outline mb-6">{message}</p>
              <Link
                to="/login"
                className="btn btn-primary inline-flex items-center gap-2 px-8 py-3"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiXCircle className="w-12 h-12 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-outline mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResendVerification}
                  className="btn btn-primary inline-flex items-center justify-center gap-2 px-8 py-3"
                >
                  <HiMail className="w-5 h-5" />
                  Resend Verification Email
                </button>
                <Link
                  to="/login"
                  className="text-primary-dim hover:text-primary-fixed transition-colors text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
