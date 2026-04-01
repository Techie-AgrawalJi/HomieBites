import gsap from 'gsap';
import { Observer } from 'gsap/all';

export const animateModalOpen = (backdrop: Element, panel: Element) => {
  const tl = gsap.timeline();
  tl.from(backdrop, { opacity: 0, scale: 1.1, duration: 0.4, ease: 'power2.out' });
  tl.from(panel, { opacity: 0, y: 80, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.2');
  return tl;
};

export const animateModalClose = (backdrop: Element, panel: Element) => {
  const tl = gsap.timeline();
  tl.to(panel, { opacity: 0, y: 60, duration: 0.3, ease: 'power2.in' });
  tl.to(backdrop, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '-=0.2');
  return tl;
};

export const kenBurnsEffect = (img: HTMLImageElement) => {
  return gsap.fromTo(img, { scale: 1 }, { scale: 1.08, duration: 6, ease: 'power1.inOut', repeat: -1, yoyo: true });
};

export const animatePhotoSwitch = (outgoing: Element, incoming: Element, direction: 'left' | 'right' = 'right') => {
  const xFrom = direction === 'right' ? '100%' : '-100%';
  const xTo = direction === 'right' ? '-100%' : '100%';
  const tl = gsap.timeline();
  tl.to(outgoing, { clipPath: `inset(0 ${direction === 'right' ? '100%' : '0'} 0 ${direction === 'right' ? '0' : '100%'})`, x: xTo, duration: 0.35, ease: 'power2.inOut' });
  tl.fromTo(incoming, { clipPath: `inset(0 ${direction === 'right' ? '0' : '100%'} 0 ${direction === 'right' ? '100%' : '0'})`, x: xFrom, opacity: 1 }, { clipPath: 'inset(0 0 0 0)', x: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.15');
  return tl;
};

export const animateThumbnailStrip = (thumbs: NodeListOf<Element>) => {
  return gsap.from(thumbs, { opacity: 0, y: 30, stagger: 0.08, duration: 0.4, ease: 'power2.out' });
};

export const animateParallaxOnMouseMove = (img: HTMLImageElement, container: HTMLElement) => {
  const handler = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    gsap.to(img, { x, y, duration: 0.4, ease: 'power1.out' });
  };
  container.addEventListener('mousemove', handler);
  return () => container.removeEventListener('mousemove', handler);
};

export const animateMenuCards = (cards: NodeListOf<Element>, options?: { mobileSafe?: boolean }) => {
  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  const mobileSafe = options?.mobileSafe ?? true;

  gsap.killTweensOf(cards);
  gsap.set(cards, { clearProps: 'transform,transformPerspective,opacity' });

  return gsap.from(cards, {
    opacity: 0,
    rotateX: mobileSafe && isMobileViewport ? 0 : -12,
    y: 22,
    stagger: 0.08,
    duration: 0.42,
    ease: 'power2.out',
    transformPerspective: mobileSafe && isMobileViewport ? 0 : 600,
    onComplete: () => {
      gsap.set(cards, { opacity: 1, clearProps: 'transform,transformPerspective,opacity' });
    },
    onInterrupt: () => {
      gsap.set(cards, { opacity: 1, clearProps: 'transform,transformPerspective,opacity' });
    },
  });
};

export const animateNearbyCards = (
  cards: NodeListOf<Element>,
  options?: { trigger?: Element; scroller?: Element; horizontal?: boolean }
) => {
  const anims: gsap.core.Tween[] = [];

  cards.forEach((card, i) => {
    anims.push(
      gsap.from(card, {
        opacity: 0,
        x: 60,
        delay: i * 0.03,
        duration: 0.45,
        ease: 'power2.out',
        scrollTrigger: options?.trigger
          ? {
              trigger: card,
              scroller: options.scroller,
              horizontal: !!options.horizontal,
              start: options.horizontal ? 'left 92%' : 'top 85%',
              toggleActions: 'play none none none',
            }
          : undefined,
      })
    );
  });

  return anims;
};

export const attachHorizontalObserver = (container: HTMLElement) => {
  const scrollBy = (delta: number, event?: Event) => {
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    if (maxScrollLeft <= 0) return;

    const next = Math.max(0, Math.min(maxScrollLeft, container.scrollLeft + delta));
    if (next === container.scrollLeft) return;

    event?.preventDefault();
    gsap.to(container, {
      scrollLeft: next,
      duration: 0.2,
      overwrite: 'auto',
      ease: 'power2.out',
    });
  };

  const obs = Observer.create({
    target: container,
    type: 'wheel,touch,pointer',
    preventDefault: false,
    onChangeX: (self) => {
      scrollBy(self.deltaX, self.event as Event | undefined);
    },
    onChangeY: (self) => {
      scrollBy(self.deltaY, self.event as Event | undefined);
    },
  });

  return () => obs.kill();
};
