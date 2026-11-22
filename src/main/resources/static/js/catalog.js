import { createCalendar } from './calendar.js';
import { REGIONES } from './regiones.js';
import { isFavorite, store } from './store.js';
import { formatDate, h, money, normalize, toISODate } from './util.js';

// Texto del chip → nombre de la categoría en la base de datos.
const CATEGORIES = [
  ['Todos', ''],
  ['Música', 'Música en vivo'],
  ['Danza', 'Danza'],
  ['Teatro', 'Teatro'],
  ['Circo', 'Circo'],
  ['Magia', 'Magia'],
  ['Comedia', 'Stand up comedy'],
  ['DJ', 'DJ'],
  ['Otros', 'Otro'],
];
const MUSIC = ['Música en vivo'];
const FAMILY = ['Teatro', 'Circo', 'Magia'];

const filters = { text: '', category: '', region: '', date: '' };
let onRetry = () => {};

export function photo(artist) {
  const fallback = () => h('span', { class: 'photo-icon', 'aria-hidden': 'true' }, artist.icon);
  if (!artist.image) return h('div', { class: 'photo' }, fallback());
  const image = h('img', { src: artist.image, alt: '', loading: 'lazy', draggable: 'false' });
  image.addEventListener('error', () => image.replaceWith(fallback()));
  return h('div', { class: 'photo' }, image);
}

function card(artist) {
  const prices = artist.packages.map((p) => p.price);
  return h('a', { class: 'card', href: `#/artista/${encodeURIComponent(artist.slug)}`, draggable: 'false' },
    photo(artist),
    artist.featured && h('span', { class: 'badge' }, 'Destacado'),
    h('h3', {}, artist.name),
    h('p', { class: 'category' }, [artist.categories.join(', '), artist.city].filter(Boolean).join(' - ')),
    h('p', { class: 'stats' }, prices.length ? `Desde ${money(Math.min(...prices))}` : 'Precio por confirmar'));
}

function rowSection(title, artists, index) {
  const id = `row-${index}`;
  const row = h('div', { class: 'row scroller', role: 'region', tabindex: '0', 'aria-labelledby': id }, artists.map(card));
  const next = h('button', {
    type: 'button',
    class: 'next',
    'aria-label': `Ver más: ${title}`,
    onclick: () => {
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;
      row.scrollTo({ left: atEnd ? 0 : row.scrollLeft + 194, behavior: 'smooth' });
    },
  }, h('img', { src: 'assets/chevron.svg', alt: '' }));

  return h('section', { class: 'shows' },
    h('div', { class: 'section-head' }, h('h2', { id }, title), next),
    row);
}

function gridSection(title, artists, emptyText, action) {
  return h('section', { class: 'results' },
    h('div', { class: 'section-head' }, h('h2', {}, title), action),
    artists.length
      ? h('div', { class: 'card-grid' }, artists.map(card))
      : h('p', { class: 'state' }, emptyText));
}

function statusMessage() {
  if (store.status === 'loading') return h('p', { class: 'state', role: 'status' }, 'Cargando shows…');
  if (store.status !== 'error') return null;
  return h('div', { class: 'state', role: 'alert' },
    h('p', {}, `No pudimos cargar los shows. ${store.error}`),
    h('button', { type: 'button', class: 'secondary', onclick: () => onRetry() }, 'Reintentar'));
}

function filteredArtists() {
  const text = normalize(filters.text.trim());
  return store.artists.filter((artist) =>
    (!filters.category || artist.categories.includes(filters.category))
    && (!filters.region || artist.region === filters.region)
    && (!filters.date || artist.availability.some((slot) => slot.date === filters.date))
    && (!text || normalize([artist.name, artist.city, artist.bio, ...artist.categories].join(' ')).includes(text)));
}

// Sin filtros se muestran las filas del diseño; todo artista aparece al menos en una.
function homeRows(artists) {
  const today = toISODate();
  const availableToday = artists.filter((a) => a.availability.some((slot) => slot.date === today));
  const upcoming = artists.filter((a) => a.availability.some((slot) => slot.date >= today));

  const rows = [
    availableToday.length
      ? ['Disponibles hoy cerca de ti', availableToday]
      : ['Próximas fechas disponibles', upcoming],
    ['Música en vivo', artists.filter((a) => a.categories.some((c) => MUSIC.includes(c)))],
    ['Teatro para toda la familia', artists.filter((a) => a.categories.some((c) => FAMILY.includes(c)))],
  ];
  const shown = new Set(rows.flatMap(([, list]) => list));
  rows.push(['Más shows', artists.filter((a) => !shown.has(a))]);

  return rows
    .filter(([, list]) => list.length)
    .map(([title, list], index) => rowSection(title, list, index));
}

export function renderCatalog() {
  const container = document.getElementById('catalog');
  const message = statusMessage();
  if (message) return container.replaceChildren(message);

  const artists = filteredArtists();
  // La región no cambia la distribución: acota las filas a esa zona.
  if (filters.text.trim() || filters.category || filters.date) {
    const title = filters.date ? `Disponibles el ${formatDate(filters.date)}` : 'Resultados';
    const clear = h('button', { type: 'button', class: 'link', onclick: clearFilters }, 'Limpiar');
    return container.replaceChildren(gridSection(title, artists, 'No hay shows que coincidan con tu búsqueda.', clear));
  }
  if (!artists.length) {
    const text = filters.region ? 'Todavía no hay shows en esta región.' : 'Todavía no hay shows publicados.';
    return container.replaceChildren(h('p', { class: 'state' }, text));
  }
  container.replaceChildren(...homeRows(artists));
}

export function renderFavorites() {
  document.getElementById('favorites-list').replaceChildren(
    statusMessage()
      || gridSection('Tus shows guardados', store.artists.filter((a) => isFavorite(a.id)),
        'Aún no tienes favoritos. Guárdalos desde la ficha de cada artista.'));
}

function syncControls() {
  document.getElementById('search-input').value = filters.text;
  document.getElementById('date-button').setAttribute('aria-pressed', String(Boolean(filters.date)));
  for (const chip of document.querySelectorAll('#chips button')) {
    chip.setAttribute('aria-pressed', String(chip.dataset.category === filters.category));
  }
}

function clearFilters() {
  Object.assign(filters, { text: '', category: '', date: '' });
  syncControls();
  renderCatalog();
  document.getElementById('search-input').focus();
}

export function initCatalog(retry) {
  onRetry = retry;

  document.getElementById('chips').replaceChildren(...CATEGORIES.map(([label, category]) =>
    h('button', {
      type: 'button',
      'data-category': category,
      onclick: () => {
        filters.category = category;
        syncControls();
        renderCatalog();
      },
    }, label)));

  const region = document.getElementById('region-filter');
  region.append(...REGIONES.map((r) => h('option', { value: r.region }, r.region)));
  region.addEventListener('change', () => {
    filters.region = region.value;
    renderCatalog();
  });

  const search = document.getElementById('search-input');
  search.addEventListener('input', () => {
    filters.text = search.value;
    renderCatalog();
  });
  document.getElementById('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    search.blur();
  });

  const dialog = document.getElementById('date-dialog');
  const setDate = (date) => {
    filters.date = date;
    syncControls();
    renderCatalog();
    dialog.close();
  };
  document.getElementById('date-button').addEventListener('click', () => {
    createCalendar(document.getElementById('date-calendar'), {
      startAt: filters.date,
      isSelected: (iso) => iso === filters.date,
      onPick: setDate,
    });
    dialog.showModal();
  });
  document.getElementById('date-clear').addEventListener('click', () => setDate(''));
  document.getElementById('date-close').addEventListener('click', () => dialog.close());

  syncControls();
}

