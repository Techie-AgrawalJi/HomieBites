import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { BookOpen, Clock, CheckCircle, Bookmark, User, CreditCard, MapPin, Star, X, UtensilsCrossed } from 'lucide-react';
import { animateStatCards, animateCountUp } from '../animations/cardAnimations';
import { animateTabSwitch } from '../animations/pageTransitions';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

declare global { interface Window { Razorpay: any; } }

const TABS = [
  { id: 'bookings', label: 'My Bookings', icon: <BookOpen size={16} /> },
  { id: 'subscriptions', label: 'My Subscriptions', icon: <UtensilsCrossed size={16} /> },
  { id: 'saved', label: 'Saved Listings', icon: <Bookmark size={16} /> },
  { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
];

const UserDashboard = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const subscriptions = bookings.filter((b) => b.listingType === 'meal');

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'approved').length,
    paid: bookings.filter((b) => b.status === 'paid').length,
  };

  useEffect(() => {
    api.get('/bookings/my').then((r) => setBookings(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchSavedListings = async () => {
    setSavedLoading(true);
    try {
      const r = await api.get('/auth/saved-listings');
      setSavedListings(r.data.data || []);
    } catch {
      setSavedListings([]);
    } finally {
      setSavedLoading(false);
    }
  };

  useGSAP(() => {
    if (!loading && statsRef.current) {
      const cards = statsRef.current.querySelectorAll('.stat-card');
      animateStatCards(cards);
      cards.forEach((card) => {
        const numEl = card.querySelector('.stat-num');
        if (numEl) {
          const val = parseInt(numEl.getAttribute('data-val') || '0');
          animateCountUp(numEl, val);
        }
      });
    }
  }, [loading]);

  const switchTab = (newTab: string) => {
    animateTabSwitch(null, tabContentRef.current!);
    setTab(newTab);
    if (newTab === 'saved') fetchSavedListings();
  };

  const handleUnsave = async (listingId: string) => {
    try {
      await api.post(`/pg/${listingId}/save`);
      setSavedListings((prev) => prev.filter((l) => l._id !== listingId));
      toast.success('Removed from saved');
    } catch { toast.error('Failed to remove'); }
  };

  const handlePay = async (booking: any) => {
    try {
      const orderRes = await api.post('/payments/create-order', { bookingId: booking._id });
      const { orderId, amount, currency } = orderRes.data.data;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'HomieBites',
        description: 'Booking Payment',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              bookingId: booking._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful! Booking confirmed.');
            const r = await api.get('/bookings/my');
            setBookings(r.data.data);
          } catch { toast.error('Payment verification failed'); }
        },
        theme: { color: '#f59e0b' },
      };
      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error('Razorpay not loaded. Please check your key.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    approved: 'bg-green-500/20 text-green-600 dark:text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    paid: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    completed: 'bg-purple-500/20 text-purple-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="max-w-5xl mx-auto page-shell px-6 py-10">
      <div className="mb-8">
        <h1 className="font-heading page-title text-3xl font-bold">Welcome, {user?.name?.split(' ')[0]}!</h1>
        <p className="opacity-60 text-sm page-subtitle mt-1">Manage your bookings and saved listings</p>
      </div>

      <div ref={statsRef} className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings', val: stats.total, icon: <BookOpen size={20} />, color: 'text-blue-400' },
          { label: 'Pending', val: stats.pending, icon: <Clock size={20} />, color: 'text-yellow-400' },
          { label: 'Approved', val: stats.approved, icon: <CheckCircle size={20} />, color: 'text-green-400' },
          { label: 'Paid', val: stats.paid, icon: <CreditCard size={20} />, color: 'text-purple-400' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="stat-card glass rounded-2xl p-5">
            <div className={`mb-2 ${color}`}>{icon}</div>
            <div className="stat-num text-2xl font-bold font-heading" data-val={val}>0</div>
            <p className="text-xs opacity-60 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="tabs-scroll mb-6">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => switchTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === id ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      <div ref={tabContentRef}>
        {tab === 'bookings' && (
          loading ? <p className="opacity-50">Loading bookings...</p> :
          bookings.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <BookOpen size={40} className="mx-auto mb-3 text-amber-500" />
              <p>No bookings yet. Browse listings to make your first booking!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b._id} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || ''}`}>{b.status}</span>
                        <span className="text-xs opacity-50 capitalize">{b.listingType} booking</span>
                      </div>
                      <p className="text-sm opacity-60">{b.bookingDetails?.roomType || b.bookingDetails?.planName || 'Booking'}</p>
                      {b.bookingDetails?.message && <p className="text-xs opacity-40 mt-1">"{b.bookingDetails.message}"</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-500">₹{b.paymentAmount?.toLocaleString()}</p>
                      <p className="text-xs opacity-50">{new Date(b.createdAt).toLocaleDateString()}</p>
                      {b.status === 'approved' && b.paymentStatus !== 'paid' && (
                        <button onClick={() => handlePay(b)} className="mt-2 px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 transition-colors flex items-center gap-1">
                          <CreditCard size={12} /> Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'saved' && (
          savedLoading ? (
            <p className="opacity-50">Loading saved listings...</p>
          ) : savedListings.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <Bookmark size={40} className="mx-auto mb-3 text-amber-500" />
              <p className="font-medium">No saved listings yet</p>
              <p className="text-sm mt-1">Click the bookmark icon on any PG listing to save it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedListings.map((pg) => (
                <div key={pg._id} className="glass rounded-2xl overflow-hidden group">
                  <div className="relative h-40">
                    <img
                      src={pg.photos?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400'}
                      alt={pg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <button
                      onClick={() => handleUnsave(pg._id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-red-500/80 transition-colors"
                      title="Remove from saved"
                    >
                      <X size={13} />
                    </button>
                    {pg.verified && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 bg-green-500/90 text-white text-xs rounded-full">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm leading-tight">{pg.name}</p>
                      <div className="flex items-center gap-0.5 text-amber-400 shrink-0 ml-2">
                        <Star size={11} fill="currentColor" />
                        <span className="text-xs">{pg.averageRating?.toFixed(1) || '4.0'}</span>
                      </div>
                    </div>
                    <p className="text-xs opacity-50 flex items-center gap-1 truncate">
                      <MapPin size={10} />{pg.address}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-amber-500 font-bold text-sm">₹{pg.minPrice?.toLocaleString()}<span className="text-xs font-normal opacity-60">/mo</span></span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pg.gender === 'male' ? 'bg-blue-500/20 text-blue-400' : pg.gender === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {pg.gender === 'male' ? '♂ Male' : pg.gender === 'female' ? '♀ Female' : '⚧ Unisex'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'subscriptions' && (
          loading ? <p className="opacity-50">Loading subscriptions...</p> :
          subscriptions.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <UtensilsCrossed size={40} className="mx-auto mb-3 text-amber-500" />
              <p>No subscriptions yet. Explore meal services to start one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((s) => (
                <div key={s._id} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] || ''}`}>{s.status}</span>
                        <span className="text-xs opacity-50">Meal subscription</span>
                      </div>
                      <p className="text-sm opacity-70">{s.bookingDetails?.planName || 'Plan'} · {s.bookingDetails?.duration || 'Duration not specified'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-500">₹{s.paymentAmount?.toLocaleString()}</p>
                      <p className="text-xs opacity-50">{new Date(s.createdAt).toLocaleDateString()}</p>
                      {s.status === 'approved' && s.paymentStatus !== 'paid' && (
                        <button onClick={() => handlePay(s)} className="mt-2 px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 transition-colors flex items-center gap-1">
                          <CreditCard size={12} /> Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'profile' && (
          <div className="glass rounded-2xl p-6 max-w-md">
            <h3 className="font-heading text-xl font-bold mb-4">Profile</h3>
            <div className="space-y-3">
              {[
                { label: 'Name', val: user?.name },
                { label: 'Email', val: user?.email },
                { label: 'City', val: user?.city },
                { label: 'Role', val: user?.role },
              ].map(({ label, val }) => (
                <div key={label} className="glass rounded-xl p-3">
                  <p className="text-xs opacity-50">{label}</p>
                  <p className="font-medium mt-0.5 capitalize">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

