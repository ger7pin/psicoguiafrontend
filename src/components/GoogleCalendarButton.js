'use client';

export default function GoogleCalendarButton({ rol = 'cliente' }) {
  const handleEnlazarGoogle = () => {
    // Asegúrate de que la URL del backend esté correctamente formada
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '');
    window.location.href = `${backendUrl}/api/google/auth?rol=${rol}`;
  };

  return (
    <div className="mt-10">
      <button
        onClick={handleEnlazarGoogle}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
      >
        Enlazar con Google Calendar
      </button>
    </div>
  );
}
