import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { Users, Building2, BookOpen, ShieldCheck, Star, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { animateStatCards, animateCountUp } from '../animations/cardAnimations';
import { animateTabSwitch } from '../animations/pageTransitions';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'admins', label: 'Admins', icon: <ShieldCheck size={16} /> },
  { id: 'applications', label: 'Applications', icon: <ShieldCheck size={16} /> },
  { id: 'listing-requests', label: 'Listing Requests', icon: <AlertCircle size={16} /> },
  { id: 'providers', label: 'All Providers', icon: <Users size={16} /> },
  { id: 'listings', label: 'All Listings', icon: <Building2 size={16} /> },
  { id: 'bookings', label: 'All Bookings', icon: <BookOpen size={16} /> },
];

const AdminPanel = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState('applications');
  const [stats, setStats] = useState({ users: 0, providers: 0, pgListings: 0, mealServices: 0, bookings: 0 });
  const [applications, setApplications] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [listings, setListings] = useState<{ pgs: any[]; meals: any[] }>({ pgs: [], meals: [] });
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [listingRequests, setListingRequests] = useState<any[]>([]);
  const [feedbackModal, setFeedbackModal] = useState<{ id: string; action: 'reject' | 'revise' } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [detailsModal, setDetailsModal] = useState<any | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/providers/applications'),
      api.get('/admin/providers'),
      api.get('/admin/listings'),
      api.get('/bookings/all'),
      api.get('/admin/listing-requests?status=submitted,revision_requested'),
    ]).then(([s, a, p, l, b, lr]) => {
      setStats(s.data.data);
      setApplications(a.data.data);
      setProviders(p.data.data);
      setListings(l.data.data);
      setBookings(b.data.data);
      setListingRequests(lr.data.data?.requests || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useGSAP(() => {
    if (!loading && statsRef.current) {
      const cards = statsRef.current.querySelectorAll('.stat-card');
      animateStatCards(cards);
      cards.forEach((card) => {
        const numEl = card.querySelector('.stat-num');
        if (numEl) animateCountUp(numEl, parseInt(numEl.getAttribute('data-val') || '0'));
      });
    }
  }, [loading]);

  const switchTab = (newTab: string) => {
    animateTabSwitch(null, tabContentRef.current!);
    setTab(newTab);
  };

  const updateProvider = async (id: string, status: string, reason?: string) => {
    try {
      await api.patch(`/admin/providers/${id}/status`, { status, rejectionReason: reason });
      toast.success(`Provider ${status}`);
      const [a, p] = await Promise.all([api.get('/admin/providers/applications'), api.get('/admin/providers')]);
      setApplications(a.data.data);
      setProviders(p.data.data);
      setRejectingId('');
      setRejectionReason('');
    } catch { toast.error('Failed'); }
  };

  const toggleFeatured = async (type: string, id: string) => {
    try {
      await api.patch(`/admin/listings/${type}/${id}/featured`);
      toast.success('Featured toggled');
      const l = await api.get('/admin/listings');
      setListings(l.data.data);
    } catch { toast.error('Failed'); }
  };

  const approveListing = async (id: string) => {
    try {
      await api.patch(`/admin/listing-requests/${id}/approve`);
      toast.success('Listing approved');
      const lr = await api.get('/admin/listing-requests?status=submitted,revision_requested');
      setListingRequests(lr.data.data?.requests || []);
    } catch { toast.error('Failed'); }
  };

  const rejectListing = async (id: string) => {
    try {
      await api.patch(`/admin/listing-requests/${id}/reject`, { adminFeedback: feedbackText });
      toast.success('Listing rejected');
      const lr = await api.get('/admin/listing-requests?status=submitted,revision_requested');
      setListingRequests(lr.data.data?.requests || []);
      setFeedbackModal(null);
      setFeedbackText('');
    } catch { toast.error('Failed'); }
  };

  const requestRevisions = async (id: string) => {
    try {
      await api.patch(`/admin/listing-requests/${id}/revisions`, { adminFeedback: feedbackText });
      toast.success('Revision request sent');
      const lr = await api.get('/admin/listing-requests?status=submitted,revision_requested');
      setListingRequests(lr.data.data?.requests || []);
      setFeedbackModal(null);
      setFeedbackText('');
    } catch { toast.error('Failed'); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      suspended: 'bg-gray-500/20 text-gray-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || ''}`}>{status}</span>;
  };

  const parseArrayField = (value: any) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingAdmin) return;

    if (!newAdmin.name || !newAdmin.email || !newAdmin.phone || !newAdmin.city || !newAdmin.password || !newAdmin.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setCreatingAdmin(true);
    try {
      await api.post('/admin/admins', newAdmin);
      toast.success('New admin created');
      setNewAdmin({
        name: '',
        email: '',
        phone: '',
        city: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create admin';
      toast.error(message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto page-shell px-6 py-10">
      <div className="mb-8">
        <h1 className="font-heading page-title text-3xl font-bold">Admin Panel</h1>
        <p className="opacity-60 text-sm page-subtitle mt-1">Platform overview and management</p>
      </div>

      <div ref={statsRef} className="stats-grid grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Users', val: stats.users, icon: <Users size={18} />, color: 'text-blue-400' },
          { label: 'Providers', val: stats.providers, icon: <ShieldCheck size={18} />, color: 'text-green-400' },
          { label: 'PG Listings', val: stats.pgListings, icon: <Building2 size={18} />, color: 'text-amber-400' },
          { label: 'Meal Services', val: stats.mealServices, icon: <Star size={18} />, color: 'text-purple-400' },
          { label: 'Bookings', val: stats.bookings, icon: <BookOpen size={18} />, color: 'text-pink-400' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="stat-card glass rounded-2xl p-4">
            <div className={`mb-1 ${color}`}>{icon}</div>
            <div className="stat-num text-2xl font-bold font-heading" data-val={val}>0</div>
            <p className="text-xs opacity-60 mt-0.5">{label}</p>
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
        {tab === 'admins' && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">Create Admin</h3>
            <form onSubmit={createAdmin} className="glass rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={newAdmin.name}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                className="px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
              <input
                value={newAdmin.email}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                type="email"
                className="px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
              <input
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                className="px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
              <input
                value={newAdmin.city}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="City"
                className="px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
              <input
                value={newAdmin.password}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                type="password"
                className="px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
              <input
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                type="password"
                className="px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
              <div className="md:col-span-2 flex items-center justify-between gap-2 mt-1">
                <p className="text-xs opacity-60">Only superadmin accounts can create new admins.</p>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  {creatingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'applications' && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">Provider Applications ({applications.length})</h3>
            {applications.length === 0 ? (
              <div className="text-center py-12 opacity-50"><ShieldCheck size={40} className="mx-auto mb-3 text-amber-500" /><p>No pending applications</p></div>
            ) : (
              <div className="space-y-4">
                {applications.map((p) => (
                  <div key={p._id} className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-semibold">{p.businessName}</p>
                        <p className="text-sm opacity-60">{p.user?.name} · {p.user?.email}</p>
                        <p className="text-xs opacity-50">{p.city} · {p.serviceType}</p>
                        {statusBadge(p.status)}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => updateProvider(p._id, 'approved')} className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs hover:bg-green-600 transition-colors">Approve</button>
                        {rejectingId === p._id ? (
                          <div className="flex gap-2 items-center">
                            <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason..." className="px-2 py-1 glass rounded-lg text-xs outline-none w-32" />
                            <button onClick={() => updateProvider(p._id, 'rejected', rejectionReason)} className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs">Confirm</button>
                          </div>
                        ) : (
                          <button onClick={() => setRejectingId(p._id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs">Reject</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'listing-requests' && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">Listing Requests ({listingRequests.length})</h3>
            {listingRequests.length === 0 ? (
              <div className="text-center py-12 opacity-50"><AlertCircle size={40} className="mx-auto mb-3 text-amber-500" /><p>No pending requests</p></div>
            ) : (
              <div className="space-y-4">
                {listingRequests.map((request) => (
                  <div key={request._id} className="glass rounded-2xl p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs opacity-60 mb-1">Provider</p>
                        <p className="font-semibold">{request.provider?.businessName}</p>
                        <p className="text-xs opacity-60 mt-1">{request.provider?.businessEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-60 mb-1">Listing</p>
                        <p className="font-semibold">{request.submittedData?.name || request.submittedData?.providerName || 'Untitled'}</p>
                        <p className="text-xs opacity-60 mt-1">{request.listingType === 'pg' ? 'PG Listing' : 'Meal Service'}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {request.status === 'submitted' ? 'Submitted' : 'Changes Requested'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setDetailsModal(request)} className="px-3 py-1.5 bg-sky-500/20 text-sky-300 rounded-lg text-xs hover:bg-sky-500/30">View Details</button>
                        <button onClick={() => approveListing(request._id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors">Approve</button>
                        <button onClick={() => setFeedbackModal({ id: request._id, action: 'revise' })} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30">Request Changes</button>
                        <button onClick={() => setFeedbackModal({ id: request._id, action: 'reject' })} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">Reject</button>
                      </div>
                    </div>
                    {request.photos && request.photos[0] && (
                      <div className="mt-3 h-24 rounded-lg overflow-hidden">
                        <img src={request.photos[0]} alt="listing" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'providers' && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">All Providers ({providers.length})</h3>
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p._id} className="glass rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold">{p.businessName}</p>
                    <p className="text-xs opacity-60">{p.user?.email} · {p.city}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(p.status)}
                    {p.status === 'approved' && (
                      <button onClick={() => updateProvider(p._id, 'suspended')} className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs hover:bg-orange-500/30 transition-colors flex items-center gap-1">
                        <AlertTriangle size={12} /> Suspend
                      </button>
                    )}
                    {p.status === 'suspended' && (
                      <button onClick={() => updateProvider(p._id, 'approved')} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs hover:bg-green-500/30 transition-colors">Reinstate</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'listings' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xl font-bold mb-4">PG Listings ({listings.pgs?.length || 0})</h3>
              <div className="space-y-3">
                {listings.pgs?.map((pg) => (
                  <div key={pg._id} className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold">{pg.name}</p>
                      <p className="text-xs opacity-60">{pg.city} · ₹{pg.minPrice?.toLocaleString()}/mo</p>
                    </div>
                    <button onClick={() => toggleFeatured('pg', pg._id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${pg.featured ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}>
                      <Star size={12} /> {pg.featured ? 'Featured' : 'Feature'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold mb-4">Meal Services ({listings.meals?.length || 0})</h3>
              <div className="space-y-3">
                {listings.meals?.map((meal) => (
                  <div key={meal._id} className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold">{meal.providerName}</p>
                      <p className="text-xs opacity-60">{meal.city} · ₹{meal.minPrice?.toLocaleString()}/mo</p>
                    </div>
                    <button onClick={() => toggleFeatured('meal', meal._id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${meal.featured ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}>
                      <Star size={12} /> {meal.featured ? 'Featured' : 'Feature'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">All Bookings ({bookings.length})</h3>
            <div className="space-y-3 overflow-x-auto">
              <div className="md:min-w-[600px] space-y-3">
                {bookings.map((b) => (
                  <div key={b._id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{b.user?.name || 'User'}</p>
                      <p className="text-xs opacity-60">{b.listingType} · {b.bookingDetails?.roomType || b.bookingDetails?.planName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-amber-500">₹{b.paymentAmount?.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'paid' ? 'bg-green-500/20 text-green-400' : b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {feedbackModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFeedbackModal(null)}>
          <div className="glass rounded-2xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-bold mb-2">{feedbackModal.action === 'revise' ? 'Request Listing Changes' : 'Reject Listing'}</h3>
            <p className="text-xs opacity-70 mb-3">Add feedback so the provider knows what to fix.</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              placeholder="Write feedback..."
              className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setFeedbackModal(null); setFeedbackText(''); }} className="px-3 py-1.5 rounded-lg text-xs bg-gray-500/20 text-gray-300">Cancel</button>
              <button
                onClick={() => {
                  if (!feedbackModal.id) return;
                  if (!feedbackText.trim()) {
                    toast.error('Feedback is required');
                    return;
                  }
                  if (feedbackModal.action === 'revise') {
                    requestRevisions(feedbackModal.id);
                  } else {
                    rejectListing(feedbackModal.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs text-white ${feedbackModal.action === 'revise' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {feedbackModal.action === 'revise' ? 'Send Change Request' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailsModal(null)}>
          <div className="glass rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-heading text-xl font-bold">{detailsModal.submittedData?.name || detailsModal.submittedData?.providerName || 'Listing'}</h3>
                <p className="text-xs opacity-60 mt-1 capitalize">{detailsModal.listingType} listing request</p>
              </div>
              <button onClick={() => setDetailsModal(null)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="glass rounded-xl p-3">
                <p className="text-xs opacity-60">Provider</p>
                <p className="font-medium mt-1">{detailsModal.provider?.businessName}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs opacity-60">Status</p>
                <p className="font-medium mt-1 capitalize">{detailsModal.status?.replace('_', ' ')}</p>
              </div>
              <div className="glass rounded-xl p-3 md:col-span-2">
                <p className="text-xs opacity-60">Address</p>
                <p className="font-medium mt-1">{detailsModal.submittedData?.address || '-'}, {detailsModal.submittedData?.city || '-'}</p>
              </div>
              <div className="glass rounded-xl p-3 md:col-span-2">
                <p className="text-xs opacity-60">Description</p>
                <p className="font-medium mt-1">{detailsModal.submittedData?.description || 'No description provided'}</p>
              </div>
              {detailsModal.listingType === 'pg' ? (
                <>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs opacity-60">Gender</p>
                    <p className="font-medium mt-1 capitalize">{detailsModal.submittedData?.gender || '-'}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs opacity-60">Furnishing</p>
                    <p className="font-medium mt-1 capitalize">{detailsModal.submittedData?.furnishing || '-'}</p>
                  </div>
                  <div className="glass rounded-xl p-3 md:col-span-2">
                    <p className="text-xs opacity-60 mb-2">Room Types</p>
                    <div className="space-y-1">
                      {parseArrayField(detailsModal.submittedData?.roomTypes).map((room: any, idx: number) => (
                        <p key={`${room.type || 'room'}-${idx}`} className="text-xs">
                          {room.type || 'Room'}: ₹{Number(room.price || 0).toLocaleString()} | Available {room.availability ?? 0}/{room.total ?? 0}
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Plans</p>
                  <div className="space-y-1">
                    {parseArrayField(detailsModal.submittedData?.plans).map((plan: any, idx: number) => (
                      <p key={`${plan.name || 'plan'}-${idx}`} className="text-xs">
                        {plan.name || 'Plan'}: ₹{Number(plan.price || 0).toLocaleString()} | {plan.duration || '-'} | {plan.mealsPerDay || 0} meals/day
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {!!detailsModal.photos?.length && (
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {detailsModal.photos.map((photo: string, idx: number) => (
                      <img key={`${photo}-${idx}`} src={photo} alt="listing" className="w-full h-24 object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
