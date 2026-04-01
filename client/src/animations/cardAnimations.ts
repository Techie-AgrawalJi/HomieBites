import gsap from 'gsap';

export const animateCardsIn = (cards: NodeListOf<Element> | Element[]) => {
  return gsap.from(cards, {
    opacity: 0,
    y: 50,
    stagger: 0.08,
    duration: 0.6,
    ease: 'power2.out',
    clearProps: 'opacity,transform',
  });
};

export const animateCardsOut = (cards: NodeListOf<Element> | Element[]) => {
  return gsap.to(cards, {
    opacity: 0,
    y: -30,
    stagger: 0.04,
    duration: 0.3,
    ease: 'power2.in',
  });
};

export const addCardHover = (card: HTMLElement) => {
  const enter = () => {
    gsap.to(card, { scale: 1.03, y: -6, duration: 0.3, ease: 'power2.out', boxShadow: '0 20px 60px rgba(245,158,11,0.2)' });
  };
  const leave = () => {
    gsap.to(card, { scale: 1, y: 0, duration: 0.3, ease: 'power2.inOut', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' });
  };
  card.addEventListener('mouseenter', enter);
  card.addEventListener('mouseleave', leave);
  return () => {
    card.removeEventListener('mouseenter', enter);
    card.removeEventListener('mouseleave', leave);
  };
};

export const animateCountUp = (el: Element, endValue: number, duration = 1.5) => {
  const obj = { val: 0 };
  return gsap.to(obj, {
    val: endValue,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = Math.round(obj.val).toString();
    },
  });
};

export const animateStatCards = (cards: NodeListOf<Element>) => {
  gsap.from(cards, { opacity: 0, y: 40, stagger: 0.12, duration: 0.5, ease: 'back.out(1.4)' });
};

export const shakeElement = (el: Element) => {
  gsap.fromTo(el, { x: 0 }, { x: 10, repeat: 5, yoyo: true, duration: 0.07, ease: 'power1.inOut', onComplete: () => gsap.set(el, { x: 0 }) });
};
