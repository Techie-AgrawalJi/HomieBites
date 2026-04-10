import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Instagram, Twitter, Linkedin, MessageSquarePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const Footer = () => {
  const { user } = useAuth();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    category: 'feature-request',
    title: '',
    message: '',
  });

  const openFeedbackModal = () => {
    if (!user) {
      toast.error('Please login to share platform feedback');
      return;
    }
    if (!['user', 'provider'].includes(user.role)) {
      toast.error('Only users and providers can share platform feedback');
      return;
    }
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackForm({ category: 'feature-request', title: '', message: '' });
  };

  const submitFeedback = async () => {
    const title = feedbackForm.title.trim();
    const message = feedbackForm.message.trim();

    if (title.length < 5) {
      toast.error('Please add a clearer title');
      return;
    }
    if (message.length < 15) {
      toast.error('Please share a bit more detail');
      return;
    }

    setSubmittingFeedback(true);
    try {
      await api.post('/platform-feedback', {
        category: feedbackForm.category,
        title,
        message,
      });
      toast.success('Thanks! Your feedback has been submitted.');
      closeFeedbackModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unable to submit feedback right now');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <>
      <footer className="glass border-t border-[var(--border)] mt-16 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
            <div className="md:col-span-5">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Building2 size={18} className="text-white" />
                </div>
                <span className="font-heading text-lg sm:text-xl font-bold">Homie<span className="text-amber-500">Bites</span></span>
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

            <div className="md:col-span-3">
              <h4 className="font-semibold mb-4">Explore</h4>
              <div className="flex flex-col gap-2">
                {[{ to: '/pg', label: 'PG Listings' }, { to: '/meals', label: 'Meal Services' }, { to: '/about-us', label: 'About Us' }, { to: '/signup', label: 'List Your Property' }, { to: '/login', label: 'Sign In' }].map(({ to, label }) => (
                  <Link key={to} to={to} className="text-sm opacity-60 hover:opacity-100 hover:text-amber-500 transition-all">{label}</Link>
                ))}
              </div>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm opacity-60"><Mail size={14} /> support@homiebites.com</div>
                <div className="flex items-center gap-2 text-sm opacity-60"><Phone size={14} /> +91 98765 XXXXX</div>
                <div className="flex items-center gap-2 text-sm opacity-60"><MapPin size={14} /> Agra, India</div>
                <button
                  type="button"
                  onClick={openFeedbackModal}
                  className="self-start mt-1 inline-flex items-center gap-2 px-3 py-2 text-sm glass rounded-lg hover:border-amber-500/60 hover:text-amber-500 transition-all"
                >
                  <MessageSquarePlus size={15} /> Share Platform Feedback
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-50">
            <p>© 2026 HomieBites. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="hover:opacity-100 hover:text-amber-500 transition-all">Privacy Policy</Link>
              <Link to="/terms-and-conditions" className="hover:opacity-100 hover:text-amber-500 transition-all">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </footer>

      {showFeedbackModal && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && closeFeedbackModal()}>
          <div className="w-full max-w-lg glass rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-xl font-semibold">Platform Feedback</h3>
              <button type="button" onClick={closeFeedbackModal} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm opacity-70 mb-4">Share missing features, bugs, or product suggestions for HomieBites. This feedback is separate from PG/Meal listing reviews.</p>

            <div className="space-y-3">
              <select
                value={feedbackForm.category}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
              >
                <option value="feature-request">Feature request</option>
                <option value="bug-report">Bug report</option>
                <option value="ux-feedback">UX feedback</option>
                <option value="other">Other</option>
              </select>

              <input
                value={feedbackForm.title}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Short title (e.g. Need saved searches)"
                className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
              />

              <textarea
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))}
                rows={5}
                placeholder="Describe what feels missing or what should be improved"
                className="w-full px-3 py-2 glass rounded-lg text-sm outline-none resize-none"
              />

              <button
                type="button"
                onClick={submitFeedback}
                disabled={submittingFeedback}
                className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Platform Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;

