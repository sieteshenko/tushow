// Solicitud de publicación de artistas.
import { api } from './api.js';
import { createCalendar } from './calendar.js';
import { REGIONES } from './regiones.js';
import { formatDate, h } from './util.js';

const DEFAULT_HOURS = { horaDesde: '18:00', horaHasta: '23:00' };

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

  const fillCities = () => {
    const region = REGIONES.find((r) => r.region === elements.region.value);
    elements.comuna.replaceChildren(...region.comunas.map((name) => h('option', { value: name }, name)));
  };
  elements.region.append(...REGIONES.map((r) => h('option', { value: r.region }, r.region)));
  elements.region.addEventListener('change', fillCities);
  fillCities();

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

    submit.disabled = true;
    status.textContent = 'Enviando solicitud…';
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
