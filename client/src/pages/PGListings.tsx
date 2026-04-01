import React, { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/all';
import { Search, SlidersHorizontal, MapPin, LocateFixed, X } from 'lucide-react';
import { animateCardsIn } from '../animations/cardAnimations';
import api from '../lib/axios';
import PGCard from '../components/PGCard';
import PGModal from '../components/PGModal';
import MealModal from '../components/MealModal';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

const PGListings = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [mealDetail, setMealDetail] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ city: '', gender: '', furnishing: '', minBudget: '', maxBudget: '', roomType: '' });
  const [nearMe, setNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState('5000');
  const [showFilters, setShowFilters] = useState(false);
  const pendingFlipState = useRef<any>(null);
  const hasLoadedOnce = useRef(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters, page, limit: 12 };
      if (nearMe && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = radius;
      }
      if (gridRef.current && hasLoadedOnce.current) {
        const cards = gridRef.current.querySelectorAll('.pg-listing-card');
        if (cards.length) pendingFlipState.current = Flip.getState(cards);
      }
      const res = await api.get('/pg', { params });
      setListings(res.data.data.listings);
      setTotal(res.data.data.total);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, [filters, page, nearMe, userLocation, radius]);

  useGSAP(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.pg-listing-card');
      if (!cards.length) return;

      // Keep first paint stable on refresh: render cards fully visible without intro tween.
      if (!hasLoadedOnce.current) {
        cards.forEach((card) => {
          (card as HTMLElement).style.opacity = '1';
          (card as HTMLElement).style.transform = 'none';
        });
        hasLoadedOnce.current = true;
        pendingFlipState.current = null;
        return;
      }

      if (pendingFlipState.current && cards.length) {
        Flip.from(pendingFlipState.current, {
          targets: cards,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.03,
          absolute: true,
          onComplete: () => gsap.set(cards, { clearProps: 'opacity,transform' }),
        });
        pendingFlipState.current = null;
      } else {
        animateCardsIn(cards);
      }
      hasLoadedOnce.current = true;
    }
  }, [loading, listings]);

  const handleNearMe = () => {
    if (nearMe) { setNearMe(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setNearMe(true); },
      () => toast.error('Location access denied')
    );
  };

  const openPG = async (pg: any) => {
    setSelected(pg);
    try {
      const r = await api.get(`/pg/${pg._id}`);
      setDetail(r.data.data);
    } catch { setDetail(null); }
  };

  const openMeal = async (meal: any) => {
    setSelectedMeal(meal);
    try {
      const r = await api.get(`/meal/${meal._id}`);
      setMealDetail(r.data.data);
    } catch { setMealDetail(null); }
  };

  const clearFilters = () => setFilters({ city: '', gender: '', furnishing: '', minBudget: '', maxBudget: '', roomType: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="max-w-7xl mx-auto page-shell px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="font-heading page-title text-3xl sm:text-4xl font-bold mb-2">PG Listings</h1>
        <p className="opacity-60 page-subtitle">Find verified PG accommodations across India</p>
      </div>

      {/* Controls */}
      <div className="filters-bar mb-6">
        <div className="flex-1 min-w-60 flex items-center gap-2 glass rounded-full px-4 py-2.5">
          <Search size={16} className="opacity-50" />
          <input value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} placeholder="Search city..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 glass rounded-full text-sm ${showFilters ? 'border-amber-500/60 text-amber-500' : ''}`}>
          <SlidersHorizontal size={16} /> Filters {hasFilters && '•'}
        </button>
        <button onClick={handleNearMe} className={`flex items-center gap-2 px-4 py-2.5 glass rounded-full text-sm ${nearMe ? 'bg-amber-500 text-white border-transparent' : ''}`}>
          <LocateFixed size={16} /> {nearMe ? 'Near Me ✓' : 'Near Me'}
        </button>
        {nearMe && (
          <select value={radius} onChange={(e) => setRadius(e.target.value)} className="px-3 py-2.5 glass rounded-full text-sm outline-none">
            <option value="1000">1 km</option>
            <option value="2000">2 km</option>
            <option value="5000">5 km</option>
            <option value="10000">10 km</option>
          </select>
        )}
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-4 py-2.5 glass rounded-full text-sm text-red-400">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="glass rounded-2xl p-5 mb-6 filters-panel grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })} className="px-3 py-2 glass rounded-xl text-sm outline-none col-span-1">
            <option value="">Any Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unisex">Unisex</option>
          </select>
          <select value={filters.furnishing} onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })} className="px-3 py-2 glass rounded-xl text-sm outline-none">
            <option value="">Furnishing</option>
            <option value="furnished">Furnished</option>
            <option value="semi-furnished">Semi-furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
          <input value={filters.roomType} onChange={(e) => setFilters({ ...filters, roomType: e.target.value })} placeholder="Room type" className="px-3 py-2 glass rounded-xl text-sm outline-none" />
          <input type="number" value={filters.minBudget} onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })} placeholder="Min budget" className="px-3 py-2 glass rounded-xl text-sm outline-none" />
          <input type="number" value={filters.maxBudget} onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })} placeholder="Max budget" className="px-3 py-2 glass rounded-xl text-sm outline-none" />
        </div>
      )}

      <p className="text-sm opacity-50 mb-4">{total} listings found</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <MapPin size={48} className="mx-auto mb-4 text-amber-500" />
          <p className="font-heading text-xl">No listings found</p>
          <p className="text-sm mt-2">Try different filters or expand your search area</p>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {listings.map((pg) => (
            <div key={pg._id} className="pg-listing-card">
              <PGCard pg={pg} onViewDetails={openPG} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: Math.ceil(total / 12) }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${page === i + 1 ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <PGModal pg={selected} detail={detail} onClose={() => { setSelected(null); setDetail(null); }} onViewMeal={openMeal} />
      )}
      {selectedMeal && (
        <MealModal meal={selectedMeal} detail={mealDetail} onClose={() => { setSelectedMeal(null); setMealDetail(null); }} onViewPG={openPG} />
      )}
    </div>
  );
};

export default PGListings;
