import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Building2, UtensilsCrossed, Search, Shield, Star, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { animateHero, animateBlobsWithTicker, splitTextIntoWords } from '../animations/heroAnimations';
import { animateStepsOnScroll, animateFeaturesOnScroll, animateCityPills, animateTestimonialsScroll } from '../animations/scrollAnimations';
import api from '../lib/axios';
import PGCard from '../components/PGCard';
import MealCard from '../components/MealCard';
import PGModal from '../components/PGModal';
import MealModal from '../components/MealModal';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi'];

const TESTIMONIALS = [
  { name: 'Arjun Mehta', role: 'Software Engineer, Bangalore', text: 'NestEase helped me find a great PG in Koramangala within a day. The meal subscription nearby is amazing!', rating: 5 },
  { name: 'Priya Krishnan', role: 'MBA Student, Pune', text: 'The filters made it so easy to find a girls-only PG under my budget. Highly recommend!', rating: 5 },
  { name: 'Rohit Verma', role: 'Fresher, Delhi', text: 'Relocated from Patna and NestEase sorted out both my PG and food in one go. Life-saver!', rating: 5 },
  { name: 'Ananya Singh', role: 'Consultant, Hyderabad', text: 'The GSAP animations are so smooth! But more importantly, found a luxury PG in Banjara Hills.', rating: 4 },
  { name: 'Kabir Nair', role: 'Data Scientist, Bangalore', text: 'BangaloreMeals Co. has the healthiest keto meal plan I\'ve found. Thank you NestEase!', rating: 5 },
];

const WHY_FEATURES = [
  { icon: <Shield size={24} />, title: 'Verified Listings', desc: 'Every PG and meal service is verified by our team before listing.' },
  { icon: <MapPin size={24} />, title: 'Location-Based Search', desc: 'Find services near your office, college, or any landmark with geolocation.' },
  { icon: <Star size={24} />, title: 'Genuine Reviews', desc: 'Only verified bookers can leave reviews, ensuring authenticity.' },
  { icon: <UtensilsCrossed size={24} />, title: 'Nearby Meal Services', desc: 'Any PG listing shows nearby meal services within 5km, and vice versa.' },
  { icon: <CheckCircle size={24} />, title: 'Secure Payments', desc: 'Razorpay-powered secure payment with HMAC verification.' },
  { icon: <Building2 size={24} />, title: 'For Providers Too', desc: 'Easy dashboard for providers to manage listings and requests.' },
];

const Landing = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const blobRef1 = useRef<HTMLDivElement>(null);
  const blobRef2 = useRef<HTMLDivElement>(null);
  const blobRef3 = useRef<HTMLDivElement>(null);
  const testimonialsTrackRef = useRef<HTMLDivElement>(null);
  const [featuredPG, setFeaturedPG] = useState<any[]>([]);
  const [featuredMeal, setFeaturedMeal] = useState<any[]>([]);
  const [selectedPG, setSelectedPG] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [pgDetail, setPgDetail] = useState<any>(null);
  const [mealDetail, setMealDetail] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/pg', { params: { page: 1, limit: 24 } }),
      api.get('/meal', { params: { page: 1, limit: 24 } }),
    ]).then(([pgRes, mealRes]) => {
      setFeaturedPG(pgRes.data?.data?.listings || []);
      setFeaturedMeal(mealRes.data?.data?.services || []);
    }).catch(() => {});
  }, []);

  useGSAP(() => {
    if (heroRef.current) animateHero(heroRef.current);

    const blobs = [blobRef1.current, blobRef2.current, blobRef3.current].filter(Boolean) as HTMLElement[];
    const cleanup = animateBlobsWithTicker(blobs);

    return () => cleanup();
  }, []);

  useGSAP(() => {
    const steps = document.querySelectorAll('.step-card');
    const features = document.querySelectorAll('.feature-card');
    const pills = document.querySelectorAll('.city-pill');
    if (steps.length) animateStepsOnScroll(steps);
    if (features.length) animateFeaturesOnScroll(features);
    if (pills.length) animateCityPills(pills);
    if (testimonialsTrackRef.current) {
      const track = testimonialsTrackRef.current;
      const children = Array.from(track.children) as HTMLElement[];
      children.forEach((child) => {
        const clone = child.cloneNode(true);
        track.appendChild(clone);
      });
      animateTestimonialsScroll(track);
    }
  }, []);

  const openPG = async (pg: any) => {
    setSelectedPG(pg);
    try {
      const r = await api.get(`/pg/${pg._id}`);
      setPgDetail(r.data.data);
    } catch { setPgDetail(null); }
  };

  const openMeal = async (meal: any) => {
    setSelectedMeal(meal);
    try {
      const r = await api.get(`/meal/${meal._id}`);
      setMealDetail(r.data.data);
    } catch { setMealDetail(null); }
  };

  const heroText = splitTextIntoWords('Find Your Perfect Stay and Meal — Anywhere You Go');

  return (
    <div>
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden noise px-4 sm:px-6 py-16 sm:py-20">
        <div ref={blobRef1} className="absolute w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" style={{ position: 'absolute' }} />
        <div ref={blobRef2} className="absolute w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div ref={blobRef3} className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium mb-8">
            <Star size={14} className="text-amber-400" fill="currentColor" />
            <span>Trusted by 50,000+ students & professionals</span>
          </div>

          <h1 className="font-heading page-title text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            dangerouslySetInnerHTML={{ __html: heroText }}
          />

          <p className="hero-sub text-lg md:text-xl opacity-70 mb-10 max-w-2xl mx-auto">
            Discover verified PG accommodations and home-cooked meal services in your city. Your perfect home away from home, sorted.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pg" className="hero-cta flex items-center justify-center gap-3 px-8 py-5 glass rounded-2xl group hover:border-amber-500/60 transition-all">
              <div className="p-2 bg-amber-500 rounded-xl"><Building2 size={20} className="text-white" /></div>
              <div className="text-left">
                <p className="font-heading font-bold text-lg">Find a PG</p>
                <p className="text-xs opacity-60">Verified accommodations</p>
              </div>
              <ArrowRight size={18} className="ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/meals" className="hero-cta flex items-center justify-center gap-3 px-8 py-5 glass rounded-2xl group hover:border-amber-500/60 transition-all">
              <div className="p-2 bg-green-500 rounded-xl"><UtensilsCrossed size={20} className="text-white" /></div>
              <div className="text-left">
                <p className="font-heading font-bold text-lg">Meal Services</p>
                <p className="text-xs opacity-60">Home-cooked goodness</p>
              </div>
              <ArrowRight size={18} className="ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-14">
          <h2 className="font-heading page-title text-3xl md:text-4xl font-bold mb-4">How NestEase Works</h2>
          <p className="opacity-60 max-w-xl mx-auto">Three simple steps to your perfect accommodation and meals</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: <Search size={28} />, title: 'Search & Filter', desc: 'Browse verified PGs and meal services by city, budget, gender, and more.' },
            { step: '02', icon: <Star size={28} />, title: 'Compare & Choose', desc: 'View photos, amenities, reviews, and nearby services to make the best choice.' },
            { step: '03', icon: <CheckCircle size={28} />, title: 'Book & Pay', desc: 'Send booking requests and pay securely once approved by the provider.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="step-card glass rounded-2xl p-8 text-center relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="absolute -top-4 -right-4 text-8xl font-heading font-bold opacity-5">{step}</div>
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                {icon}
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">{title}</h3>
              <p className="text-sm opacity-60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured PG */}
      {featuredPG.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading page-title text-3xl font-bold">PG Listings</h2>
              <p className="opacity-60 text-sm mt-1">Explore available accommodations</p>
            </div>
            <Link to="/pg" className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm hover:border-amber-500/50 transition-all">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPG.map((pg) => <PGCard key={pg._id} pg={pg} onViewDetails={openPG} />)}
          </div>
        </section>
      )}

      {/* Featured Meals */}
      {featuredMeal.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading page-title text-3xl font-bold">Meal Services</h2>
              <p className="opacity-60 text-sm mt-1">Explore available meal providers</p>
            </div>
            <Link to="/meals" className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm hover:border-amber-500/50 transition-all">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMeal.map((meal) => <MealCard key={meal._id} meal={meal} onViewDetails={openMeal} />)}
          </div>
        </section>
      )}

      {/* Why NestEase */}
      <section className="py-20 dot-grid relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-heading page-title text-3xl md:text-4xl font-bold mb-4">Why Choose NestEase?</h2>
            <p className="opacity-60 max-w-xl mx-auto">We make relocating easy, safe, and affordable</p>
          </div>
          {WHY_FEATURES.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY_FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="feature-card glass rounded-2xl p-6 group hover:border-amber-500/40 transition-all">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  {icon}
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{desc}</p>
              </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="font-medium">Feature details will be available shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="pt-14 pb-8 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 text-center">
          <h2 className="font-heading page-title text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="opacity-60">Real stories from real people</p>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div ref={testimonialsTrackRef} className="flex gap-6 w-max">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass rounded-2xl p-6 w-80 shrink-0">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm opacity-70 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs opacity-50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-14 sm:pb-16 text-center">
        <h2 className="font-heading page-title text-3xl font-bold mb-4">Explore by City</h2>
        <p className="opacity-60 mb-6">We're growing across India</p>
        <div className="flex flex-wrap justify-center gap-3 min-h-[2.75rem]">
          {CITIES.map((city) => (
            <Link key={city} to={`/city/${encodeURIComponent(city)}`} aria-label={`Explore listings in ${city}`} className="city-pill glass px-5 py-2.5 rounded-full text-sm font-medium hover:border-amber-500/50 hover:text-amber-500 transition-all">
              {city}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="glass rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-purple-500/10" />
          <div className="relative z-10">
            <h2 className="font-heading page-title text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Nest?</h2>
            <p className="opacity-70 mb-8 max-w-xl mx-auto">Join thousands of students and professionals who found their perfect stay with NestEase.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-3 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors">Get Started Free</Link>
              <Link to="/pg" className="px-8 py-3 glass rounded-full font-semibold hover:border-amber-500/50 transition-all">Browse Listings</Link>
            </div>
          </div>
        </div>
      </section>

      {selectedPG && (
        <PGModal
          pg={selectedPG}
          detail={pgDetail}
          onClose={() => { setSelectedPG(null); setPgDetail(null); }}
          onViewMeal={openMeal}
        />
      )}
      {selectedMeal && (
        <MealModal
          meal={selectedMeal}
          detail={mealDetail}
          onClose={() => { setSelectedMeal(null); setMealDetail(null); }}
          onViewPG={openPG}
        />
      )}
    </div>
  );
};

export default Landing;
