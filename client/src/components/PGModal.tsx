import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { X, MapPin, Star, Phone, BadgeCheck, ChevronLeft, ChevronRight, Wifi, Zap, Droplets, Shield, UtensilsCrossed } from 'lucide-react';
import { animateModalOpen, animateThumbnailStrip, kenBurnsEffect, animateNearbyCards, attachHorizontalObserver } from '../animations/galleryAnimations';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

interface PGModalProps {
  pg: any;
  detail: any;
  onClose: () => void;
  onViewMeal: (meal: any) => void;
}

const PGModal: React.FC<PGModalProps> = ({ pg, detail, onClose, onViewMeal }) => {
  const FALLBACK_PG_PHOTO = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800';
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);
  const nearbyRowRef = useRef<HTMLDivElement>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isPhotoTransitioning, setIsPhotoTransitioning] = useState(false);
  const [nearbyEdge, setNearbyEdge] = useState({ left: false, right: false });
  const [booking, setBooking] = useState({ roomType: '', message: '', startDate: '' });
  const { user } = useAuth();
  const rawPhotos = Array.isArray(pg.photos) ? pg.photos : [];
  const photos = rawPhotos
    .filter((src: unknown): src is string => typeof src === 'string')
    .map((src) => src.trim())
    .filter((src) => src.length > 0);
  const galleryPhotos = photos.length ? photos : [FALLBACK_PG_PHOTO];

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
    if (backdropRef.current && panelRef.current) {
      animateModalOpen(backdropRef.current, panelRef.current);
    }
    if (mainImgRef.current) {
      kenBurnsEffect(mainImgRef.current);
    }
  }, []);

  useGSAP(() => {
    let cleanupObserver: (() => void) | undefined;
    if (!panelRef.current) return;
    const thumbs = panelRef.current.querySelectorAll('.pg-thumb');
    if (thumbs.length) animateThumbnailStrip(thumbs);

    if (nearbyRowRef.current) {
      const nearby = nearbyRowRef.current.querySelectorAll('.nearby-meal-card');
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

  const handleBook = async () => {
    if (!user) { toast.error('Please login to book'); return; }
    try {
      await api.post('/bookings', {
        listing: pg._id,
        listingType: 'pg',
        provider: pg.provider?._id || pg.provider,
        bookingDetails: { roomType: booking.roomType, startDate: booking.startDate, message: booking.message },
        paymentAmount: pg.roomTypes?.find((r: any) => r.type === booking.roomType)?.price || pg.minPrice,
      });
      toast.success('Booking request sent!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleMainImageError = async () => {
    if (galleryPhotos.length <= 1) {
      if (mainImgRef.current) mainImgRef.current.src = FALLBACK_PG_PHOTO;
      setIsPhotoTransitioning(false);
      return;
    }

    const nextIndex = (activePhoto + 1) % galleryPhotos.length;
    const resolved = await resolveLoadableIndex(nextIndex, 1);
    if (resolved >= 0 && resolved !== activePhoto) {
      setActivePhoto(resolved);
      return;
    }

    if (mainImgRef.current) mainImgRef.current.src = FALLBACK_PG_PHOTO;
    setIsPhotoTransitioning(false);
  };

  const modalContent = (
    <div ref={backdropRef} className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.target === backdropRef.current && onClose()}>
      <div ref={panelRef} className="pg-modal-panel bg-[var(--bg)] w-full min-w-0 h-[100svh] max-h-[100svh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-none sm:rounded-2xl">
        {/* Gallery */}
        <div className="relative h-56 sm:h-72 md:h-96 overflow-hidden sm:rounded-t-2xl bg-black">
          <img ref={mainImgRef} src={galleryPhotos[activePhoto]} alt={pg.name} className="w-full h-full object-cover" onError={handleMainImageError} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors">
            <X size={18} />
          </button>
          <div className="absolute top-4 left-4 right-16 flex gap-2 flex-wrap">
            {pg.verified && <span className="flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full"><BadgeCheck size={12} /> Verified</span>}
            {pg.featured && <span className="px-2 py-1 bg-amber-500/90 text-white text-xs rounded-full">Featured</span>}
          </div>
          {galleryPhotos.length > 1 && (
            <>
              <button disabled={isPhotoTransitioning} onClick={() => switchPhoto((activePhoto - 1 + galleryPhotos.length) % galleryPhotos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={18} /></button>
              <button disabled={isPhotoTransitioning} onClick={() => switchPhoto((activePhoto + 1) % galleryPhotos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={18} /></button>
            </>
          )}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {galleryPhotos.map((_, i) => (
              <button disabled={isPhotoTransitioning} key={i} onClick={() => switchPhoto(i)} className={`pg-thumb w-12 h-8 rounded overflow-hidden border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${i === activePhoto ? 'border-amber-400' : 'border-transparent opacity-60'}`}>
                <img src={galleryPhotos[i]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PG_PHOTO; }} />
              </button>
            ))}
          </div>
        </div>

        <div className="pg-modal-content p-4 sm:p-6 grid md:grid-cols-3 gap-6 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-x-hidden min-w-0">
          <div className="md:col-span-2 space-y-5 min-w-0">
            <div>
              <div className="pg-modal-heading flex flex-col items-start gap-2">
                <h2 className="font-heading text-xl sm:text-2xl leading-tight font-bold break-words w-full">{pg.name}</h2>
                <div className="pg-modal-rating self-start shrink-0 flex items-center gap-1 text-amber-400">
                  <Star size={16} fill="currentColor" />
                  <span className="font-semibold">{pg.averageRating?.toFixed(1) || '4.0'}</span>
                  <span className="text-sm opacity-60">({pg.reviewCount || 0})</span>
                </div>
              </div>
              <div className="flex items-start gap-1 text-sm opacity-60 mt-1 break-words"><MapPin size={13} className="mt-0.5 shrink-0" />{pg.address}</div>
              {pg.landmark && <p className="text-xs opacity-50 mt-1">{pg.distanceFromLandmark} from {pg.landmark}</p>}
            </div>

            <p className="text-sm opacity-70 leading-relaxed">{pg.description}</p>

            {/* Room Types */}
            <div>
              <h3 className="font-semibold mb-3">Room Types & Pricing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pg.roomTypes?.map((room: any) => (
                  <div key={room.type} className="glass rounded-xl p-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-sm break-words">{room.type}</span>
                      <span className="pg-modal-price text-amber-500 font-bold text-sm sm:text-base shrink-0">₹{room.price?.toLocaleString()}/mo</span>
                    </div>
                    <p className="text-xs opacity-50 mt-1">{room.availability}/{room.total} available</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="font-semibold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {pg.amenities?.map((a: string) => (
                  <span key={a} className="px-3 py-1 glass rounded-full text-sm">{a}</span>
                ))}
              </div>
            </div>

            {/* Rules */}
            {pg.rules?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">House Rules</h3>
                <ul className="space-y-1">
                  {pg.rules.map((rule: string) => (
                    <li key={rule} className="text-sm opacity-70 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Map placeholder */}
            <div className="h-36 glass rounded-xl flex items-center justify-center text-sm opacity-50">
              <MapPin className="mr-2 text-amber-500" /> Map view — {pg.address}
            </div>

            {/* Nearby Meal Services */}
            {detail?.nearbyMealServices?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><UtensilsCrossed size={16} className="text-amber-500" /> Nearby Meal Services</h3>
                <div className="relative">
                  <div
                    ref={nearbyRowRef}
                    tabIndex={0}
                    aria-label="Nearby meal services carousel"
                    onKeyDown={handleNearbyKeyScroll}
                    className="flex gap-3 overflow-x-auto pb-2 focus:outline-none"
                  >
                    {detail.nearbyMealServices.map((meal: any) => (
                      <div key={meal._id} className="nearby-meal-card glass rounded-xl p-3 min-w-[180px] cursor-pointer hover:border-amber-500/50 transition-all" onClick={() => onViewMeal(meal)}>
                        <img src={meal.photos?.[0] || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200'} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                        <p className="text-sm font-medium truncate">{meal.providerName}</p>
                        <p className="text-xs text-amber-500">{meal.distanceString} away</p>
                      </div>
                    ))}
                  </div>
                  <div className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--bg)] to-transparent transition-opacity ${nearbyEdge.left ? 'opacity-100' : 'opacity-0'}`} />
                  <div className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--bg)] to-transparent transition-opacity ${nearbyEdge.right ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 min-w-0">
            {/* Contact */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-semibold mb-3">Contact</h3>
              <p className="font-medium text-sm">{pg.contactName}</p>
              <div className="flex items-center gap-2 text-sm opacity-70 mt-1">
                <Phone size={13} className="text-amber-500" />
                <span>{pg.contactPhone}</span>
              </div>
            </div>

            {/* Book Now */}
            <div className="glass rounded-xl p-4">
              <h3 className="font-semibold mb-3">Book Now</h3>
              <div className="space-y-3">
                <select value={booking.roomType} onChange={(e) => setBooking({ ...booking, roomType: e.target.value })} className="w-full px-3 py-2 glass rounded-lg text-sm outline-none">
                  <option value="">Select Room Type</option>
                  {pg.roomTypes?.map((r: any) => (
                    <option key={r.type} value={r.type}>{r.type} — ₹{r.price?.toLocaleString()}/mo</option>
                  ))}
                </select>
                <input type="date" value={booking.startDate} onChange={(e) => setBooking({ ...booking, startDate: e.target.value })} className="w-full px-3 py-2 glass rounded-lg text-sm outline-none" />
                <textarea value={booking.message} onChange={(e) => setBooking({ ...booking, message: e.target.value })} placeholder="Message to provider (optional)" rows={3} className="w-full px-3 py-2 glass rounded-lg text-sm outline-none resize-none" />
                <button onClick={handleBook} className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
                  Send Booking Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PGModal;
