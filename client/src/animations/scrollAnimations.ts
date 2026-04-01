import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';

export const animateStepsOnScroll = (steps: NodeListOf<Element>) => {
  steps.forEach((step, i) => {
    gsap.from(step, {
      opacity: 0,
      x: i % 2 === 0 ? -60 : 60,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: step,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });
};

export const animateFeaturesOnScroll = (cards: NodeListOf<Element>) => {
  gsap.fromTo(cards,
    {
      opacity: 0,
      scale: 0.9,
      y: 40,
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: 'back.out(1.4)',
      clearProps: 'opacity,transform',
      immediateRender: false,
      scrollTrigger: {
        trigger: cards[0]?.parentElement || cards[0],
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    }
  );

  // Safety fallback: keep cards visible even if ScrollTrigger fails to initialize.
  gsap.set(cards, { opacity: 1 });
};

export const animateCityPills = (pills: NodeListOf<Element>) => {
  gsap.fromTo(
    pills,
    {
      opacity: 0,
      y: 20,
      scale: 0.8,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      stagger: 0.05,
      duration: 0.4,
      ease: 'back.out(1.6)',
      clearProps: 'opacity,transform',
      immediateRender: false,
      scrollTrigger: {
        trigger: pills[0]?.parentElement || pills[0],
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    }
  );

  // Safety fallback: keep pills visible even if ScrollTrigger fails to initialize.
  gsap.set(pills, { opacity: 1 });
};

export const animatePricingRows = (rows: NodeListOf<Element>) => {
  rows.forEach((row, i) => {
    gsap.from(row, {
      opacity: 0,
      x: -30,
      duration: 0.4,
      delay: i * 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: row,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
};

export const animateTestimonialsScroll = (track: HTMLElement) => {
  const totalWidth = track.scrollWidth / 2;
  return gsap.to(track, {
    x: -totalWidth,
    duration: totalWidth / 60,
    ease: 'none',
    repeat: -1,
  });
};

export const refreshScrollTrigger = () => ScrollTrigger.refresh();
