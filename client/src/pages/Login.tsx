import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { animateFormFields, animateRoleCardBorder } from '../animations/pageTransitions';
import { shakeElement } from '../animations/cardAnimations';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (formRef.current) {
      const fields = formRef.current.querySelectorAll('.form-field');
      animateFormFields(fields);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      if (errorRef.current) shakeElement(errorRef.current);
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const nextUser = await login(email, password);
      toast.success('Welcome back!');
      if (nextUser.role === 'superadmin') navigate('/admin');
      else if (nextUser.role === 'provider') navigate('/provider');
      else navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      if (errorRef.current) shakeElement(errorRef.current);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell page-shell" style={{ alignItems: 'flex-start', paddingTop: '3rem' }}>
      <div className="auth-container w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading page-title font-bold mb-2">Welcome back</h1>
          <p className="opacity-60 page-subtitle">Sign in to your HomieBites account</p>
        </div>

        <div ref={formRef} className="glass rounded-2xl auth-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-field">
              <label className="text-sm font-medium opacity-70 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            <div className="form-field">
              <label className="text-sm font-medium opacity-70 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div ref={errorRef} className="form-field flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-amber-500 hover:underline">Forgot password?</Link>
            </div>

            <div className="form-field">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} /> Sign In</>}
              </button>
            </div>

            <p className="form-field text-center text-sm opacity-60">
              Don't have an account? <Link to="/signup" className="text-amber-500 font-medium hover:underline">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

