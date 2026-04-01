import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { Building2, Users, Clock, List, Plus, UtensilsCrossed, MapPin, Trash2, LocateFixed, CreditCard } from 'lucide-react';
import { animateStatCards, animateCountUp } from '../animations/cardAnimations';
import { animateTabSwitch } from '../animations/pageTransitions';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'requests', label: 'Requests', icon: <Clock size={16} /> },
  { id: 'listings', label: 'My Listings', icon: <List size={16} /> },
  { id: 'users', label: 'My Users', icon: <Users size={16} /> },
  { id: 'payments', label: 'Payment Settings', icon: <CreditCard size={16} /> },
  { id: 'add', label: 'Add Listing', icon: <Plus size={16} /> },
  { id: 'profile', label: 'Profile', icon: <Users size={16} /> },
];

const ProviderDashboard = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [bookings, setBookings] = useState<any[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [pgListings, setPgListings] = useState<any[]>([]);
  const [mealListings, setMealListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingType, setListingType] = useState<'pg' | 'meal'>('pg');
  const [addLoading, setAddLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>({});
  const [pgForm, setPgForm] = useState({ name: '', description: '', address: '', city: '', gender: 'male', furnishing: 'furnished', contactName: '', contactPhone: '', amenities: '', rules: '', tags: '', latitude: '', longitude: '' });
  const [mealForm, setMealForm] = useState({ providerName: '', description: '', address: '', city: '', cuisines: '', dietTypes: '', mealTimings: '', deliveryRadius: '3', contactPhone: '', latitude: '', longitude: '' });

  const fetchListings = async (providerId: string) => {
    setListingsLoading(true);
    try {
      const [pgRes, mealRes] = await Promise.all([
        api.get(`/pg/provider/${providerId}`),
        api.get(`/meal/provider/${providerId}`),
      ]);
      setPgListings(pgRes.data.data || []);
      setMealListings(mealRes.data.data || []);
    } catch {
      setPgListings([]);
      setMealListings([]);
    } finally {
      setListingsLoading(false);
    }
  };

  useEffect(() => {
    api.get('/auth/me').then((r) => {
      const prov = r.data.data.provider;
      setProvider(prov);
      if (prov?.paymentSettings) setPaymentSettings(prov.paymentSettings);
      if (prov) {
        api.get(`/bookings/provider/${prov._id}`).then((rb) => setBookings(rb.data.data)).catch(() => {});
        fetchListings(prov._id);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalListings = pgListings.length + mealListings.length;

  const stats = {
    total: totalListings,
    requests: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    users: new Set(bookings.map((b) => b.user?._id)).size,
  };
  const myUsers = Array.from(new Map(bookings.filter((b) => b.user?._id).map((b) => [b.user._id, b.user])).values());

  useGSAP(() => {
    if (!loading && statsRef.current) {
      const cards = statsRef.current.querySelectorAll('.stat-card');
      animateStatCards(cards);
      cards.forEach((card) => {
        const numEl = card.querySelector('.stat-num');
        if (numEl) animateCountUp(numEl, parseInt(numEl.getAttribute('data-val') || '0'));
      });
    }
  }, [loading, totalListings]);

  const switchTab = (newTab: string) => {
    animateTabSwitch(null, tabContentRef.current!);
    setTab(newTab);
  };

  const updateStatus = async (id: string, status: string, paymentAmount?: number) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status, paymentAmount });
      toast.success(`Booking ${status}`);
      const r = await api.get(`/bookings/provider/${provider._id}`);
      setBookings(r.data.data);
    } catch { toast.error('Failed to update'); }
  };

  const handleDeletePG = async (id: string) => {
    if (!window.confirm('Delete this PG listing?')) return;
    try {
      await api.delete(`/pg/${id}`);
      setPgListings((prev) => prev.filter((p) => p._id !== id));
      toast.success('PG listing deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!window.confirm('Delete this meal service?')) return;
    try {
      await api.delete(`/meal/${id}`);
      setMealListings((prev) => prev.filter((m) => m._id !== id));
      toast.success('Meal service deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const getLocation = (setter: any) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setter((f: any) => ({ ...f, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() })); toast.success('Location auto-filled!'); },
      () => toast.error('Location access denied')
    );
  };

  const handleAddPG = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/pg', { ...pgForm, roomTypes: JSON.stringify([{ type: 'Single', price: 10000, availability: 2, total: 3 }]) });
      toast.success('PG listing created!');
      setPgForm({ name: '', description: '', address: '', city: '', gender: 'male', furnishing: 'furnished', contactName: '', contactPhone: '', amenities: '', rules: '', tags: '', latitude: '', longitude: '' });
      if (provider) await fetchListings(provider._id);
      switchTab('listings');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed');
    } finally { setAddLoading(false); }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/meal', { ...mealForm, plans: JSON.stringify([{ name: 'Basic', price: 3000, duration: '1 Month', mealsPerDay: 2 }]) });
      toast.success('Meal service created!');
      setMealForm({ providerName: '', description: '', address: '', city: '', cuisines: '', dietTypes: '', mealTimings: '', deliveryRadius: '3', contactPhone: '', latitude: '', longitude: '' });
      if (provider) await fetchListings(provider._id);
      switchTab('listings');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed');
    } finally { setAddLoading(false); }
  };

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    approved: 'text-green-400',
    rejected: 'text-red-400',
    paid: 'text-blue-400',
  };

  const savePaymentSettings = () => {
    api.patch('/auth/provider/payment-settings', paymentSettings)
      .then(() => toast.success('Payment settings saved'))
      .catch(() => toast.error('Failed to save payment settings'));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Provider Dashboard</h1>
        <p className="opacity-60 text-sm mt-1">{provider?.businessName}</p>
      </div>

      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Listings', val: stats.total, icon: <Building2 size={20} />, color: 'text-blue-400' },
          { label: 'Total Requests', val: stats.requests, icon: <List size={20} />, color: 'text-amber-400' },
          { label: 'Pending', val: stats.pending, icon: <Clock size={20} />, color: 'text-yellow-400' },
          { label: 'Unique Users', val: stats.users, icon: <Users size={20} />, color: 'text-green-400' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="stat-card glass rounded-2xl p-5">
            <div className={`mb-2 ${color}`}>{icon}</div>
            <div className="stat-num text-2xl font-bold font-heading" data-val={val}>0</div>
            <p className="text-xs opacity-60 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => switchTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === id ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      <div ref={tabContentRef}>
        {tab === 'requests' && (
          <div>
            {bookings.length === 0 ? (
              <div className="text-center py-16 opacity-50"><Clock size={40} className="mx-auto mb-3 text-amber-500" /><p>No booking requests yet</p></div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b._id} className="request-card glass rounded-2xl p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-semibold">{b.user?.name || 'User'}</p>
                        <p className="text-xs opacity-60">{b.user?.email} · {b.user?.phone}</p>
                        <p className="text-sm opacity-70 mt-1">{b.bookingDetails?.roomType || b.bookingDetails?.planName} · {b.listingType}</p>
                        {b.bookingDetails?.message && <p className="text-xs opacity-50 italic mt-1">"{b.bookingDetails.message}"</p>}
                      </div>
                      <div className="text-right space-y-2">
                        <p className={`text-sm font-medium ${statusColors[b.status] || ''}`}>{b.status}</p>
                        {b.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => updateStatus(b._id, 'approved', b.paymentAmount || 10000)} className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs hover:bg-green-600 transition-colors">Approve</button>
                            <button onClick={() => updateStatus(b._id, 'rejected')} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs hover:bg-red-500/30 transition-colors">Reject</button>
                          </div>
                        )}
                        <p className="text-xs text-amber-500 font-medium">₹{b.paymentAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'listings' && (
          <div>
            {listingsLoading ? (
              <div className="text-center py-16 opacity-50"><p>Loading listings...</p></div>
            ) : (pgListings.length === 0 && mealListings.length === 0) ? (
              <div className="text-center py-16 opacity-50">
                <Building2 size={40} className="mx-auto mb-3 text-amber-500" />
                <p className="font-medium">No listings yet</p>
                <p className="text-sm mt-1">Use the "Add Listing" tab to create your first listing</p>
                <button onClick={() => switchTab('add')} className="mt-4 px-5 py-2 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors">
                  <Plus size={14} className="inline mr-1" />Add Listing
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {pgListings.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
                      <Building2 size={18} className="text-amber-500" /> PG Listings ({pgListings.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pgListings.map((pg) => (
                        <div key={pg._id} className="glass rounded-2xl overflow-hidden">
                          <div className="relative h-36">
                            <img
                              src={pg.photos?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400'}
                              alt={pg.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <button
                              onClick={() => handleDeletePG(pg._id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                            <div className="absolute bottom-2 left-3">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${pg.verified ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'}`}>
                                {pg.verified ? 'Verified' : 'Pending Verification'}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-sm">{pg.name}</p>
                            <p className="text-xs opacity-50 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />{pg.address}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-amber-500 font-bold text-sm">₹{pg.minPrice?.toLocaleString()}/mo</span>
                              <span className="text-xs opacity-50 capitalize">{pg.gender}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mealListings.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
                      <UtensilsCrossed size={18} className="text-amber-500" /> Meal Services ({mealListings.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mealListings.map((meal) => (
                        <div key={meal._id} className="glass rounded-2xl overflow-hidden">
                          <div className="relative h-36">
                            <img
                              src={meal.photos?.[0] || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'}
                              alt={meal.providerName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <button
                              onClick={() => handleDeleteMeal(meal._id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                            <div className="absolute bottom-2 left-3">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${meal.verified ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'}`}>
                                {meal.verified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-sm">{meal.providerName}</p>
                            <p className="text-xs opacity-50 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />{meal.address}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-amber-500 font-bold text-sm">₹{meal.minPrice?.toLocaleString()}/mo</span>
                              <span className="text-xs opacity-50">{meal.dietTypes?.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setListingType('pg')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === 'pg' ? 'bg-amber-500 text-white' : 'glass'}`}>PG Listing</button>
              <button onClick={() => setListingType('meal')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === 'meal' ? 'bg-amber-500 text-white' : 'glass'}`}>Meal Service</button>
            </div>

            {listingType === 'pg' ? (
              <form onSubmit={handleAddPG} className="glass rounded-2xl p-6 space-y-4 max-w-2xl">
                <h3 className="font-heading text-xl font-bold">Add PG Listing</h3>
                {[
                  { key: 'name', label: 'PG Name', placeholder: 'Koramangala Premium PG' },
                  { key: 'address', label: 'Address', placeholder: 'Street, Area, City' },
                  { key: 'city', label: 'City', placeholder: 'Bangalore' },
                  { key: 'contactName', label: 'Contact Name', placeholder: 'Your Name' },
                  { key: 'contactPhone', label: 'Contact Phone', placeholder: '+91 98765 43210' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium opacity-70 mb-1 block">{label}</label>
                    <input value={(pgForm as any)[key]} onChange={(e) => setPgForm({ ...pgForm, [key]: e.target.value })} placeholder={placeholder} className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" required />
                  </div>
                ))}
                <textarea value={pgForm.description} onChange={(e) => setPgForm({ ...pgForm, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">Gender</label>
                    <select value={pgForm.gender} onChange={(e) => setPgForm({ ...pgForm, gender: e.target.value })} className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">Furnishing</label>
                    <select value={pgForm.furnishing} onChange={(e) => setPgForm({ ...pgForm, furnishing: e.target.value })} className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none">
                      <option value="furnished">Furnished</option>
                      <option value="semi-furnished">Semi-furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">Location Coordinates</label>
                  <div className="flex gap-2">
                    <input value={pgForm.latitude} onChange={(e) => setPgForm({ ...pgForm, latitude: e.target.value })} placeholder="Latitude" className="flex-1 px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                    <input value={pgForm.longitude} onChange={(e) => setPgForm({ ...pgForm, longitude: e.target.value })} placeholder="Longitude" className="flex-1 px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                    <button type="button" onClick={() => getLocation(setPgForm)} className="px-3 py-2.5 bg-amber-500/10 text-amber-500 rounded-xl"><LocateFixed size={16} /></button>
                  </div>
                </div>
                <button type="submit" disabled={addLoading} className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60">
                  {addLoading ? 'Creating...' : 'Create PG Listing'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddMeal} className="glass rounded-2xl p-6 space-y-4 max-w-2xl">
                <h3 className="font-heading text-xl font-bold">Add Meal Service</h3>
                {[
                  { key: 'providerName', label: 'Service Name', placeholder: 'Sharma Kitchen' },
                  { key: 'address', label: 'Address', placeholder: 'Street, Area, City' },
                  { key: 'city', label: 'City', placeholder: 'Bangalore' },
                  { key: 'contactPhone', label: 'Contact Phone', placeholder: '+91 98765 43210' },
                  { key: 'cuisines', label: 'Cuisines (comma-separated)', placeholder: 'North Indian, Punjabi' },
                  { key: 'dietTypes', label: 'Diet Types (comma-separated)', placeholder: 'Vegetarian, Vegan' },
                  { key: 'mealTimings', label: 'Meal Timings (comma-separated)', placeholder: 'Breakfast, Lunch, Dinner' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium opacity-70 mb-1 block">{label}</label>
                    <input value={(mealForm as any)[key]} onChange={(e) => setMealForm({ ...mealForm, [key]: e.target.value })} placeholder={placeholder} className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                  </div>
                ))}
                <textarea value={mealForm.description} onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none resize-none" />
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">Location Coordinates</label>
                  <div className="flex gap-2">
                    <input value={mealForm.latitude} onChange={(e) => setMealForm({ ...mealForm, latitude: e.target.value })} placeholder="Latitude" className="flex-1 px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                    <input value={mealForm.longitude} onChange={(e) => setMealForm({ ...mealForm, longitude: e.target.value })} placeholder="Longitude" className="flex-1 px-3 py-2.5 glass rounded-xl text-sm outline-none" />
                    <button type="button" onClick={() => getLocation(setMealForm)} className="px-3 py-2.5 bg-amber-500/10 text-amber-500 rounded-xl"><LocateFixed size={16} /></button>
                  </div>
                </div>
                <button type="submit" disabled={addLoading} className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60">
                  {addLoading ? 'Creating...' : 'Create Meal Service'}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div>
            {myUsers.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <Users size={40} className="mx-auto mb-3 text-amber-500" />
                <p>No users yet</p>
                <p className="text-sm mt-1">Approved and paid requests will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myUsers.map((u: any) => {
                  const userBookings = bookings.filter((b) => b.user?._id === u._id);
                  return (
                    <div key={u._id} className="glass rounded-2xl p-4">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs opacity-60 mt-0.5">{u.email}</p>
                      <p className="text-xs opacity-60">{u.phone}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Total: {userBookings.length}</span>
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">Paid: {userBookings.filter((b) => b.paymentStatus === 'paid').length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="glass rounded-2xl p-6 max-w-2xl space-y-4">
            <h3 className="font-heading text-xl font-bold">Payment Settings</h3>
            <p className="text-sm opacity-60">Set your preferred payment details for approved bookings.</p>

            <div>
              <label className="text-xs font-medium opacity-70 mb-1 block">UPI ID</label>
              <input value={paymentSettings.upiId || ''} onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })} placeholder="name@bank" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">Account Holder</label>
                <input value={paymentSettings.accountHolder || ''} onChange={(e) => setPaymentSettings({ ...paymentSettings, accountHolder: e.target.value })} placeholder="Account holder name" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">Bank Name</label>
                <input value={paymentSettings.bankName || ''} onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })} placeholder="Bank name" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium opacity-70 mb-1 block">Account Number</label>
              <input value={paymentSettings.accountNumber || ''} onChange={(e) => setPaymentSettings({ ...paymentSettings, accountNumber: e.target.value })} placeholder="Account number" className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none" />
            </div>

            <button onClick={savePaymentSettings} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
              Save Payment Settings
            </button>
          </div>
        )}

        {tab === 'profile' && (
          <div className="glass rounded-2xl p-6 max-w-md">
            <h3 className="font-heading text-xl font-bold mb-4">Provider Profile</h3>
            {provider && (
              <div className="space-y-3">
                {[
                  { label: 'Business Name', val: provider.businessName },
                  { label: 'Status', val: provider.status },
                  { label: 'Service Type', val: provider.serviceType },
                  { label: 'City', val: provider.city },
                  { label: 'Business Email', val: provider.businessEmail },
                  { label: 'Business Phone', val: provider.businessPhone },
                ].map(({ label, val }) => (
                  <div key={label} className="glass rounded-xl p-3">
                    <p className="text-xs opacity-50">{label}</p>
                    <p className="font-medium mt-0.5 capitalize">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
