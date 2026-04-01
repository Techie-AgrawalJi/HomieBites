import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Building2, UtensilsCrossed, User, Eye, EyeOff, LocateFixed } from 'lucide-react';
import { animateFormFields, animateRoleCardBorder } from '../animations/pageTransitions';
import { shakeElement } from '../animations/cardAnimations';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const Signup = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const userCardRef = useRef<HTMLDivElement>(null);
  const providerCardRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<'user' | 'provider'>('user');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', password: '', confirmPassword: '', businessName: '', businessPhone: '', businessEmail: '', businessAddress: '', serviceType: 'pg', latitude: '', longitude: '' });
  const { refetch } = useAuth();
  const navigate = useNavigate();

  useGSAP(() => {
    if (formRef.current) {
      const fields = formRef.current.querySelectorAll('.form-field');
      animateFormFields(fields);
    }
    if (userCardRef.current) animateRoleCardBorder(userCardRef.current, role === 'user');
    if (providerCardRef.current) animateRoleCardBorder(providerCardRef.current, role === 'provider');
  }, [role]);

  const handleRoleSwitch = (r: 'user' | 'provider') => {
    setRole(r);
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({ ...form, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() });
        toast.success('Location auto-filled!');
      },
      () => toast.error('Location access denied')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (role === 'user') {
        await api.post('/auth/signup', form);
        await refetch();
        toast.success('Welcome to HomieBites!');
        navigate('/');
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        await api.post('/auth/provider-signup', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Registration submitted! Awaiting admin approval.');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
      if (formRef.current) shakeElement(formRef.current);
    } finally {
      setLoading(false);
    }
  };

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: any) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="auth-shell page-shell">
      <div className="auth-container w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-heading page-title font-bold mb-2">Create Account</h1>
          <p className="opacity-60 page-subtitle">Join HomieBites - find your perfect home</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-4 mb-6 two-col-form">
          <div ref={userCardRef} onClick={() => handleRoleSwitch('user')} className={`glass rounded-2xl p-5 cursor-pointer transition-all text-center ${role === 'user' ? 'border-amber-500/60' : 'hover:border-white/20'}`}>
            <User size={28} className={`mx-auto mb-2 ${role === 'user' ? 'text-amber-500' : 'opacity-40'}`} />
            <p className="font-semibold">I'm a User</p>
            <p className="text-xs opacity-50 mt-1">Browse, book and pay</p>
          </div>
          <div ref={providerCardRef} onClick={() => handleRoleSwitch('provider')} className={`glass rounded-2xl p-5 cursor-pointer transition-all text-center ${role === 'provider' ? 'border-amber-500/60' : 'hover:border-white/20'}`}>
            <Building2 size={28} className={`mx-auto mb-2 ${role === 'provider' ? 'text-amber-500' : 'opacity-40'}`} />
            <p className="font-semibold">I'm a Provider</p>
            <p className="text-xs opacity-50 mt-1">List PG or meal services</p>
          </div>
        </div>

        <div ref={formRef} className="glass rounded-2xl auth-card">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="form-field two-col-form">
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">Full Name</label>
                <input {...f('name')} placeholder="John Doe" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
              </div>
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">City</label>
                <input {...f('city')} placeholder="Bangalore" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
              </div>
            </div>

            <div className="form-field two-col-form">
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">Email</label>
                <input type="email" {...f('email')} placeholder="you@example.com" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
              </div>
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">Phone</label>
                <input {...f('phone')} placeholder="+91 98765 43210" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
              </div>
            </div>

            {role === 'provider' && (
              <>
                <div className="form-field">
                  <label className="text-xs font-medium opacity-70 mb-1 block">Business Name</label>
                  <input {...f('businessName')} placeholder="My PG & Meals" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" />
                </div>
                <div className="form-field two-col-form">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">Business Phone</label>
                    <input {...f('businessPhone')} placeholder="+91..." className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">Business Email</label>
                    <input type="email" {...f('businessEmail')} placeholder="biz@example.com" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="text-xs font-medium opacity-70 mb-1 block">Business Address</label>
                  <input {...f('businessAddress')} placeholder="Street, Area, City" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                </div>
                <div className="form-field">
                  <label className="text-xs font-medium opacity-70 mb-1 block">Service Type</label>
                  <select {...f('serviceType')} className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none">
                    <option value="pg">PG Only</option>
                    <option value="meal">Meal Only</option>
                    <option value="both">Both PG & Meal</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="text-xs font-medium opacity-70 mb-1 block">Business Location</label>
                  <div className="coord-row">
                    <input {...f('latitude')} placeholder="Latitude" className="flex-1 px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                    <input {...f('longitude')} placeholder="Longitude" className="flex-1 px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                    <button type="button" onClick={getLocation} className="px-3 py-2.5 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500/20 transition-colors">
                      <LocateFixed size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-field">
              <label className="text-xs font-medium opacity-70 mb-1 block">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} {...f('password')} placeholder="Min 6 characters" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="text-xs font-medium opacity-70 mb-1 block">Confirm Password</label>
              <input type="password" {...f('confirmPassword')} placeholder="Repeat password" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none focus:border-amber-500/60 transition-colors" required />
            </div>

            <div className="form-field pt-2">
              <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : role === 'user' ? 'Create Account' : 'Submit for Approval'}
              </button>
            </div>

            {role === 'provider' && (
              <p className="text-xs opacity-50 text-center">Provider accounts require superadmin approval before login is possible.</p>
            )}

            <p className="form-field text-center text-sm opacity-60">
              Already have an account? <Link to="/login" className="text-amber-500 font-medium hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;

