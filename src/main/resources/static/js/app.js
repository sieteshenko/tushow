// Arranque y navegación: #/, #/artista/{slug}, #/publicar, #/reservas, #/favoritos
import { renderArtist } from './artist.js';
import { initBanner, setFeatured } from './banner.js';
import { initBookings } from './bookings.js';
import { initCatalog, renderCatalog, renderFavorites } from './catalog.js';
import { enableDragScroll } from './drag-scroll.js';
import { initPublish } from './publish.js';
import { loadArtists, store } from './store.js';

const VIEWS = ['inicio', 'artista', 'publicar', 'reservas', 'favoritos'];

function currentRoute() {
  const [, name = '', param = ''] = location.hash.split('/');
  const view = VIEWS.includes(name) ? name : 'inicio';
  try {
    return { view, param: decodeURIComponent(param) };
  } catch {
    return { view, param: '' };
  }
}

function showRoute() {
  const { view, param } = currentRoute();
  for (const name of VIEWS) document.getElementById(`view-${name}`).hidden = name !== view;

  const tab = view === 'artista' ? 'inicio' : view;
  for (const link of document.querySelectorAll('.tab')) {
    if (link.dataset.view === tab) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  if (view === 'artista') renderArtist(param);
  if (view === 'favoritos') renderFavorites();
}

async function refresh() {
  const loading = loadArtists();
  renderCatalog();
  await loading;
  renderCatalog();
  setFeatured(store.artists);
  if (['artista', 'favoritos'].includes(currentRoute().view)) showRoute();
}

initBanner();
initCatalog(refresh);
initPublish();
initBookings();
enableDragScroll();

window.addEventListener('hashchange', () => {
  showRoute();
  window.scrollTo(0, 0);
  document.querySelector('.view:not([hidden]) .view-title')?.focus({ preventScroll: true });
});

showRoute();
refresh();
