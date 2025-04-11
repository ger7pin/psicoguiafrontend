// src/components/GoogleCalendarButton.js
'use client';

export default function GoogleCalendarButton({ rol = 'cliente' }) {
  const handleEnlazarGoogle = () => {
    // Usar la URL correcta del backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
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

