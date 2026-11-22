import { h, toISODate } from './util.js';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Calendario mensual.
 * isEnabled(iso) decide qué días se pueden tocar (los pasados, nunca).
 * isSelected(iso) decide cuáles aparecen marcados.
 */
export function createCalendar(container, { isEnabled = () => true, isSelected, onPick, startAt }) {
  const start = startAt ? new Date(`${startAt}T00:00:00`) : new Date();
  let view = new Date(start.getFullYear(), start.getMonth(), 1);

  function render() {
    const today = toISODate();
    const year = view.getFullYear();
    const month = view.getMonth();
    const now = new Date();
    const atCurrentMonth = year === now.getFullYear() && month === now.getMonth();

    const move = (step) => {
      view = new Date(year, month + step, 1);
      render();
      const button = container.querySelector(step < 0 ? '.cal-prev' : '.cal-following');
      (button.disabled ? container.querySelector('.cal-following') : button).focus();
    };

    const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => {
      const iso = toISODate(new Date(year, month, index + 1));
      return h('button', {
        type: 'button',
        class: 'cal-day',
        'data-date': iso,
        'aria-pressed': String(isSelected(iso)),
        disabled: iso < today || !isEnabled(iso),
        onclick: () => {
          onPick(iso);
          render();
          container.querySelector(`[data-date="${iso}"]`)?.focus();
        },
      }, String(index + 1));
    });

    container.replaceChildren(
      h('div', { class: 'cal-nav' },
        h('button', { type: 'button', class: 'cal-prev', 'aria-label': 'Mes anterior', disabled: atCurrentMonth, onclick: () => move(-1) }, '‹'),
        h('span', { 'aria-live': 'polite' }, view.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })),
        h('button', { type: 'button', class: 'cal-following', 'aria-label': 'Mes siguiente', onclick: () => move(1) }, '›')),
      h('div', { class: 'cal-grid' },
        WEEKDAYS.map((day) => h('span', { class: 'cal-dow', 'aria-hidden': 'true' }, day)),
        Array.from({ length: (view.getDay() + 6) % 7 }, () => h('span')),
        days),
    );
  }

  render();
  return { render };
}
