'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeFetch } from '@/utils/apiUtils';

export default function RegisterForm({ userType }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [extraField, setExtraField] = useState(''); // edad o numero_licencia
  const [mensaje, setMensaje] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    const body =
      userType === 'clientes'
        ? { email, password, nombre, telefono, edad: extraField }
        : { email, password, nombre, telefono, numero_licencia: extraField };

    try {
      const { data, ok } = await safeFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (ok) {
        setMensaje('Registro exitoso. Redirigiendo al login...');
        setTimeout(() => {
          router.push(`/${userType}/login`);
        }, 1500);
      } else {
        setMensaje(data?.message || 'Error al registrar usuario');
      }
    } catch {
      setMensaje('Error de conexión con el servidor');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Registro de {userType}</h1>

      {mensaje && (
        <div className={`p-2 mb-4 rounded text-sm ${
          mensaje.includes('exitoso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4" autoComplete="on">
        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Nombre"
          className="w-full border border-gray-300 p-2 rounded"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Correo electrónico"
          className="w-full border border-gray-300 p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="Contraseña"
          className="w-full border border-gray-300 p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="tel"
          name="tel"
          autoComplete="tel"
          placeholder="Teléfono"
          className="w-full border border-gray-300 p-2 rounded"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />

        {userType === 'psicologos' && (
          <input
            type="text"
            placeholder="Número de Licencia"
            className="w-full border border-gray-300 p-2 rounded"
            value={extraField}
            onChange={(e) => setExtraField(e.target.value)}
            required
          />
        )}
        {userType === 'clientes' && (
          <input
            type="text"
            placeholder="Edad"
            className="w-full border border-gray-300 p-2 rounded"
            value={extraField}
            onChange={(e) => setExtraField(e.target.value)}
            required
          />
        )}

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}

