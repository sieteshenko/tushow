/**
 * Crea un elemento. Los textos se insertan siempre como texto y nunca como HTML,
 * porque nombres, biografías y paquetes los escribe cualquier visitante.
 */
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else if (key === 'value') element.value = value;
    else element.setAttribute(key, value === true ? '' : value);
  }
  element.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
  return element;
}

export const money = (value) => `$${Math.round(Number(value) || 0).toLocaleString('es-CL')}`;

// Fecha local: toISOString() usa UTC y en Chile adelanta un día por la noche.
export function toISODate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(iso) {
  if (!iso) return 'Sin fecha';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const normalize = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function safeImageUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
