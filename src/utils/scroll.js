import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Links Lenis inertia, the scrubbed camera path and chapter navigation.
export function connectScroll(experience) {
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.1,
  });
  lenis.on('scroll', (event) => {
    ScrollTrigger.update();
    experience.setScrollVelocity(event.velocity);
  });
  const ticker = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(ticker);
  gsap.ticker.lagSmoothing(0);

  const journey = document.querySelector('#journey');
  const chapterCopies = document.querySelectorAll('.chapter-copy');
  const chapters = document.querySelectorAll('.chapter');
  const chapterButtons = document.querySelectorAll('.nav-labels button');
  const syncJourney = (progress) => {
    const boundedProgress = Math.max(0, Math.min(progress, 1));
    const current = experience.setScrollProgress(boundedProgress);
    document.querySelector('#counter-current').textContent = `0${current + 1}`;
    document.querySelector('#nav-progress-fill').style.transform = `scaleX(${boundedProgress})`;
    chapterCopies.forEach((copy, index) => {
      copy.classList.toggle('is-active', index === current);
    });
    chapters.forEach((chapter, index) => {
      chapter.classList.toggle('is-active', index === current);
    });
    chapterButtons.forEach((button, index) => {
      button.classList.toggle('is-active', index === current);
    });
  };
  const scrollTrigger = ScrollTrigger.create({
    trigger: journey,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => syncJourney(self.progress),
  });

  document.querySelectorAll('[data-scroll-to]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.chapterIndex);
      const transitionPoint = index / (chapterCopies.length - 1);
      const destination = transitionPoint * (document.documentElement.scrollHeight - window.innerHeight);
      lenis.scrollTo(destination, { duration: 1.35 });
    });
  });

  ScrollTrigger.refresh();
  syncJourney(scrollTrigger.progress);

  return () => {
    scrollTrigger.kill();
    gsap.ticker.remove(ticker);
    lenis.destroy();
  };
}
