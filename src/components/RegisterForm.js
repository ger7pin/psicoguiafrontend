'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm({ userType }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [extraField, setExtraField] = useState(''); // edad o especialidad
  const [mensaje, setMensaje] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    const body =
      userType === 'clientes'
        ? { email, password, nombre, telefono, edad: extraField }
        : { email, password, nombre, telefono, especialidad: extraField };

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      setMensaje('Registro exitoso');
      router.push(`/${userType}/login`);
    } else {
      setMensaje(data.message || 'Error al registrarse');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-2xl shadow-lg">
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            className="w-full mt-1 p-2 border border-gray-300 rounded-xl"
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            className="w-full mt-1 p-2 border border-gray-300 rounded-xl"
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            {userType === 'clientes' ? 'Edad' : 'Especialidad'}
          </label>
          <input
            type={userType === 'clientes' ? 'number' : 'text'}
            className="w-full mt-1 p-2 border border-gray-300 rounded-xl"
            onChange={(e) => setExtraField(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full mt-1 p-2 border border-gray-300 rounded-xl"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            type="password"
            className="w-full mt-1 p-2 border border-gray-300 rounded-xl"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          Registrarse
        </button>
        {mensaje && <p className="mt-4 text-sm text-center text-red-600">{mensaje}</p>}
      </form>
    </div>
  );
}

