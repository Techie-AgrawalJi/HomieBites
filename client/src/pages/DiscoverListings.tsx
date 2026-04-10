import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/all';
import { Search, LocateFixed, MapPin, ArrowLeft, Building2, UtensilsCrossed } from 'lucide-react';
import { animateCardsIn } from '../animations/cardAnimations';
import api from '../lib/axios';
import PGCard from '../components/PGCard';
import MealCard from '../components/MealCard';
import PGModal from '../components/PGModal';
import MealModal from '../components/MealModal';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

const CITY_SUGGESTIONS = ['Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi'];
const CURRENT_LOCATION_RADIUS_METRES = 15000;

type SearchMode = 'city' | 'location';

const formatDistanceLabel = (metres: number) => {
  if (!Number.isFinite(metres)) return '';
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(metres >= 10000 ? 0 : 1)} km`;
};

const getDistanceMetres = (origin: { lat: number; lng: number }, coordinates: unknown) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const earthRadius = 6371000;
  const latDelta = (lat - origin.lat) * (Math.PI / 180);
  const lngDelta = (lng - origin.lng) * (Math.PI / 180);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(origin.lat * (Math.PI / 180)) *
      Math.cos(lat * (Math.PI / 180)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DiscoverListings = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const pageSize = 12;
  const pageWindow = 2;
  const [pgListings, setPgListings] = useState<any[]>([]);
  const [mealServices, setMealServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pgTotal, setPgTotal] = useState(0);
  const [mealTotal, setMealTotal] = useState(0);
  const [pgPage, setPgPage] = useState(1);
  const [mealPage, setMealPage] = useState(1);
  const [selectedPG, setSelectedPG] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [pgDetail, setPgDetail] = useState<any>(null);
  const [mealDetail, setMealDetail] = useState<any>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('city');
  const [cityInput, setCityInput] = useState('');
  const [activeCity, setActiveCity] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const pendingFlipState = useRef<any>(null);
  const hasLoadedOnce = useRef(false);

  const visiblePGPages = useMemo(() => {
    const totalPages = Math.ceil(pgTotal / pageSize);
    const start = Math.max(1, pgPage - pageWindow);
    const end = Math.min(totalPages, pgPage + pageWindow);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, idx) => start + idx);
  }, [pgPage, pgTotal]);

  const visibleMealPages = useMemo(() => {
    const totalPages = Math.ceil(mealTotal / pageSize);
    const start = Math.max(1, mealPage - pageWindow);
    const end = Math.min(totalPages, mealPage + pageWindow);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, idx) => start + idx);
  }, [mealPage, mealTotal]);

  const nearbyListings = useMemo(() => {
    if (searchMode !== 'location' || !userLocation) return [];

    return [
      ...pgListings.map((pg) => ({
        kind: 'pg' as const,
        item: pg,
        distanceMetres: getDistanceMetres(userLocation, pg.location?.coordinates),
      })),
      ...mealServices.map((meal) => ({
        kind: 'meal' as const,
        item: meal,
        distanceMetres: getDistanceMetres(userLocation, meal.location?.coordinates),
      })),
    ]
      .filter((entry) => entry.distanceMetres !== null && entry.distanceMetres <= CURRENT_LOCATION_RADIUS_METRES)
      .sort((left, right) => (left.distanceMetres || 0) - (right.distanceMetres || 0));
  }, [mealServices, pgListings, searchMode, userLocation]);

  const activeSummary = searchMode === 'location' && userLocation
    ? `Showing listings near ${activeCity || 'your current location'} within 15 km`
    : activeCity
      ? `Showing results for ${activeCity}`
      : 'Search a city or use your current location to see both PG and meal listings.';

  const fetchListings = async () => {
    if (!hasSearched) {
      setLoading(false);
      setPgListings([]);
      setMealServices([]);
      setPgTotal(0);
      setMealTotal(0);
      return;
    }

    if (searchMode === 'city' && !activeCity) {
      setLoading(false);
      setPgListings([]);
      setMealServices([]);
      setPgTotal(0);
      setMealTotal(0);
      return;
    }

    if (searchMode === 'location' && !userLocation) {
      setLoading(false);
      setPgListings([]);
      setMealServices([]);
      setPgTotal(0);
      setMealTotal(0);
      return;
    }

    setLoading(true);
    try {
      const pgParams: Record<string, any> = { page: pgPage, limit: pageSize };
      const mealParams: Record<string, any> = { page: mealPage, limit: pageSize };

      if (searchMode === 'city' && activeCity) {
        pgParams.city = activeCity;
        mealParams.city = activeCity;
      }

      if (searchMode === 'location' && userLocation) {
        pgParams.lat = userLocation.lat;
        pgParams.lng = userLocation.lng;
        pgParams.radius = CURRENT_LOCATION_RADIUS_METRES;
        pgParams.page = 1;
        pgParams.limit = 100;
        mealParams.lat = userLocation.lat;
        mealParams.lng = userLocation.lng;
        mealParams.radius = CURRENT_LOCATION_RADIUS_METRES;
        mealParams.page = 1;
        mealParams.limit = 100;
      }

      if (gridRef.current && hasLoadedOnce.current) {
        const cards = gridRef.current.querySelectorAll('.discover-listing-card');
        if (cards.length) pendingFlipState.current = Flip.getState(cards);
      }

      const [pgRes, mealRes] = await Promise.all([
        api.get('/pg', { params: pgParams }),
        api.get('/meal', { params: mealParams }),
      ]);

      setPgListings(pgRes.data?.data?.listings || []);
      setMealServices(mealRes.data?.data?.services || []);
      setPgTotal(Number(pgRes.data?.data?.total || 0));
      setMealTotal(Number(mealRes.data?.data?.total || 0));
    } catch {
      toast.error('Failed to load listings');
      setPgListings([]);
      setMealServices([]);
      setPgTotal(0);
      setMealTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [hasSearched, searchMode, activeCity, userLocation, pgPage, mealPage]);

  useGSAP(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.discover-listing-card');
      if (!cards.length) return;

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
  }, [loading, pgListings, mealServices]);

  const handleCitySearch = () => {
    const nextCity = cityInput.trim();
    if (!nextCity) {
      toast.error('Enter a city to search');
      return;
    }

    setSearchMode('city');
    setActiveCity(nextCity);
    setUserLocation(null);
    setHasSearched(true);
    setPgPage(1);
    setMealPage(1);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let resolvedCity = '';

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${nextLocation.lat}&lon=${nextLocation.lng}`,
            {
              headers: {
                Accept: 'application/json',
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            resolvedCity =
              data?.address?.city ||
              data?.address?.town ||
              data?.address?.village ||
              data?.address?.municipality ||
              data?.address?.county ||
              '';
          }
        } catch {
          resolvedCity = '';
        }

        setSearchMode('location');
        setUserLocation(nextLocation);
        setActiveCity(resolvedCity || 'Your current area');
        setHasSearched(true);
        setPgPage(1);
        setMealPage(1);
      },
      () => toast.error('Location access denied')
    );
  };

  const openPG = async (pg: any) => {
    setSelectedPG(pg);
    try {
      const res = await api.get(`/pg/${pg._id}`);
      setPgDetail(res.data?.data || null);
    } catch {
      setPgDetail(null);
    }
  };

  const openMeal = async (meal: any) => {
    setSelectedMeal(meal);
    try {
      const res = await api.get(`/meal/${meal._id}`);
      setMealDetail(res.data?.data || null);
    } catch {
      setMealDetail(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto page-shell px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4 transition-opacity">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="font-heading page-title text-3xl sm:text-4xl font-bold mb-2">Discover PGs & Meal Services</h1>
        <p className="opacity-60 page-subtitle">Search by city or use your current location to view nearby PGs and meals together.</p>
      </div>

      <section className="glass rounded-3xl p-5 sm:p-6 mb-8 border border-[var(--border)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-[0.2em] opacity-50 mb-2 block">Search by city</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 glass rounded-full px-4 py-2.5">
                <Search size={16} className="opacity-50" />
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCitySearch();
                  }}
                  placeholder="Try Bangalore, Pune, Delhi or any city"
                  className="bg-transparent outline-none text-sm flex-1"
                />
              </div>
              <button
                onClick={handleCitySearch}
                className="px-5 py-2.5 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors whitespace-nowrap"
              >
                Search City
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {CITY_SUGGESTIONS.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setCityInput(city);
                    setSearchMode('city');
                    setActiveCity(city);
                    setUserLocation(null);
                    setHasSearched(true);
                    setPgPage(1);
                    setMealPage(1);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium glass hover:border-amber-500/50 hover:text-amber-500 transition-all"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[240px]">
            <button
              onClick={handleCurrentLocation}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${searchMode === 'location' ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}
            >
              <LocateFixed size={16} /> Use Current Location
            </button>
            <div className="flex items-center gap-2 text-xs opacity-60 flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={12} /> Search mode</span>
              <span className={`px-2 py-1 rounded-full ${searchMode === 'city' ? 'bg-amber-500/15 text-amber-500' : 'glass'}`}>City</span>
              <span className={`px-2 py-1 rounded-full ${searchMode === 'location' ? 'bg-amber-500/15 text-amber-500' : 'glass'}`}>Current location</span>
            </div>
            {searchMode === 'location' && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-3 py-1.5 rounded-full glass text-amber-500">
                  15 km radius
                </span>
                {activeCity && (
                  <span className="px-3 py-1.5 rounded-full glass">
                    {activeCity}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-sm opacity-70 flex items-start gap-2">
          <MapPin size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <span>{activeSummary}</span>
        </div>
      </section>

      {!hasSearched ? (
        <div className="glass rounded-3xl p-8 text-center">
          <Building2 size={42} className="mx-auto mb-4 text-amber-500" />
          <p className="font-heading text-xl font-semibold mb-2">Start a search</p>
          <p className="text-sm opacity-60 max-w-xl mx-auto">
            Enter a city name or allow location access to discover PG listings and meal services together.
          </p>
        </div>
      ) : (
        searchMode === 'location' ? (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-amber-500" />
              <h2 className="font-heading text-2xl font-bold">
                Nearby Listings{activeCity ? ` around ${activeCity}` : ''}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`nearby-skeleton-${i}`} />)}
              </div>
            ) : nearbyListings.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center opacity-80">
                <MapPin size={22} className="mx-auto mb-2 text-amber-500" />
                <p className="font-medium">No listings found within 15 km of {activeCity || 'your current location'}.</p>
              </div>
            ) : (
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyListings.map((entry) => (
                  <div key={`${entry.kind}-${entry.item._id}`} className="discover-listing-card">
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs opacity-70">
                      <span className={`px-2 py-1 rounded-full ${entry.kind === 'pg' ? 'bg-amber-500/15 text-amber-500' : 'bg-green-500/15 text-green-500'}`}>
                        {entry.kind === 'pg' ? 'PG' : 'Meal'}
                      </span>
                      <span>{formatDistanceLabel(entry.distanceMetres || 0)} away</span>
                    </div>
                    {entry.kind === 'pg' ? (
                      <PGCard pg={entry.item} onViewDetails={openPG} />
                    ) : (
                      <MealCard meal={entry.item} onViewDetails={openMeal} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-amber-500" />
                <h2 className="font-heading text-2xl font-bold">{`PG Listings${activeCity ? ` in ${activeCity}` : ''}`}</h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`pg-skeleton-${i}`} />)}
                </div>
              ) : pgListings.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center opacity-80">
                  <MapPin size={22} className="mx-auto mb-2 text-amber-500" />
                  <p className="font-medium">No PG listings found{activeCity ? ` in ${activeCity}` : ''}.</p>
                </div>
              ) : (
                <>
                  <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pgListings.map((pg) => (
                      <div key={pg._id} className="discover-listing-card">
                        <PGCard pg={pg} onViewDetails={openPG} />
                      </div>
                    ))}
                  </div>
                  {pgTotal > pageSize && (
                    <div className="flex justify-center gap-2 mt-8 flex-wrap">
                      <button
                        onClick={() => setPgPage((prev) => Math.max(1, prev - 1))}
                        disabled={pgPage === 1}
                        className="px-3 h-10 rounded-full text-sm font-medium glass hover:border-amber-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      {visiblePGPages.map((pageNumber) => (
                        <button
                          key={`pg-page-${pageNumber}`}
                          onClick={() => setPgPage(pageNumber)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${pgPage === pageNumber ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                      <button
                        onClick={() => setPgPage((prev) => Math.min(Math.ceil(pgTotal / pageSize), prev + 1))}
                        disabled={pgPage === Math.ceil(pgTotal / pageSize)}
                        className="px-3 h-10 rounded-full text-sm font-medium glass hover:border-amber-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <UtensilsCrossed size={18} className="text-green-500" />
                <h2 className="font-heading text-2xl font-bold">{`Meal Services${activeCity ? ` in ${activeCity}` : ''}`}</h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`meal-skeleton-${i}`} />)}
                </div>
              ) : mealServices.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center opacity-80">
                  <MapPin size={22} className="mx-auto mb-2 text-green-500" />
                  <p className="font-medium">No meal services found{activeCity ? ` in ${activeCity}` : ''}.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mealServices.map((meal) => (
                      <div key={meal._id} className="discover-listing-card">
                        <MealCard meal={meal} onViewDetails={openMeal} />
                      </div>
                    ))}
                  </div>
                  {mealTotal > pageSize && (
                    <div className="flex justify-center gap-2 mt-8 flex-wrap">
                      <button
                        onClick={() => setMealPage((prev) => Math.max(1, prev - 1))}
                        disabled={mealPage === 1}
                        className="px-3 h-10 rounded-full text-sm font-medium glass hover:border-amber-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      {visibleMealPages.map((pageNumber) => (
                        <button
                          key={`meal-page-${pageNumber}`}
                          onClick={() => setMealPage(pageNumber)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${mealPage === pageNumber ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                      <button
                        onClick={() => setMealPage((prev) => Math.min(Math.ceil(mealTotal / pageSize), prev + 1))}
                        disabled={mealPage === Math.ceil(mealTotal / pageSize)}
                        className="px-3 h-10 rounded-full text-sm font-medium glass hover:border-amber-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )
      )}

      {selectedPG && (
        <PGModal
          pg={selectedPG}
          detail={pgDetail}
          onClose={() => {
            setSelectedPG(null);
            setPgDetail(null);
          }}
          onViewMeal={openMeal}
        />
      )}

      {selectedMeal && (
        <MealModal
          meal={selectedMeal}
          detail={mealDetail}
          onClose={() => {
            setSelectedMeal(null);
            setMealDetail(null);
          }}
          onViewPG={openPG}
        />
      )}
    </div>
  );
};

export default DiscoverListings;
