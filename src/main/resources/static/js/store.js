import { api } from './api.js';
import { safeImageUrl } from './util.js';

const FAVORITES_KEY = 'showbook.favoritos';

export const store = { artists: [], status: 'loading', error: '' };

// Adapta ArtistaResponse al formato que usan las vistas.
function toArtist(dto) {
  return {
    id: dto.id,
    slug: dto.slug || String(dto.id),
    name: dto.nombreArtistico || '',
    bio: dto.biografia || '',
    region: dto.region || '',
    city: dto.comuna || '',
    icon: dto.icono || '🎭',
    image: safeImageUrl(dto.urlImagenPerfil),
    featured: Boolean(dto.destacado),
    categories: dto.categorias || [],
    packages: (dto.paquetes || []).map((p) => ({
      id: p.id,
      name: p.nombre || '',
      description: p.descripcion || '',
      minutes: p.duracionMinutos,
      price: Number(p.precio),
    })),
    gallery: (dto.galeria || [])
      .map((m) => ({ url: safeImageUrl(m.url), kind: m.tipo === 'VIDEO' ? 'video' : 'image' }))
      .filter((m) => m.url),
    availability: (dto.disponibilidades || []).map((d) => ({
      date: d.fecha,
      from: d.horaDesde?.slice(0, 5) || null,
      to: d.horaHasta?.slice(0, 5) || null,
    })),
  };
}

export async function loadArtists() {
  store.status = 'loading';
  try {
    const artists = (await api.artistas()).map(toArtist);
    store.artists = artists.sort((a, b) => Number(b.featured) - Number(a.featured));
    store.status = 'ready';
  } catch (error) {
    store.status = 'error';
    store.error = error.message;
  }
}

function readFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []);
  } catch {
    return new Set();
  }
}

const favorites = readFavorites();

export const isFavorite = (id) => favorites.has(id);

export function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Sin almacenamiento (modo privado): se mantiene solo durante la visita.
  }
}
