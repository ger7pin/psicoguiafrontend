// services/citasService.js

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export const crearCita = async (datos) => {
  const res = await fetch(`${API}/citas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(datos),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.mensaje);
  return json;
};

export const obtenerCitas = async () => {
  const res = await fetch(`${API}/citas`, {
    credentials: 'include',
  });
  return await res.json();
};

export const obtenerCitaPorId = async (id) => {
  const res = await fetch(`${API}/citas/${id}`, {
    credentials: 'include',
  });
  return await res.json();
};

export const actualizarCita = async (id, datos) => {
  const res = await fetch(`${API}/citas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(datos),
  });
  return await res.json();
};

export const eliminarCita = async (id) => {
  const res = await fetch(`${API}/citas/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return await res.json();
};
