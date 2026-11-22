// Banner de Figma: degradado animado y rotación de artistas destacados.

const PARAMS = {
  intensity: 5,
  gradient: {
    stops: [
      { position: 0.4134615361690521, color: { r: 1, g: 0.38333332538604736, b: 0, a: 1 } },
      { position: 1, color: { r: 1, g: 0.800000011920929, b: 0, a: 1 } },
    ],
  },
  gradientBalance: 6,
  material: 0,
  morphSpeed: 5,
  detail: 0,
  twist: 4.779999732971191,
  zoom: 0,
  gradientMethod: 0,
  warp: 0.8700000047683716,
  rotationSpeed: 96,
};
const INTRO = {
  title: 'Reserva tu show aquí',
  subtitle: 'MÚSICA, DANZA, TEATRO, CIRCO Y MAGIA',
  note: 'ELIGE FECHA Y RESERVA',
  href: '#catalog',
};
const ROTATION_MS = 4500;
const stillMotion = matchMedia('(prefers-reduced-motion: reduce)');

async function startGradient(canvas) {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter || !window.BannerShader) {
    canvas.hidden = true;
    return;
  }
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  context.configure({ device, format: navigator.gpu.getPreferredCanvasFormat(), alphaMode: 'premultiplied' });

  const frame = { state: {}, params: PARAMS };
  window.BannerShader.setup(device, frame);

  let visible = false;
  let lost = false;
  let pending = 0;

  function draw(time) {
    pending = 0;
    if (!visible || lost) return;
    const width = Math.max(1, Math.round(canvas.clientWidth * devicePixelRatio));
    const height = Math.max(1, Math.round(canvas.clientHeight * devicePixelRatio));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    frame.time = stillMotion.matches ? 0 : time;
    frame.output = context.getCurrentTexture();
    window.BannerShader.render(device, frame);
    if (!stillMotion.matches) pending = requestAnimationFrame(draw);
  }

  device.lost.then(() => {
    lost = true;
    canvas.hidden = true;
  });
  // No gasta GPU mientras el banner está fuera de pantalla o en otra vista.
  new IntersectionObserver((entries) => {
    visible = entries.at(-1).isIntersecting;
    if (visible && !pending) pending = requestAnimationFrame(draw);
  }).observe(canvas);
}

const banner = document.getElementById('banner');
let slides = [INTRO];
let index = 0;
let timer = 0;

function show() {
  const slide = slides[index];
  banner.querySelector('.banner-title').textContent = slide.title;
  banner.classList.toggle('long-title', slide.title.length > 21);
  banner.querySelector('.banner-sub').textContent = slide.subtitle;
  banner.querySelector('.banner-note').textContent = slide.note;
  banner.setAttribute('href', slide.href);
}

export function setFeatured(artists) {
  slides = [INTRO, ...artists.filter((a) => a.featured).map((artist) => ({
    title: artist.name,
    subtitle: [...artist.categories, artist.city].filter(Boolean).join(' · ').toUpperCase(),
    note: 'SHOW DESTACADO',
    href: `#/artista/${encodeURIComponent(artist.slug)}`,
  }))];
  index = 0;
  show();
  clearInterval(timer);
  if (slides.length < 2 || stillMotion.matches) return;
  timer = setInterval(() => {
    if (banner.matches(':hover, :focus-visible')) return;
    index = (index + 1) % slides.length;
    show();
  }, ROTATION_MS);
}

export function initBanner() {
  const canvas = banner.querySelector('canvas');
  startGradient(canvas).catch((error) => {
    canvas.hidden = true;
    console.warn('No se pudo iniciar el banner animado:', error);
  });
  banner.addEventListener('click', (event) => {
    if (banner.getAttribute('href') !== INTRO.href) return;
    event.preventDefault();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });
}
