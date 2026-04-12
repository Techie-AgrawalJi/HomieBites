import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Mail } from 'lucide-react';
import { animateFormFields } from '../animations/pageTransitions';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useGSAP(() => {
    if (formRef.current) animateFormFields(formRef.current.querySelectorAll('.form-field'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell page-shell" style={{ alignItems: 'flex-start', paddingTop: '1.5rem' }}>
      <div className="auth-container w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading page-title font-bold mb-2">Forgot Password</h1>
          <p className="opacity-60 page-subtitle">Enter your email to receive a reset link</p>
        </div>
        <div ref={formRef} className="glass rounded-2xl auth-card">
          {sent ? (
            <div className="text-center py-4">
              <Mail size={48} className="mx-auto text-amber-500 mb-4" />
              <p className="font-semibold mb-2">Email sent!</p>
              <p className="text-sm opacity-60">Check your inbox for the password reset link. It's valid for 1 hour.</p>
              <Link to="/login" className="mt-4 inline-block text-amber-500 hover:underline text-sm">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-field">
                <label className="text-sm font-medium opacity-70 mb-1.5 block">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
              </div>
              <div className="form-field">
                <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
              <p className="form-field text-center text-sm opacity-60">
                <Link to="/login" className="text-amber-500 hover:underline">Back to Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
