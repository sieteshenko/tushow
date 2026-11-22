// Único punto de contacto con la API de Spring Boot (mismo origen).

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error('No hay conexión con el servidor. Inténtalo de nuevo.');
  }

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // La respuesta no es JSON (por ejemplo, un error del proxy).
  }

  if (!response.ok) {
    throw new Error(body?.message || body?.error || `Error del servidor (${response.status}).`);
  }
  return body;
}

const post = (path, data) => request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const api = {
  artistas: () => request('/api/artistas'),
  crearArtista: (data) => post('/api/artistas', data),
  crearReserva: (data) => post('/api/reservas', data),
  reservasPorCorreo: (correo) => request(`/api/reservas?correo=${encodeURIComponent(correo)}`),
};
