import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, UtensilsCrossed, MapPin } from 'lucide-react';
import api from '../lib/axios';
import PGCard from '../components/PGCard';
import MealCard from '../components/MealCard';
import PGModal from '../components/PGModal';
import MealModal from '../components/MealModal';
import SkeletonCard from '../components/SkeletonCard';

const CityExplore = () => {
  const params = useParams();
  const city = useMemo(() => decodeURIComponent(params.city || '').trim(), [params.city]);
  const pageSize = 12;
  const pageWindow = 2;

  const [pgListings, setPgListings] = useState<any[]>([]);
  const [mealServices, setMealServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pgTotal, setPgTotal] = useState(0);
  const [mealTotal, setMealTotal] = useState(0);
  const [pgPage, setPgPage] = useState(1);
  const [mealPage, setMealPage] = useState(1);

  const [selectedPG, setSelectedPG] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [pgDetail, setPgDetail] = useState<any>(null);
  const [mealDetail, setMealDetail] = useState<any>(null);

  const getVisiblePages = (totalPages: number, currentPage: number) => {
    const start = Math.max(1, currentPage - pageWindow);
    const end = Math.min(totalPages, currentPage + pageWindow);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  };

  useEffect(() => {
    setPgPage(1);
    setMealPage(1);
  }, [city]);

  useEffect(() => {
    if (!city) {
      setPgListings([]);
      setMealServices([]);
      setPgTotal(0);
      setMealTotal(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [pgRes, mealRes] = await Promise.all([
          api.get('/pg', { params: { city, page: pgPage, limit: pageSize } }),
          api.get('/meal', { params: { city, page: mealPage, limit: pageSize } }),
        ]);

        if (cancelled) return;
        setPgListings(pgRes.data?.data?.listings || []);
        setMealServices(mealRes.data?.data?.services || []);
        setPgTotal(Number(pgRes.data?.data?.total || 0));
        setMealTotal(Number(mealRes.data?.data?.total || 0));
      } catch {
        if (cancelled) return;
        setPgListings([]);
        setMealServices([]);
        setPgTotal(0);
        setMealTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [city, pgPage, mealPage]);

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

  const pgTotalPages = Math.ceil(pgTotal / pageSize);
  const mealTotalPages = Math.ceil(mealTotal / pageSize);
  const visiblePGPages = getVisiblePages(pgTotalPages, pgPage);
  const visibleMealPages = getVisiblePages(mealTotalPages, mealPage);

  return (
    <div className="max-w-7xl mx-auto page-shell px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4 transition-opacity">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="font-heading page-title text-3xl sm:text-4xl font-bold mb-2">
          Explore {city || 'City'}
        </h1>
        <p className="opacity-60 page-subtitle">PG listings and meal providers available in {city || 'this city'}</p>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-amber-500" />
          <h2 className="font-heading text-2xl font-bold">PG Listings in {city}</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`pg-skeleton-${i}`} />)}
          </div>
        ) : pgListings.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center opacity-80">
            <MapPin size={22} className="mx-auto mb-2 text-amber-500" />
            <p className="font-medium">No PG listings found in {city}.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pgListings.map((pg) => (
                <PGCard key={pg._id} pg={pg} onViewDetails={openPG} />
              ))}
            </div>
            {pgTotal > pageSize && (
              <div className="flex justify-center gap-2 mt-8">
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
                  onClick={() => setPgPage((prev) => Math.min(pgTotalPages, prev + 1))}
                  disabled={pgPage === pgTotalPages}
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
          <h2 className="font-heading text-2xl font-bold">Meal Providers in {city}</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`meal-skeleton-${i}`} />)}
          </div>
        ) : mealServices.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center opacity-80">
            <MapPin size={22} className="mx-auto mb-2 text-green-500" />
            <p className="font-medium">No meal providers found in {city}.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mealServices.map((meal) => (
                <MealCard key={meal._id} meal={meal} onViewDetails={openMeal} />
              ))}
            </div>
            {mealTotal > pageSize && (
              <div className="flex justify-center gap-2 mt-8">
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
                  onClick={() => setMealPage((prev) => Math.min(mealTotalPages, prev + 1))}
                  disabled={mealPage === mealTotalPages}
                  className="px-3 h-10 rounded-full text-sm font-medium glass hover:border-amber-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

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

export default CityExplore;
