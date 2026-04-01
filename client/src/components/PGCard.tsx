import React, { useRef, useEffect } from 'react';
import { MapPin, Star, Wifi, Zap, Droplets, Shield, Bookmark, BadgeCheck, MessageCircle, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addCardHover } from '../animations/cardAnimations';
import api from '../lib/axios';
import toast from 'react-hot-toast';

interface PGCardProps {
  pg: any;
  onViewDetails: (pg: any) => void;
}

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi size={12} />,
  AC: <Zap size={12} />,
  Geyser: <Droplets size={12} />,
  Security: <Shield size={12} />,
};

const PGCard: React.FC<PGCardProps> = ({ pg, onViewDetails }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!cardRef.current) return;
    const cleanup = addCardHover(cardRef.current);
    return cleanup;
  }, []);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { toast.error('Please login to save listings'); return; }
    try {
      await api.post(`/pg/${pg._id}/save`);
      toast.success('Saved!');
    } catch { toast.error('Failed to save'); }
  };

  const minPrice = pg.minPrice || (pg.roomTypes?.[0]?.price ?? 0);
  const phoneDigits = String(pg.contactPhone || '').replace(/\D/g, '');
  const waPhone = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const waText = encodeURIComponent(`Hi, I am interested in ${pg.name} in ${pg.city}.`);
  const whatsappLink = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : '';

  const coords = Array.isArray(pg.location?.coordinates) ? pg.location.coordinates : [];
  const hasCoords = coords.length === 2 && Number(coords[0]) !== 0 && Number(coords[1]) !== 0;
  const mapQuery = hasCoords
    ? `${coords[1]},${coords[0]}`
    : encodeURIComponent([pg.address, pg.city].filter(Boolean).join(', '));
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const openDetails = () => onViewDetails(pg);

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
      aria-label={`Open details for ${pg.name}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img src={pg.photos?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600'} alt={pg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {pg.verified && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full backdrop-blur-sm">
              <BadgeCheck size={12} /> Verified
            </span>
          )}
          {pg.featured && (
            <span className="px-2 py-1 bg-amber-500/90 text-white text-xs rounded-full backdrop-blur-sm">Featured</span>
          )}
        </div>
        <button onClick={handleSave} className="absolute top-3 right-3 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-amber-500/80 transition-colors">
          <Bookmark size={14} className="text-white" />
        </button>
        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-1 text-xs rounded-full backdrop-blur-sm font-medium ${pg.gender === 'male' ? 'bg-blue-500/80 text-white' : pg.gender === 'female' ? 'bg-pink-500/80 text-white' : 'bg-purple-500/80 text-white'}`}>
            {pg.gender === 'male' ? '♂ Male' : pg.gender === 'female' ? '♀ Female' : '⚧ Unisex'}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1 min-h-[3rem]">
          <h3 className="font-heading font-semibold text-base leading-tight break-words">{pg.name}</h3>
          <div className="flex items-center gap-1 text-amber-400 shrink-0 ml-2">
            <Star size={13} fill="currentColor" />
            <span className="text-xs font-medium">{pg.averageRating?.toFixed(1) || '4.0'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs opacity-60 mb-2 min-h-[1.1rem]">
          <MapPin size={11} />
          <span className="truncate">{pg.address}</span>
        </div>
        <p className="text-xs opacity-50 mb-2 min-h-[1rem] truncate">{pg.landmark ? `${pg.distanceFromLandmark} from ${pg.landmark}` : '\u00A0'}</p>

        <div className="flex flex-wrap gap-1 mb-3 min-h-[3rem] content-start">
          {pg.amenities?.slice(0, 4).map((a: string) => (
            <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs rounded-full">
              {amenityIcons[a] || null}{a}
            </span>
          ))}
        </div>

        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
          <div>
            <span className="text-lg font-bold text-amber-500">₹{minPrice.toLocaleString()}</span>
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

export default PGCard;
