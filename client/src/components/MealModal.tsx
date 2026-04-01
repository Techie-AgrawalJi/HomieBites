import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { X, Star, Phone, ChevronLeft, ChevronRight, BadgeCheck, Building2, Leaf } from 'lucide-react';
import { animateModalOpen, animateThumbnailStrip, animateParallaxOnMouseMove, animateMenuCards, animateNearbyCards, attachHorizontalObserver } from '../animations/galleryAnimations';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

interface MealModalProps {
  meal: any;
  detail: any;
  onClose: () => void;
  onViewPG: (pg: any) => void;
}

const MealModal: React.FC<MealModalProps> = ({ meal, detail, onClose, onViewPG }) => {
  const FALLBACK_MEAL_PHOTO = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800';
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const nearbyRowRef = useRef<HTMLDivElement>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isPhotoTransitioning, setIsPhotoTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'plans' | 'kitchen'>('menu');
  const [nearbyEdge, setNearbyEdge] = useState({ left: false, right: false });
  const { user } = useAuth();
  const rawPhotos = Array.isArray(meal.photos) ? meal.photos : [];
  const photos = rawPhotos
    .filter((src: unknown): src is string => typeof src === 'string')
    .map((src) => src.trim())
    .filter((src) => src.length > 0);
  const galleryPhotos = photos.length ? photos : [FALLBACK_MEAL_PHOTO];

  const preloadPhoto = (src: string) =>
    new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });

  const resolveLoadableIndex = async (preferredIndex: number, step: 1 | -1) => {
    for (let attempts = 0; attempts < galleryPhotos.length; attempts += 1) {
      const idx = (preferredIndex + attempts * step + galleryPhotos.length) % galleryPhotos.length;
      const ok = await preloadPhoto(galleryPhotos[idx]);
      if (ok) return idx;
    }
    return -1;
  };

  const updateNearbyEdge = () => {
    if (!nearbyRowRef.current) return;
    const row = nearbyRowRef.current;
    const max = Math.max(0, row.scrollWidth - row.clientWidth);
    setNearbyEdge({
      left: row.scrollLeft > 4,
      right: row.scrollLeft < max - 4,
    });
  };

  useGSAP(() => {
    if (backdropRef.current && panelRef.current) animateModalOpen(backdropRef.current, panelRef.current);
  }, []);

  useEffect(() => {
    if (!mainImgRef.current || !photoContainerRef.current) return;
    const cleanup = animateParallaxOnMouseMove(mainImgRef.current, photoContainerRef.current);
    return cleanup;
  }, []);

  useGSAP(() => {
    let cleanupObserver: (() => void) | undefined;
    if (!panelRef.current) return;
    const thumbs = panelRef.current.querySelectorAll('.meal-thumb');
    if (thumbs.length) animateThumbnailStrip(thumbs);

    if (nearbyRowRef.current) {
      const nearby = nearbyRowRef.current.querySelectorAll('.nearby-pg-card');
      if (nearby.length) {
        animateNearbyCards(nearby, {
          trigger: nearbyRowRef.current,
          scroller: nearbyRowRef.current,
          horizontal: true,
        });
        cleanupObserver = attachHorizontalObserver(nearbyRowRef.current);
      }
    }

    return () => {
      if (cleanupObserver) cleanupObserver();
    };
  }, [detail]);

  useEffect(() => {
    const row = nearbyRowRef.current;
    if (!row) return;

    updateNearbyEdge();
    row.addEventListener('scroll', updateNearbyEdge, { passive: true });
    window.addEventListener('resize', updateNearbyEdge);

    return () => {
      row.removeEventListener('scroll', updateNearbyEdge);
      window.removeEventListener('resize', updateNearbyEdge);
    };
  }, [detail]);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    if (activePhoto < galleryPhotos.length) return;
    setActivePhoto(0);
  }, [galleryPhotos.length, activePhoto]);

  const handleNearbyKeyScroll = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!nearbyRowRef.current) return;
    const delta = e.key === 'ArrowRight' ? 220 : e.key === 'ArrowLeft' ? -220 : 0;
    if (!delta) return;
    e.preventDefault();
    nearbyRowRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab !== 'menu' || !panelRef.current) return;
    const menuCards = panelRef.current.querySelectorAll('.menu-day-card');
    if (menuCards.length) animateMenuCards(menuCards, { mobileSafe: true });
  }, [activeTab]);

  const switchPhoto = async (idx: number) => {
    if (idx === activePhoto || isPhotoTransitioning) return;
    if (!galleryPhotos[idx]) return;

    setIsPhotoTransitioning(true);

    const currentIndex = activePhoto;
    const step: 1 | -1 = idx >= currentIndex ? 1 : -1;
    const resolvedIdx = await resolveLoadableIndex(idx, step);

    if (resolvedIdx < 0 || resolvedIdx === currentIndex) {
      setIsPhotoTransitioning(false);
      return;
    }

    if (!mainImgRef.current) {
      setActivePhoto(resolvedIdx);
      setIsPhotoTransitioning(false);
      return;
    }

    const current = mainImgRef.current;
    gsap.killTweensOf(current);
    gsap.to(current, {
      autoAlpha: 0,
      duration: 0.12,
      ease: 'power1.out',
      onComplete: () => {
        setActivePhoto(resolvedIdx);
        requestAnimationFrame(() => {
          if (!mainImgRef.current) {
            setIsPhotoTransitioning(false);
            return;
          }
          gsap.killTweensOf(mainImgRef.current);
          gsap.fromTo(
            mainImgRef.current,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration: 0.2,
              ease: 'power2.out',
              onComplete: () => setIsPhotoTransitioning(false),
            }
          );
        });
      },
    });
  };

  const handleSubscribe = async (plan: any) => {
    if (!user) { toast.error('Please login to subscribe'); return; }
    try {
      await api.post('/bookings', {
        listing: meal._id,
        listingType: 'meal',
        provider: meal.provider?._id || meal.provider,
        bookingDetails: { planName: plan.name, duration: plan.duration },
        paymentAmount: plan.price,
      });
      toast.success('Subscription request sent!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleMainImageError = async () => {
    if (galleryPhotos.length <= 1) {
      if (mainImgRef.current) mainImgRef.current.src = FALLBACK_MEAL_PHOTO;
      setIsPhotoTransitioning(false);
      return;
    }

    const nextIndex = (activePhoto + 1) % galleryPhotos.length;
    const resolved = await resolveLoadableIndex(nextIndex, 1);
    if (resolved >= 0 && resolved !== activePhoto) {
      setActivePhoto(resolved);
      return;
    }

    if (mainImgRef.current) mainImgRef.current.src = FALLBACK_MEAL_PHOTO;
    setIsPhotoTransitioning(false);
  };

  const modalContent = (
    <div ref={backdropRef} className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.target === backdropRef.current && onClose()}>
      <div ref={panelRef} className="bg-[var(--bg)] w-full h-[100svh] max-h-[100svh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-none sm:rounded-2xl">
        {/* Gallery */}
        <div ref={photoContainerRef} className="relative h-56 sm:h-72 md:h-96 overflow-hidden sm:rounded-t-2xl bg-black">
          <img ref={mainImgRef} src={galleryPhotos[activePhoto]} alt={meal.providerName} className="w-full h-full object-cover" style={{ willChange: 'transform' }} onError={handleMainImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors z-10">
            <X size={18} />
          </button>
          <div className="absolute top-4 left-4 flex gap-2">
            {meal.verified && <span className="flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full"><BadgeCheck size={12} /> Verified</span>}
            {meal.featured && <span className="px-2 py-1 bg-amber-500/90 text-white text-xs rounded-full">Featured</span>}
          </div>
          {galleryPhotos.length > 1 && (
            <>
              <button disabled={isPhotoTransitioning} onClick={() => switchPhoto((activePhoto - 1 + galleryPhotos.length) % galleryPhotos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 z-10 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={18} /></button>
              <button disabled={isPhotoTransitioning} onClick={() => switchPhoto((activePhoto + 1) % galleryPhotos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 z-10 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={18} /></button>
            </>
          )}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {galleryPhotos.map((_, i) => (
              <button disabled={isPhotoTransitioning} key={i} onClick={() => switchPhoto(i)} className={`meal-thumb w-12 h-8 rounded overflow-hidden border-2 transition-all z-10 disabled:opacity-50 disabled:cursor-not-allowed ${i === activePhoto ? 'border-amber-400' : 'border-transparent opacity-60'}`}>
                <img src={galleryPhotos[i]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_MEAL_PHOTO; }} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-x-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h2 className="font-heading text-xl sm:text-2xl leading-tight font-bold break-words pr-1">{meal.providerName}</h2>
              <p className="text-sm opacity-60 mt-1 break-words">{meal.address}, {meal.city}</p>
            </div>
            <div className="self-start shrink-0 flex items-center gap-1 text-amber-400">
              <Star size={16} fill="currentColor" />
              <span className="font-semibold">{meal.averageRating?.toFixed(1) || '4.0'}</span>
              <span className="text-sm opacity-60">({meal.reviewCount || 0})</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {meal.cuisines?.map((c: string) => <span key={c} className="px-2 py-1 glass rounded-full text-xs">{c}</span>)}
            {meal.dietTypes?.map((d: string) => <span key={d} className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs"><Leaf size={10} />{d}</span>)}
          </div>

          <p className="text-sm opacity-70 mb-6 leading-relaxed">{meal.description}</p>

          {/* Plans */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Subscription Plans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {meal.plans?.map((plan: any, i: number) => (
                <div key={i} className={`glass rounded-xl p-4 ${i === 1 ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                  {i === 1 && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full mb-2 inline-block">Popular</span>}
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-2xl font-bold text-amber-500 my-1">₹{plan.price?.toLocaleString()}</p>
                  <p className="text-xs opacity-60">{plan.duration} · {plan.mealsPerDay} meals/day</p>
                  <button onClick={() => handleSubscribe(plan)} className="w-full mt-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                    Subscribe
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="modal-tabs mb-4">
            {(['menu', 'plans', 'kitchen'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab ? 'bg-amber-500 text-white' : 'glass hover:border-amber-500/50'}`}>
                {tab === 'menu' ? 'Weekly Menu' : tab === 'plans' ? 'Pricing' : 'Kitchen'}
              </button>
            ))}
          </div>

          {activeTab === 'menu' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [transform-style:flat]">
              {meal.sampleMenu?.map((day: any) => (
                <div key={day.day} className="menu-day-card glass rounded-xl p-3">
                  <h4 className="font-semibold text-sm text-amber-500 mb-2">{day.day}</h4>
                  <ul className="space-y-1">
                    {day.items?.map((item: string) => (
                      <li key={item} className="text-xs opacity-70 flex items-start gap-1 break-words"><span className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-1" />{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'kitchen' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(meal.kitchenPhotos?.length ? meal.kitchenPhotos : galleryPhotos).map((photo: string, i: number) => (
                <img key={i} src={photo} alt={`Kitchen ${i+1}`} className="w-full h-32 object-cover rounded-xl" />
              ))}
            </div>
          )}

          {/* Nearby PGs */}
          {detail?.nearbyPGListings?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Building2 size={16} className="text-amber-500" /> Nearby PG Listings</h3>
              <div className="relative">
                <div
                  ref={nearbyRowRef}
                  tabIndex={0}
                  aria-label="Nearby PG listings carousel"
                  onKeyDown={handleNearbyKeyScroll}
                  className="flex gap-3 overflow-x-auto pb-2 focus:outline-none"
                >
                  {detail.nearbyPGListings.map((pg: any) => (
                    <div key={pg._id} className="nearby-pg-card glass rounded-xl p-3 min-w-[180px] cursor-pointer hover:border-amber-500/50 transition-all" onClick={() => onViewPG(pg)}>
                      <img src={pg.photos?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200'} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                      <p className="text-sm font-medium truncate">{pg.name}</p>
                      <p className="text-xs text-amber-500">{pg.distanceString} away</p>
                      <p className="text-xs opacity-60">₹{pg.minPrice?.toLocaleString()}/mo</p>
                    </div>
                  ))}
                </div>
                <div className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--bg)] to-transparent transition-opacity ${nearbyEdge.left ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--bg)] to-transparent transition-opacity ${nearbyEdge.right ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm opacity-60">
            <Phone size={14} className="text-amber-500" />
            <span>{meal.contactPhone}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MealModal;
