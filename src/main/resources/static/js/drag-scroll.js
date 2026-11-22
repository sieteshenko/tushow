// En táctil el scroll es nativo; esto permite arrastrar los carruseles con el ratón.
export function enableDragScroll() {
  let drag = null;
  let moved = false;

  document.addEventListener('pointerdown', (event) => {
    moved = false;
    const element = event.target.closest('.scroller');
    if (!element || event.pointerType !== 'mouse' || event.button !== 0) return;
    if (element.scrollWidth <= element.clientWidth) return;
    drag = { element, x: event.clientX, left: element.scrollLeft };
  });

  document.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 4) moved = true;
    if (!moved) return;
    drag.element.classList.add('dragging');
    drag.element.scrollLeft = drag.left - distance;
  });

  const release = () => {
    drag?.element.classList.remove('dragging');
    drag = null;
  };
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);

  // Soltar un arrastre sobre una tarjeta no debe abrirla.
  document.addEventListener('click', (event) => {
    if (moved && event.target.closest('.scroller')) {
      event.preventDefault();
      event.stopPropagation();
    }
    moved = false;
  }, true);
}
