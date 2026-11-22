// Ficha del artista y flujo de reserva.
import { api } from './api.js';
import { createCalendar } from './calendar.js';
import { photo } from './catalog.js';
import { isFavorite, store, toggleFavorite } from './store.js';
import { formatDate, h, money, toISODate, toMinutes, toTime } from './util.js';

function field(label, control) {
  return h('label', { class: 'field' }, h('span', {}, label), control);
}

// Rango de horas de inicio en el que el paquete cabe completo, o null si no cabe.
function startWindow(slot, pkg) {
  if (!slot?.from || !slot?.to || !pkg?.minutes) return null;
  let first = toMinutes(slot.from);
  const last = toMinutes(slot.to) - pkg.minutes;
  if (slot.date === toISODate()) {
    const now = new Date();
    first = Math.max(first, now.getHours() * 60 + now.getMinutes() + 1);
  }
  return first <= last ? { first, last } : null;
}

// Fotos y videos del artista. Las fotos se amplían en un diálogo.
function gallerySection(artist) {
  if (!artist.gallery.length) return null;

  const viewer = h('dialog', { class: 'media-viewer', 'aria-label': `Foto de ${artist.name}` });
  const close = () => viewer.close();
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) close();
  });

  const items = artist.gallery.map((item, index) => {
    if (item.kind === 'video') {
      return h('video', {
        class: 'media-item',
        src: item.url,
        controls: true,
        playsinline: true,
        preload: 'metadata',
        'aria-label': `Video ${index + 1} de ${artist.name}`,
      });
    }
    const label = `Foto ${index + 1} de ${artist.name}`;
    return h('button', {
      type: 'button',
      class: 'media-item',
      'aria-label': `Ampliar ${label.toLowerCase()}`,
      onclick: () => {
        viewer.replaceChildren(
          h('img', { src: item.url, alt: label }),
          h('button', { type: 'button', class: 'secondary', onclick: close }, 'Cerrar'));
        viewer.showModal();
      },
    }, h('img', { src: item.url, alt: '', loading: 'lazy' }));
  });

  return h('section', { class: 'gallery-section' },
    h('h3', { class: 'step' }, 'Fotos y videos'),
    h('div', { class: 'gallery' }, items),
    viewer);
}

function confirmation(booking) {
  const line = (label, value, className = '') =>
    h('div', { class: `summary ${className}` }, h('span', {}, label), h('span', {}, money(value)));

  return h('div', { class: 'panel confirmation', role: 'status', tabindex: '-1' },
    h('h3', {}, 'Reserva creada'),
    h('p', {}, [booking.artista, booking.paquete, formatDate(booking.fechaEvento), `${booking.horaEvento?.slice(0, 5)} hrs`].join(' · ')),
    h('p', { class: 'folio' }, `FOLIO ${booking.folio}`),
    line('Subtotal', booking.subtotal),
    line('Comisión de servicio', booking.comisionServicio),
    line('Total', booking.total, 'total'),
    h('p', { class: 'hint' }, `Pendiente de pago. Guarda el folio: la reserva quedó asociada a ${booking.correoCliente}.`),
    h('a', { class: 'secondary', href: '#/reservas' }, 'Ir a Mis reservas'));
}

export function renderArtist(slug) {
  const container = document.getElementById('artist-detail');
  const back = h('a', { class: 'link back', href: '#/' }, '← Volver a explorar');

  if (store.status !== 'ready') {
    const text = store.status === 'loading' ? 'Cargando show…' : `No pudimos cargar el show. ${store.error}`;
    return container.replaceChildren(back, h('p', { class: 'state' }, text));
  }
  const artist = store.artists.find((a) => a.slug === slug);
  if (!artist) {
    return container.replaceChildren(back, h('p', { class: 'state' }, 'Este show no está disponible.'));
  }

  let pkg = artist.packages[0];
  let slot = null;

  const favorite = h('button', {
    type: 'button',
    class: 'favorite',
    'aria-label': 'Guardar en favoritos',
    'aria-pressed': String(isFavorite(artist.id)),
    onclick: () => {
      toggleFavorite(artist.id);
      favorite.setAttribute('aria-pressed', String(isFavorite(artist.id)));
    },
  }, h('img', { src: 'assets/heart.png', alt: '' }));

  const time = h('input', { name: 'hora', type: 'time', required: true });
  const timeHint = h('p', { class: 'hint' });
  const status = h('p', { class: 'form-status', role: 'status' });
  const submit = h('button', { type: 'submit', class: 'primary' }, 'Confirmar reserva');
  const summary = h('p', { class: 'booking-summary' });
  const result = h('div');

  const form = h('form', { class: 'panel booking', hidden: true, onsubmit: book },
    summary,
    field('Tu nombre', h('input', { name: 'nombre', required: true, autocomplete: 'name' })),
    field('Correo', h('input', { name: 'correo', type: 'email', required: true, autocomplete: 'email' })),
    field('Teléfono', h('input', { name: 'telefono', type: 'tel', autocomplete: 'tel' })),
    field('Hora del evento', time),
    timeHint,
    field('Dirección del evento', h('input', { name: 'direccion', autocomplete: 'street-address' })),
    field('Comuna', h('input', { name: 'comuna' })),
    field('Región', h('input', { name: 'region' })),
    field('Cantidad de invitados', h('input', { name: 'invitados', type: 'number', min: '1' })),
    field('Cuéntale del evento', h('textarea', { name: 'mensaje' })),
    submit,
    status);

  // Actualiza sin reconstruir el formulario, para no borrar lo que el cliente escribió.
  function updateBooking() {
    form.hidden = !slot || !pkg;
    if (form.hidden) return;

    result.replaceChildren();
    status.textContent = '';
    summary.textContent = `${pkg.name} · ${formatDate(slot.date)} · ${money(pkg.price)} + comisión de servicio`;

    const range = startWindow(slot, pkg);
    time.disabled = !range;
    submit.disabled = !range;
    if (range) {
      time.min = toTime(range.first);
      time.max = toTime(range.last);
      timeHint.textContent = `Disponible de ${slot.from} a ${slot.to}. Puedes comenzar entre ${time.min} y ${time.max}.`;
    } else {
      timeHint.textContent = 'Esta opción no cabe en el horario de ese día. Elige otra fecha u opción.';
    }
  }

  async function book(event) {
    event.preventDefault();
    const data = new FormData(form);
    const value = (name) => data.get(name)?.trim() || null;
    if (!value('nombre') || !value('correo') || !value('hora')) {
      status.textContent = 'Ingresa tu nombre, correo y hora del evento.';
      return;
    }

    const request = {
      artistaId: artist.id,
      paqueteShowId: pkg.id,
      fechaEvento: slot.date,
      horaEvento: value('hora'),
      nombreCliente: value('nombre'),
      correoCliente: value('correo'),
      telefonoCliente: value('telefono'),
      direccionEvento: value('direccion'),
      comunaEvento: value('comuna'),
      regionEvento: value('region'),
      cantidadInvitados: value('invitados') ? Number(value('invitados')) : null,
      mensajeCliente: value('mensaje'),
    };

    submit.disabled = true;
    status.textContent = 'Guardando reserva…';
    try {
      const booking = await api.crearReserva(request);
      const message = confirmation(booking);
      slot = null;
      time.value = '';
      calendar.render();
      updateBooking();
      result.replaceChildren(message);
      message.focus();
    } catch (error) {
      status.textContent = `No pudimos crear la reserva: ${error.message}`;
    } finally {
      submit.disabled = false;
    }
  }

  const packages = artist.packages.map((option, index) =>
    h('label', { class: 'package' },
      h('input', {
        type: 'radio',
        name: 'paquete',
        checked: index === 0,
        onchange: () => {
          pkg = option;
          updateBooking();
        },
      }),
      h('span', { class: 'package-text' },
        h('strong', {}, option.name),
        h('span', {}, `${option.minutes} minutos`),
        option.description && h('span', {}, option.description)),
      h('span', { class: 'package-price' }, money(option.price))));

  const calendarBox = h('div', { class: 'calendar-box' });
  const today = toISODate();
  const nextDate = artist.availability.map((s) => s.date).filter((date) => date >= today).sort()[0];
  const calendar = createCalendar(calendarBox, {
    startAt: nextDate,
    isEnabled: (iso) => artist.availability.some((s) => s.date === iso),
    isSelected: (iso) => iso === slot?.date,
    onPick: (iso) => {
      slot = artist.availability.find((s) => s.date === iso);
      updateBooking();
    },
  });

  container.replaceChildren(
    back,
    h('div', { class: 'detail' },
      h('div', { class: 'detail-info' },
        h('div', { class: 'hero' }, photo(artist), favorite),
        h('h2', { class: 'view-title', tabindex: '-1' }, artist.name),
        h('p', { class: 'hint' }, [artist.categories.join(', '), artist.city, artist.region].filter(Boolean).join(' · ')),
        h('p', { class: 'bio' }, artist.bio),
        gallerySection(artist)),
      h('div', { class: 'detail-booking' },
        h('h3', { class: 'step' }, 'Elige tu opción'),
        packages.length ? h('div', { class: 'packages' }, packages) : h('p', { class: 'hint' }, 'Este artista no tiene opciones publicadas.'),
        h('h3', { class: 'step' }, 'Selecciona una fecha disponible'),
        !nextDate && h('p', { class: 'hint' }, 'No tiene fechas disponibles por ahora.'),
        calendarBox,
        form,
        result)));
}
