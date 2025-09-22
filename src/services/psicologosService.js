const API = process.env.NEXT_PUBLIC_BACKEND_URL;

export const obtenerPsicologos = async () => {
  const res = await fetch(`${API}/psicologos`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje);
  return data;
};
