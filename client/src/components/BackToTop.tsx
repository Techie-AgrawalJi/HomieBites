import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import gsap from 'gsap';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTop = () => gsap.to(window, { scrollTo: 0, duration: 0.8, ease: 'power3.inOut' });

  if (!visible) return null;

  return (
    <button
      onClick={scrollTop}
      className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 p-2.5 sm:p-3 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-colors"
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default BackToTop;
