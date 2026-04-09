import React, { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/all';
import { Search, SlidersHorizontal, LocateFixed, UtensilsCrossed, X } from 'lucide-react';
import { animateCardsIn } from '../animations/cardAnimations';
import api from '../lib/axios';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import PGModal from '../components/PGModal';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

const MealServices = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [selectedPG, setSelectedPG] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [pgDetail, setPgDetail] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ city: '', dietType: '', mealTiming: '', planType: '', minPrice: '', maxPrice: '' });
  const [nearMe, setNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState('5000');
  const [showFilters, setShowFilters] = useState(false);
  const pendingFlipState = useRef<any>(null);
  const hasLoadedOnce = useRef(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters, page, limit: 12 };
      if (nearMe && userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = radius;
      }
      if (gridRef.current && hasLoadedOnce.current) {
        const cards = gridRef.current.querySelectorAll('.meal-listing-card');
        if (cards.length) pendingFlipState.current = Flip.getState(cards);
      }
      const res = await api.get('/meal', { params });
      setServices(res.data.data.services);
      setTotal(res.data.data.total);
    } catch {
      toast.error('Failed to load meal services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, [filters, page, nearMe, userLocation, radius]);

  useGSAP(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.meal-listing-card');
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
  }, [loading, services]);

  const handleNearMe = () => {
    if (nearMe) { setNearMe(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setNearMe(true); },
      () => toast.error('Location access denied')
    );
  };

  const openMeal = async (meal: any) => {
    setSelected(meal);
    try {
      const r = await api.get(`/meal/${meal._id}`);
      setDetail(r.data.data);
    } catch { setDetail(null); }
  };

  const openPG = async (pg: any) => {
    setSelectedPG(pg);
    try {
      const r = await api.get(`/pg/${pg._id}`);
      setPgDetail(r.data.data);
    } catch { setPgDetail(null); }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="max-w-7xl mx-auto page-shell px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="font-heading page-title text-3xl sm:text-4xl font-bold mb-2">Meal Services</h1>
        <p className="opacity-60 page-subtitle">Home-cooked nutritious meals delivered near your PG</p>
      </div>

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
          <button onClick={() => setFilters({ city: '', dietType: '', mealTiming: '', planType: '', minPrice: '', maxPrice: '' })} className="flex items-center gap-1 px-4 py-2.5 glass rounded-full text-sm text-red-400">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="glass rounded-2xl p-5 mb-6 filters-panel grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={filters.dietType} onChange={(e) => setFilters({ ...filters, dietType: e.target.value })} className="px-3 py-2 glass rounded-xl text-sm outline-none">
            <option value="">Diet Type</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Non-Vegetarian">Non-Vegetarian</option>
            <option value="Vegan">Vegan</option>
            <option value="Keto">Keto</option>
          </select>
          <select value={filters.mealTiming} onChange={(e) => setFilters({ ...filters, mealTiming: e.target.value })} className="px-3 py-2 glass rounded-xl text-sm outline-none">
            <option value="">Meal Timing</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </select>
          <select value={filters.planType} onChange={(e) => setFilters({ ...filters, planType: e.target.value })} className="px-3 py-2 glass rounded-xl text-sm outline-none">
            <option value="">Plan Type</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input type="number" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} placeholder="Min price/month" className="px-3 py-2 glass rounded-xl text-sm outline-none" />
          <input type="number" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} placeholder="Max price/month" className="px-3 py-2 glass rounded-xl text-sm outline-none" />
        </div>
      )}

      <p className="text-sm opacity-50 mb-4">{total} services found</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <UtensilsCrossed size={48} className="mx-auto mb-4 text-amber-500" />
          <p className="font-heading text-xl">No meal services found</p>
          <p className="text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {services.map((meal) => (
            <div key={meal._id} className="meal-listing-card">
              <MealCard meal={meal} onViewDetails={openMeal} />
            </div>
          ))}
        </div>
      )}

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
        <MealModal meal={selected} detail={detail} onClose={() => { setSelected(null); setDetail(null); }} onViewPG={openPG} />
      )}
      {selectedPG && (
        <PGModal pg={selectedPG} detail={pgDetail} onClose={() => { setSelectedPG(null); setPgDetail(null); }} onViewMeal={openMeal} />
      )}
    </div>
  );
};

export default MealServices;
