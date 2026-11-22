// Único punto de contacto con la API de Spring Boot (mismo origen).

const OFFLINE = 'No hay conexión con el servidor. Inténtalo de nuevo.';

function parse(status, text) {
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // La respuesta no es JSON (por ejemplo, un error del proxy).
  }

  if (status < 200 || status >= 300) {
    if (status === 413 && !body?.message) throw new Error('Los archivos son demasiado grandes.');
    throw new Error(body?.message || body?.error || `Error del servidor (${status}).`);
  }
  return body;
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error(OFFLINE);
  }
  return parse(response.status, await response.text());
}

const post = (path, data) => request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// fetch no informa el avance de una subida; XMLHttpRequest sí.
function upload(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    });
    xhr.addEventListener('load', () => {
      try {
        resolve(parse(xhr.status, xhr.responseText));
      } catch (error) {
        reject(error);
      }
    });
    xhr.addEventListener('error', () => reject(new Error(OFFLINE)));
    xhr.send(formData);
  });
}

export const api = {
  artistas: () => request('/api/artistas'),
  // datos: el mismo JSON de siempre; foto y galería son Blobs opcionales.
  crearArtista: (datos, { foto = null, galeria = [] } = {}, onProgress) => {
    const form = new FormData();
    form.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    if (foto) form.append('foto', foto.blob, foto.name);
    for (const item of galeria) form.append('galeria', item.blob, item.name);
    return upload('/api/artistas', form, onProgress);
  },
  crearReserva: (data) => post('/api/reservas', data),
  reservasPorCorreo: (correo) => request(`/api/reservas?correo=${encodeURIComponent(correo)}`),
};
