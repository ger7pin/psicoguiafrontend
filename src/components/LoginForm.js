'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ userType }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sesionActiva, setSesionActiva] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
          method: 'GET',
          credentials: 'include', // 👈 ¡IMPORTANTE!
        });
        const data = await res.json();
        if (res.ok && data.message === 'Sesión activa') {
          setSesionActiva(true);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      }
    };

    verificarSesion();
  }, [userType]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/login`, {
        method: 'POST',
        credentials: 'include', // 👈 ¡Aquí también!
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error al iniciar sesión');
        return;
      }

      if (data.message === 'Sesión activa') {
        setSesionActiva(true);
      }

      if (userType === 'clientes') {
        router.push('/clientes/dashboard');
      } else {
        router.push('/psicologos/dashboard');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al iniciar sesión');
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {sesionActiva && (
        <div className="bg-blue-100 text-blue-700 p-2 rounded text-sm font-medium">
          Ya tienes una sesión activa.
        </div>
      )}

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />

      {error && (
        <p className="text-red-600 text-sm font-medium">{error}</p>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Iniciar sesión
      </button>
    </form>
  );
}
