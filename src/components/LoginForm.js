'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ userType }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [avisoSesion, setAvisoSesion] = useState('');
  const [sesionActiva, setSesionActiva] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch(`http://localhost:3001/${userType}/verify`, {
          credentials: 'include'
        });
        if (res.ok) {
          setSesionActiva(true);
          setAvisoSesion('Ya hay una sesión activa. Si deseas cambiar de usuario, por favor cierra la sesión actual primero.');
        }
      } catch (error) {
        setSesionActiva(false);
      }
    };

    verificarSesion();
  }, [userType]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`http://localhost:3001/${userType}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error al iniciar sesión');
      }

      const data = await res.json();
      router.push(`/${userType}/dashboard`);
    } catch (err) {
      setError('Correo electrónico o contraseña incorrectos');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Iniciar sesión como {userType}</h1>

      {avisoSesion && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 border border-yellow-300">
          {avisoSesion}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 border border-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full border border-gray-300 p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full border border-gray-300 p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={sesionActiva}
          className={`w-full p-2 rounded text-white ${sesionActiva ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
