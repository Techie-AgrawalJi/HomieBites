import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { X, Star, Phone, ChevronLeft, ChevronRight, BadgeCheck, Building2, Leaf, CalendarDays } from 'lucide-react';
import { animateModalOpen, animateThumbnailStrip, animateParallaxOnMouseMove, animateMenuCards, animateNearbyCards, attachHorizontalObserver } from '../animations/galleryAnimations';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface MealModalProps {
  meal: any;
  detail: any;
  onClose: () => void;
  onViewPG: (pg: any) => void;
}

interface ListingReview {
  _id: string;
  rating: number;
  comment: string;
  verifiedBooker?: boolean;
  createdAt: string;
  user?: {
    _id?: string;
    name?: string;
  };
}

const getIsoDateOffset = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

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
  const [dailyServiceDate, setDailyServiceDate] = useState(() => getIsoDateOffset(1));
  const [nearbyEdge, setNearbyEdge] = useState({ left: false, right: false });
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewStats, setReviewStats] = useState({ averageRating: Number(meal.averageRating || 0), reviewCount: Number(meal.reviewCount || 0) });
  const { user } = useAuth();
  const isBookingRestrictedUser = ['provider', 'superadmin', 'admin'].includes(user?.role || '');
  const canSubmitReview = !!user && user.role === 'user';
  const hasUserReview = !!(user && reviews.some((review) => review.user?._id === user._id));
  const rawPhotos = Array.isArray(meal.photos) ? meal.photos : [];
  const photos = rawPhotos
    .filter((src: unknown): src is string => typeof src === 'string')
    .map((src) => src.trim())
    .filter((src) => src.length > 0);
  const galleryPhotos = photos.length ? photos : [FALLBACK_MEAL_PHOTO];
  const tomorrowIsoDate = getIsoDateOffset(1);
  const thirdDayAfterTodayIsoDate = getIsoDateOffset(3);

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

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      if (!meal?._id) return;
      setReviewsLoading(true);
      try {
        const res = await api.get('/reviews', {
          params: {
            listingId: meal._id,
            listingType: 'meal',
            page: 1,
            limit: 50,
          },
        });
        if (!active) return;
        setReviews(res.data?.data?.reviews || []);
        setReviewStats({
          averageRating: Number(res.data?.data?.averageRating || 0),
          reviewCount: Number(res.data?.data?.reviewCount || 0),
        });
      } catch {
        if (!active) return;
        setReviews([]);
      } finally {
        if (active) setReviewsLoading(false);
      }
    };

    loadReviews();

    return () => {
      active = false;
    };
  }, [meal?._id]);

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
    if (isBookingRestrictedUser) { toast.error('Provider and admin accounts cannot create booking requests'); return; }

    const tier = String(plan?.tier || '').toLowerCase() ||
      (String(plan?.duration || '').toLowerCase().includes('day') && !String(plan?.duration || '').toLowerCase().includes('week') && !String(plan?.duration || '').toLowerCase().includes('month')
        ? 'daily'
        : String(plan?.duration || '').toLowerCase().includes('week')
          ? 'weekly'
          : 'monthly');

    if (tier === 'daily' && !dailyServiceDate) {
      toast.error('Please select a date');
      return;
    }

    if (tier === 'daily' && (dailyServiceDate < tomorrowIsoDate || dailyServiceDate > thirdDayAfterTodayIsoDate)) {
      toast.error('Daily meal service can only be requested for tomorrow and the following 2 days');
      return;
    }

    try {
      const orderRes = await api.post('/payments/create-meal-order', {
        listingId: meal._id,
        providerId: meal.provider?._id || meal.provider,
        planName: plan.name,
        serviceTier: tier,
        duration: plan.duration,
        mealsPerDay: plan.mealsPerDay,
        amount: plan.price,
        serviceDate: tier === 'daily' ? dailyServiceDate : null,
        message: '',
      });

      const { orderId, amount, currency, bookingToken, mockPayment } = orderRes.data.data;

      if (mockPayment) {
        await api.post('/payments/mock-confirm', { bookingToken });
        toast.success('Booking confirmed (mock payment mode).');
        onClose();
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'HomieBites',
        description: `${plan.name} (${tier})`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingToken,
            });
            toast.success('Payment successful. Booking confirmed and provider notified.');
            onClose();
          } catch {
            toast.error('Payment verification failed. Booking remains unconfirmed.');
          }
        },
        theme: { color: '#f59e0b' },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error('Payment gateway is not loaded. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start payment');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    if (user.role !== 'user') {
      toast.error('Only registered users can post reviews');
      return;
    }
    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error('Please select a rating');
      return;
    }
    const cleanedComment = reviewForm.comment.trim();
    if (!cleanedComment) {
      toast.error('Please write a short review comment');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        listingId: meal._id,
        listingType: 'meal',
        rating: reviewForm.rating,
        comment: cleanedComment,
      });

      const nextReview = res.data?.data?.review as ListingReview | undefined;
      if (nextReview) {
        setReviews((prev) => {
          const filtered = prev.filter((item) => item.user?._id !== user._id);
          return [nextReview, ...filtered];
        });
      }

      setReviewStats({
        averageRating: Number(res.data?.data?.averageRating || 0),
        reviewCount: Number(res.data?.data?.reviewCount || 0),
      });
      setReviewForm({ rating: 0, comment: '' });
      setShowReviewForm(false);
      toast.success('Review submitted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unable to submit review');
    } finally {
      setReviewSubmitting(false);
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
              <span className="font-semibold">{reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}</span>
              <span className="text-sm opacity-60">({reviewStats.reviewCount})</span>
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
                  <p className="text-xs opacity-60 capitalize">{plan.tier || 'monthly'} · {plan.duration} · {plan.mealsPerDay} meals/day</p>
                  {String(plan?.tier || '').toLowerCase() === 'daily' && (
                    <div className="relative mt-2">
                      <input
                        type="date"
                        min={tomorrowIsoDate}
                        max={thirdDayAfterTodayIsoDate}
                        value={dailyServiceDate}
                        onChange={(e) => setDailyServiceDate(e.target.value)}
                        onKeyDown={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        className="daily-date-picker-input w-full px-2 py-1.5 pr-10 glass rounded-lg text-xs outline-none"
                        aria-label="Select daily meal date"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
                          if (!input) return;
                          input.focus();
                          input.showPicker?.();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                        aria-label="Open date picker"
                        title="Open date picker"
                      >
                        <CalendarDays size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isBookingRestrictedUser}
                    className="w-full mt-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
                  >
                    {String(plan?.tier || '').toLowerCase() === 'daily' ? 'Pay & Confirm Day' : 'Pay & Subscribe'}
                  </button>
                </div>
              ))}
            </div>
            {isBookingRestrictedUser && (
              <p className="mt-3 text-xs text-red-400">Provider and admin accounts cannot send booking or subscription requests.</p>
            )}
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

          <div className="mt-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold">Reviews</h3>
              {canSubmitReview && (
                <button
                  type="button"
                  onClick={() => setShowReviewForm((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  {showReviewForm ? 'Close' : hasUserReview ? 'Edit Review' : 'Add Review'}
                </button>
              )}
            </div>
            {showReviewForm && canSubmitReview && (
              <div className="glass rounded-xl p-3 mb-4 space-y-3">
                <div>
                  <p className="text-xs opacity-60 mb-1">Your Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                        className="p-1"
                        aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                      >
                        <Star size={16} fill={value <= reviewForm.rating ? 'currentColor' : 'none'} className={value <= reviewForm.rating ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience"
                  rows={3}
                  className="w-full px-3 py-2 glass rounded-lg text-sm outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
            {!user && <p className="text-xs opacity-60 mb-3">Login as a registered user to add a review.</p>}
            {user && user.role !== 'user' && <p className="text-xs opacity-60 mb-3">Only registered users can add reviews.</p>}
            {reviewsLoading ? (
              <p className="text-sm opacity-60">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm opacity-60">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review._id} className="glass rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{review.user?.name || 'User'}</p>
                      <span className="text-xs opacity-50">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? '' : 'text-slate-400 dark:text-slate-500'} />
                      ))}
                      {review.verifiedBooker && <span className="text-[11px] ml-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Verified booker</span>}
                    </div>
                    <p className="text-sm opacity-80 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MealModal;
