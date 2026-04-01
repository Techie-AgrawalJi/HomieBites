import gsap from 'gsap';

export const pageOut = () => {
  const overlay = document.getElementById('page-overlay');
  if (!overlay) return Promise.resolve();
  return new Promise<void>((resolve) => {
    gsap.to(overlay, { opacity: 1, duration: 0.25, ease: 'power2.in', pointerEvents: 'all', onComplete: resolve });
  });
};

export const pageIn = () => {
  const overlay = document.getElementById('page-overlay');
  if (!overlay) return;
  gsap.to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.out', delay: 0.05, pointerEvents: 'none' });
};

export const animateFormFields = (fields: NodeListOf<Element>) => {
  return gsap.from(fields, {
    opacity: 0,
    y: 20,
    stagger: 0.1,
    duration: 0.4,
    ease: 'power2.out',
  });
};

export const animateTabSwitch = (outgoing: Element | null, incoming: Element) => {
  const tl = gsap.timeline();
  if (outgoing) tl.to(outgoing, { opacity: 0, x: -30, duration: 0.2, ease: 'power2.in' });
  tl.from(incoming, { opacity: 0, x: 30, duration: 0.3, ease: 'power2.out' });
  return tl;
};

export const animateRoleCardBorder = (card: HTMLElement, selected: boolean) => {
  if (selected) {
    gsap.to(card, { borderColor: '#f59e0b', boxShadow: '0 0 0 2px #f59e0b', duration: 0.3, ease: 'power2.out' });
  } else {
    gsap.to(card, { borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 0 0 0px transparent', duration: 0.3, ease: 'power2.out' });
  }
};
