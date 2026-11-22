// Solicitud de publicación de artistas.
import { api } from './api.js';
import { createCalendar } from './calendar.js';
import { REGIONES } from './regiones.js';
import { formatDate, h } from './util.js';

const DEFAULT_HOURS = { horaDesde: '18:00', horaHasta: '23:00' };

// Deben coincidir con MediaStorage y application.properties.
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };
const MAX_GALLERY = 6;
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_TOTAL = 115 * 1024 * 1024;

// Achica la foto y la vuelve a codificar: pesa menos y pierde los metadatos, como la ubicación GPS.
async function prepareImage(file, maxSide) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error(`${file.name}: usa una imagen JPG, PNG o WebP.`);
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name}: no pudimos leer la imagen.`);
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#1e1e1e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error(`${file.name}: no pudimos procesar la imagen.`);
  return { blob, name: 'foto.jpg', kind: 'image', url: URL.createObjectURL(blob) };
}

function prepareVideo(file) {
  const extension = VIDEO_TYPES[file.type];
  if (!extension) throw new Error(`${file.name}: usa un video MP4, MOV o WebM.`);
  if (file.size > MAX_VIDEO) throw new Error(`${file.name}: el video supera los 50 MB.`);
  return { blob: file, name: `video.${extension}`, kind: 'video', url: URL.createObjectURL(file) };
}

function packageRow(name = '', minutes = '') {
  const row = h('fieldset', { class: 'package-row' },
    h('input', { name: 'paquete-nombre', placeholder: 'Ej: Show acústico', 'aria-label': 'Nombre de la opción', value: name, required: true }),
    h('input', { name: 'paquete-minutos', type: 'number', min: '1', placeholder: 'Minutos', 'aria-label': 'Duración en minutos', value: minutes, required: true }),
    h('input', { name: 'paquete-precio', type: 'number', min: '1', placeholder: 'Precio CLP', 'aria-label': 'Precio en pesos', required: true }),
    h('button', { type: 'button', class: 'remove', 'aria-label': 'Quitar opción', onclick: () => row.remove() }, '✕'),
    h('textarea', { name: 'paquete-descripcion', placeholder: 'Describe esta opción de show', 'aria-label': 'Descripción de la opción' }));
  return row;
}

export function initPublish() {
  const form = document.getElementById('publish-form');
  const { elements } = form;
  const packageList = document.getElementById('publish-packages');
  const hoursList = document.getElementById('publish-hours');
  const status = document.getElementById('publish-status');
  const submit = form.querySelector('[type="submit"]');
  const availability = new Map();

  const photoInput = elements.foto;
  const photoPreview = document.getElementById('publish-photo-preview');
  const photoRemove = document.getElementById('publish-photo-remove');
  const photoStatus = document.getElementById('photo-status');
  const galleryInput = elements.galeria;
  const galleryList = document.getElementById('publish-gallery');
  const galleryAdd = document.getElementById('gallery-add');
  const galleryStatus = document.getElementById('gallery-status');
  let photo = null;
  const gallery = [];

  const totalSize = () => (photo?.blob.size || 0) + gallery.reduce((sum, item) => sum + item.blob.size, 0);

  const fillCities = () => {
    const region = REGIONES.find((r) => r.region === elements.region.value);
    elements.comuna.replaceChildren(...region.comunas.map((name) => h('option', { value: name }, name)));
  };
  elements.region.append(...REGIONES.map((r) => h('option', { value: r.region }, r.region)));
  elements.region.addEventListener('change', fillCities);
  fillCities();

  function renderPhoto() {
    photoPreview.replaceChildren(photo
      ? h('img', { src: photo.url, alt: '' })
      : h('span', { class: 'photo-icon' }, elements.icono.value));
    photoRemove.hidden = !photo;
  }

  function setPhoto(item) {
    if (photo) URL.revokeObjectURL(photo.url);
    photo = item;
    renderPhoto();
  }

  elements.icono.addEventListener('change', renderPhoto);
  photoRemove.addEventListener('click', () => {
    setPhoto(null);
    photoStatus.textContent = '';
  });
  photoInput.addEventListener('change', async () => {
    const [file] = photoInput.files;
    photoInput.value = '';
    if (!file) return;
    photoStatus.textContent = 'Preparando foto…';
    try {
      const item = await prepareImage(file, 1200);
      if (totalSize() - (photo?.blob.size || 0) + item.blob.size > MAX_TOTAL) {
        URL.revokeObjectURL(item.url);
        throw new Error('Se supera el máximo de 115 MB entre todos los archivos.');
      }
      setPhoto(item);
      photoStatus.textContent = '';
    } catch (error) {
      photoStatus.textContent = error.message;
    }
  });

  function renderGallery() {
    galleryList.replaceChildren(...gallery.map((item, index) =>
      h('div', { class: 'media-item' },
        item.kind === 'image'
          ? h('img', { src: item.url, alt: '' })
          : h('video', { src: item.url, muted: true, playsinline: true, preload: 'metadata' }),
        item.kind === 'video' && h('span', { class: 'media-kind' }, '▶ Video'),
        h('button', {
          type: 'button',
          class: 'remove',
          'aria-label': `Quitar ${item.kind === 'image' ? 'foto' : 'video'} ${index + 1}`,
          onclick: () => {
            URL.revokeObjectURL(item.url);
            gallery.splice(index, 1);
            galleryStatus.textContent = '';
            renderGallery();
          },
        }, '✕'))));
    galleryAdd.hidden = gallery.length >= MAX_GALLERY;
  }

  galleryInput.addEventListener('change', async () => {
    const files = [...galleryInput.files];
    galleryInput.value = '';
    if (!files.length) return;

    const problems = [];
    galleryStatus.textContent = 'Preparando archivos…';
    for (const file of files) {
      if (gallery.length >= MAX_GALLERY) {
        problems.push(`Puedes subir hasta ${MAX_GALLERY} archivos.`);
        break;
      }
      try {
        if (!IMAGE_TYPES.includes(file.type) && !VIDEO_TYPES[file.type]) {
          throw new Error(`${file.name}: usa una foto JPG, PNG o WebP, o un video MP4, MOV o WebM.`);
        }
        const item = file.type.startsWith('video/') ? prepareVideo(file) : await prepareImage(file, 1920);
        if (totalSize() + item.blob.size > MAX_TOTAL) {
          URL.revokeObjectURL(item.url);
          throw new Error(`${file.name}: se supera el máximo de 115 MB entre todos los archivos.`);
        }
        gallery.push(item);
      } catch (error) {
        problems.push(error.message);
      }
    }
    renderGallery();
    galleryStatus.textContent = problems.join(' ');
  });

  function renderHours() {
    hoursList.replaceChildren(...[...availability].sort(([a], [b]) => a.localeCompare(b)).map(([date, hours]) => {
      const input = (key, label) => h('label', { class: 'field' },
        h('span', {}, label),
        h('input', {
          type: 'time',
          required: true,
          value: hours[key],
          onchange: (event) => { hours[key] = event.target.value; },
        }));
      return h('div', { class: 'hours-row' },
        h('strong', {}, formatDate(date)), input('horaDesde', 'Desde'), input('horaHasta', 'Hasta'));
    }));
  }

  const calendar = createCalendar(document.getElementById('publish-calendar'), {
    isSelected: (iso) => availability.has(iso),
    onPick: (iso) => {
      if (availability.has(iso)) availability.delete(iso);
      else availability.set(iso, { ...DEFAULT_HOURS });
      renderHours();
    },
  });

  function reset() {
    form.reset();
    fillCities();
    availability.clear();
    renderHours();
    calendar.render();
    packageList.replaceChildren(packageRow('Show mínimo', '15'));
    setPhoto(null);
    gallery.splice(0).forEach((item) => URL.revokeObjectURL(item.url));
    renderGallery();
    photoStatus.textContent = '';
    galleryStatus.textContent = '';
  }

  document.getElementById('add-package').addEventListener('click', () => {
    const row = packageRow();
    packageList.append(row);
    row.querySelector('input').focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = (name) => elements[name].value.trim();
    const paquetes = [...packageList.children].map((row) => {
      const value = (name) => row.querySelector(`[name="paquete-${name}"]`).value.trim();
      return {
        nombre: value('nombre'),
        descripcion: value('descripcion'),
        duracionMinutos: Number(value('minutos')),
        precio: Number(value('precio')),
      };
    });

    let problem = '';
    if (!text('nombreArtistico') || !text('nombreContacto') || !text('correoContacto') || !text('biografia')) {
      problem = 'Completa nombre artístico, nombre de contacto, correo y descripción.';
    } else if (!paquetes.length) {
      problem = 'Agrega al menos una opción de duración y precio.';
    } else if (!availability.size) {
      problem = 'Selecciona al menos un día disponible.';
    } else if ([...availability.values()].some((slot) => slot.horaHasta <= slot.horaDesde)) {
      problem = 'La hora de término debe ser posterior a la de inicio.';
    }
    if (problem) {
      status.textContent = problem;
      return;
    }

    const hasFiles = Boolean(photo || gallery.length);
    submit.disabled = true;
    status.textContent = hasFiles ? 'Subiendo archivos… 0%' : 'Enviando solicitud…';
    try {
      const artist = await api.crearArtista({
        nombreArtistico: text('nombreArtistico'),
        nombreContacto: text('nombreContacto'),
        correoContacto: text('correoContacto'),
        telefonoContacto: text('telefonoContacto') || null,
        biografia: text('biografia'),
        region: text('region'),
        comuna: text('comuna'),
        icono: elements.icono.value,
        categoria: text('categoria'),
        paquetes,
        disponibilidades: [...availability]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([fecha, hours]) => ({ fecha, ...hours })),
      }, { foto: photo, galeria: gallery }, (progress) => {
        if (!hasFiles) return;
        status.textContent = progress < 1
          ? `Subiendo archivos… ${Math.floor(progress * 100)}%`
          : 'Guardando solicitud…';
      });
      reset();
      status.textContent = `¡Solicitud recibida! ${artist.nombreArtistico} quedó pendiente de revisión.`;
    } catch (error) {
      status.textContent = `No pudimos registrar el show: ${error.message}`;
    } finally {
      submit.disabled = false;
    }
  });

  reset();
}
