import { Experience } from './scenes/Experience.js';
import { loadArtworks } from './utils/assets.js';
import { connectScroll } from './utils/scroll.js';
import './style.css';

const loading = document.querySelector('#loading');
const loadingMessage = document.querySelector('#loading-message');
const loadingProgress = document.querySelector('#loading-progress');
const loadingPercent = document.querySelector('#loading-percent');
let experience;
let disconnectScroll;

loadArtworks((progress) => {
  loadingProgress.style.width = `${progress}%`;
  loadingPercent.textContent = `${progress}%`;
}).then((artworks) => {
  experience = new Experience(document.querySelector('#gallery-canvas'), artworks);
  disconnectScroll = connectScroll(experience);
  loading.classList.add('is-hidden');
  document.body.classList.add('is-ready');
}).catch((error) => {
  console.error('Unable to start the gallery.', error);
  loadingMessage.textContent = 'Аялал нээгдсэнгүй. Интернэт холболт болон графикийн тохиргоогоо шалгаад хуудсыг дахин ачаална уу.';
  loadingMessage.classList.add('loading-error');
});

window.addEventListener('pagehide', () => {
  disconnectScroll?.();
  experience?.dispose();
}, { once: true });
