import React, { useRef, useEffect } from 'react';
import { Star, Truck, Leaf, BadgeCheck, MessageCircle, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { addCardHover } from '../animations/cardAnimations';

interface MealCardProps {
  meal: any;
  onViewDetails: (meal: any) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onViewDetails }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const cleanup = addCardHover(cardRef.current);
    return cleanup;
  }, []);

  const monthlyPlan = Array.isArray(meal.plans)
    ? meal.plans.find((plan: any) => {
        const tier = String(plan?.tier || '').toLowerCase();
        const name = String(plan?.name || '').toLowerCase();
        const duration = String(plan?.duration || '').toLowerCase();
        return tier === 'monthly' || name.includes('month') || duration.includes('month');
      })
    : null;
  const monthlyPrice = Number(monthlyPlan?.price || 0);
  const displayMonthlyPrice = monthlyPrice > 0
    ? monthlyPrice
    : Number(meal.minPrice || meal.plans?.[0]?.price || 0);
  const phoneDigits = String(meal.contactPhone || '').replace(/\D/g, '');
  const waPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const waText = encodeURIComponent(`Hi, I am interested in your meal service ${meal.providerName} in ${meal.city}.`);
  const whatsappLink = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : '';

  const coords = Array.isArray(meal.location?.coordinates) ? meal.location.coordinates : [];
  const hasCoords = coords.length === 2 && Number(coords[0]) !== 0 && Number(coords[1]) !== 0;
  const mapQuery = hasCoords
    ? `${coords[1]},${coords[0]}`
    : encodeURIComponent([meal.address, meal.city].filter(Boolean).join(', '));
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const openDetails = () => onViewDetails(meal);

  return (
    <div
      ref={cardRef}
      className="glass rounded-2xl overflow-hidden cursor-pointer group h-full min-h-[400px] flex flex-col"
      style={{ willChange: 'transform' }}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetails();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${meal.providerName}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img src={meal.photos?.[0] || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600'} alt={meal.providerName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {meal.verified && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full backdrop-blur-sm">
              <BadgeCheck size={12} /> Verified
            </span>
          )}
          {meal.featured && (
            <span className="px-2 py-1 bg-amber-500/90 text-white text-xs rounded-full backdrop-blur-sm">Featured</span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex flex-wrap gap-1">
            {meal.cuisines?.slice(0, 2).map((c: string) => (
              <span key={c} className="px-2 py-0.5 bg-black/40 text-white text-xs rounded-full backdrop-blur-sm">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1 min-h-[3rem]">
          <h3 className="font-heading font-semibold text-base leading-tight break-words">{meal.providerName}</h3>
          <div className="flex items-center gap-1 text-amber-400 shrink-0 ml-2">
            <Star size={13} fill="currentColor" />
            <span className="text-xs font-medium">{meal.averageRating?.toFixed(1) || '4.0'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3 min-h-[3rem] content-start">
          {meal.dietTypes?.map((d: string) => (
            <span key={d} className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded-full">
              <Leaf size={10} />{d}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs opacity-60 mb-3 min-h-[1.1rem]">
          <Truck size={11} />
          <span>Delivery within {meal.deliveryRadius} km</span>
        </div>

        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
          <div>
            <span className="text-lg font-bold text-amber-500">₹{displayMonthlyPrice.toLocaleString()}</span>
            <span className="text-xs opacity-60">/month</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a
              href={whatsappLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (!whatsappLink) {
                  e.preventDefault();
                  toast.error('WhatsApp number not available');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
            >
              <MessageCircle size={12} /> WhatsApp
            </a>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-sky-600 text-white text-xs rounded-full hover:bg-sky-700 transition-colors font-medium whitespace-nowrap"
            >
              <Navigation size={12} /> Locate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
