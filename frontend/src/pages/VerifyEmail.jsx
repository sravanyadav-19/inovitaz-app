import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiMail } from 'react-icons/hi';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    // React StrictMode double-invokes effects in development. Guard so the
    // one-time verification request fires exactly once — otherwise the second
    // invoke finds the token already consumed and reports a false "invalid" error.
    if (calledRef.current) return;
    calledRef.current = true;

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
    } catch {
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    // Design-layer replacement for the old window.prompt: a real field.
    const email = resendEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address (e.g. you@example.com)');
      return;
    }
    setEmailError('');
    setResending(true);

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
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Inovitaz</span>
          </Link>
        </div>

        <div className="glass-panel p-8 text-center fade-in">
          {status === 'verifying' && (
            <>
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="t-h3 text-white mb-2">Verifying your email...</h2>
              <p className="text-outline">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiCheckCircle className="w-12 h-12 text-success-fg" />
              </div>
              <h2 className="t-h3 text-white mb-2">Email Verified!</h2>
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
              <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiXCircle className="w-12 h-12 text-danger-fg" />
              </div>
              <h2 className="t-h3 text-white mb-2">Verification Failed</h2>
              <p className="text-outline mb-6">{message}</p>
              <form onSubmit={handleResendVerification} className="flex flex-col gap-4 text-left">
                <Input
                  id="resend-email"
                  name="resend-email"
                  type="email"
                  label="Resend verification link"
                  placeholder="Your account email (you@example.com)"
                  autoComplete="email"
                  required
                  icon={<HiMail className="h-5 w-5" />}
                  value={resendEmail}
                  onChange={(e) => { setResendEmail(e.target.value); if (emailError) setEmailError(''); }}
                  error={emailError}
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {resending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><HiMail className="w-5 h-5" /> Resend Verification Email</>
                  )}
                </button>
              </form>
              <Link
                to="/login"
                className="block mt-4 text-center text-primary-dim hover:text-primary-fixed transition-colors text-sm"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
