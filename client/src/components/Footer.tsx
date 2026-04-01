import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Instagram, Twitter, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Subscribed! Welcome to NestEase newsletter.');
    setEmail('');
  };

  return (
    <footer className="glass border-t border-white/10 mt-16 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="font-heading text-lg sm:text-xl font-bold">Nest<span className="text-amber-500">Ease</span></span>
            </Link>
            <p className="text-sm opacity-60 mb-4 leading-relaxed">Find your perfect stay and meal, anywhere you go. Connecting students and professionals with trusted PG and meal providers.</p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                <button key={i} className="p-2 glass rounded-full hover:border-amber-500/50 hover:text-amber-500 transition-all">
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <div className="flex flex-col gap-2">
              {[{ to: '/pg', label: 'PG Listings' }, { to: '/meals', label: 'Meal Services' }, { to: '/signup', label: 'List Your Property' }, { to: '/login', label: 'Sign In' }].map(({ to, label }) => (
                <Link key={to} to={to} className="text-sm opacity-60 hover:opacity-100 hover:text-amber-500 transition-all">{label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm opacity-60"><Mail size={14} /> support@nestease.com</div>
              <div className="flex items-center gap-2 text-sm opacity-60"><Phone size={14} /> +91 98765 43210</div>
              <div className="flex items-center gap-2 text-sm opacity-60"><MapPin size={14} /> Bangalore, India</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm opacity-60 mb-3">Get the latest listings and deals in your inbox.</p>
            <form onSubmit={handleNewsletter} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 glass rounded-lg text-sm outline-none focus:border-amber-500/50 transition-colors"
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-50">
          <p>© 2024 NestEase. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:opacity-100 hover:text-amber-500 transition-all">Privacy Policy</a>
            <a href="#" className="hover:opacity-100 hover:text-amber-500 transition-all">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
