'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeFetch } from '@/utils/apiUtils';

export default function LoginForm({ userType }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data, ok } = await safeFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!ok) {
        setError(data?.message || 'Error al iniciar sesión');
        return;
      }

      router.push(`/${userType}/dashboard`);
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al iniciar sesión');
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 w-full max-w-md mx-auto px-4 sm:px-0">
      <input 
        type="email" 
        placeholder="Correo electrónico" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        className="w-full border px-4 py-3 sm:py-2 rounded text-base" 
        required 
      />
      <input 
        type="password" 
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