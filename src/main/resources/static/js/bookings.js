// Mis reservas (consulta por correo).
import { api } from './api.js';
import { formatDate, h, money } from './util.js';

const STATES = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
  REEMBOLSADA: 'Reembolsada',
};

function bookingRow(booking) {
  const when = [formatDate(booking.fechaEvento), booking.horaEvento && `${booking.horaEvento.slice(0, 5)} hrs`];
  return h('article', { class: 'booking-row' },
    h('div', {},
      h('h3', {}, [booking.artista, booking.paquete].filter(Boolean).join(' — ')),
      h('p', {}, when.filter(Boolean).join(' · ')),
      h('p', {}, `Folio ${booking.folio} · ${money(booking.total)}`)),
    h('span', { class: 'status-pill' }, STATES[booking.estado] || booking.estado));
}

export function initBookings() {
  const form = document.getElementById('bookings-form');
  const results = document.getElementById('bookings-results');
  const submit = form.querySelector('[type="submit"]');
  const message = (text) => results.replaceChildren(h('p', { class: 'state' }, text));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    message('Buscando reservas…');
    try {
      const bookings = await api.reservasPorCorreo(form.elements.correo.value.trim());
      if (bookings.length) results.replaceChildren(...bookings.map(bookingRow));
      else message('No encontramos reservas con ese correo.');
    } catch (error) {
      message(`No pudimos consultar las reservas: ${error.message}`);
    } finally {
      submit.disabled = false;
    }
  });
}
