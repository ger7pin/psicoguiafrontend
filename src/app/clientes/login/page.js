'use client';

import LoginForm from '@/components/LoginForm';

import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ClienteLoginPage() {
  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center px-4 py-8 sm:py-0"
        style={{ backgroundImage: "url('/img/clienteform.png')" }}
      >
        <div className="bg-white/90 w-full max-w-md mx-auto p-4 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 text-center">
            Accede como cliente
          </h2>
          <LoginForm userType="clientes" />
          <p className="mt-6 text-sm text-center text-gray-600">
            ¿Aún no tienes cuenta?{' '}
            <Link
              href="/clientes/register"
              className="text-indigo-600 hover:underline font-medium"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
