import gsap from 'gsap';

export const animateHero = (container: Element) => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  const badge = container.querySelector('.hero-badge');
  const words = container.querySelectorAll('.hero-word');
  const sub = container.querySelector('.hero-sub');
  const cards = container.querySelectorAll('.hero-cta');

  if (badge) tl.from(badge, { opacity: 0, y: 30, duration: 0.6 });
  if (words.length) tl.from(words, { opacity: 0, y: 40, stagger: 0.05, duration: 0.5 }, '-=0.2');
  if (sub) tl.from(sub, { opacity: 0, y: 20, duration: 0.5 }, '-=0.2');
  if (cards.length) tl.from(cards, { opacity: 0, y: 60, scale: 0.9, stagger: 0.15, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.2');

  return tl;
};

export const animateNavbar = (el: Element) => {
  return gsap.from(el, { y: -80, opacity: 0, duration: 0.8, ease: 'power3.out' });
};

export const animateBlobsWithTicker = (blobs: HTMLElement[]) => {
  const positions = blobs.map(() => ({ x: Math.random() * 100, y: Math.random() * 100, vx: (Math.random() - 0.5) * 0.03, vy: (Math.random() - 0.5) * 0.03 }));
  const tick = () => {
    blobs.forEach((blob, i) => {
      positions[i].x += positions[i].vx;
      positions[i].y += positions[i].vy;
      if (positions[i].x < 0 || positions[i].x > 80) positions[i].vx *= -1;
      if (positions[i].y < 0 || positions[i].y > 80) positions[i].vy *= -1;
      blob.style.left = positions[i].x + '%';
      blob.style.top = positions[i].y + '%';
    });
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
};

export const splitTextIntoWords = (text: string): string => {
  return text
    .split(' ')
    .map((word) => `<span class="hero-word inline-block">${word}</span>`)
    .join(' ');
};
