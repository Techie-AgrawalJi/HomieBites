import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { animateFormFields } from '../animations/pageTransitions';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  useGSAP(() => {
    if (formRef.current) animateFormFields(formRef.current.querySelectorAll('.form-field'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, form);
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell page-shell" style={{ alignItems: 'flex-start', paddingTop: '0.75rem' }}>
      <div className="auth-container w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading page-title font-bold mb-2">Reset Password</h1>
          <p className="opacity-60 page-subtitle">Enter your new password below</p>
        </div>
        <div ref={formRef} className="glass rounded-2xl auth-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-field">
              <label className="text-sm font-medium opacity-70 mb-1.5 block">New Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" className="w-full px-4 py-3 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
            </div>
            <div className="form-field">
              <label className="text-sm font-medium opacity-70 mb-1.5 block">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" className="w-full px-4 py-3 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
            </div>
            <div className="form-field">
              <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
            <p className="form-field text-center text-sm opacity-60">
              <Link to="/login" className="text-amber-500 hover:underline">Back to Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
