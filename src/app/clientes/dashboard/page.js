'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import Navbar from '@/components/Navbar';
import useAuthRedirect from '@/hooks/useAuthRedirect';

export default function ClienteDashboard() {
  const [email, setEmail] = useState('');

  useAuthRedirect('/clientes/login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setEmail(decoded.email || '');
    }
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4 text-indigo-600">Bienvenido, cliente</h1>
          <p className="text-gray-700">Tu correo electrónico es: <strong>{email}</strong></p>
        </div>
      </div>
    </>
  );
}
