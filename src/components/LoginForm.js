'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ userType }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Iniciando login...');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Respuesta login:', data);

      if (!res.ok) {
        setError(data.message || 'Error al iniciar sesión');
        return;
      }

      // Verificar que la sesión se estableció correctamente
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
        credentials: 'include'
      });
      
      if (verifyRes.ok) {
        // Usar replace: true para evitar problemas con el historial
        router.push(`/${userType}/dashboard`, { replace: true });
      } else {
        setError('Error al verificar la sesión');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión');
    }
  };

  return (
    <form 
      onSubmit={handleLogin} 
      className="space-y-4 w-full max-w-md mx-auto px-4 sm:px-0"
      autoComplete="on"
    >
      <input 
        type="email" 
        name="email"
        autoComplete="email"
        placeholder="Correo electrónico" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        className="w-full border px-4 py-3 sm:py-2 rounded text-base" 
        required 
      />
      <input 
        type="password" 
        name="current-password"
        autoComplete="current-password"
        placeholder="Contraseña" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        className="w-full border px-4 py-3 sm:py-2 rounded text-base" 
        required 
      />
      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white py-3 sm:py-2 rounded hover:bg-blue-700 transition text-base"
      >
        Iniciar sesión
      </button>
    </form>
  );
}