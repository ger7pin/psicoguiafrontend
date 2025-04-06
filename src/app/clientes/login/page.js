'use client';

import RegisterForm from '@/components/LoginForm';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ClienteRegisterPage() {
  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
        style={{ backgroundImage: "url('/img/clienteform.png')" }}
      >
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-md w-full md:ml-170">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Accede como cliente
          </h2>
          <RegisterForm userType="clientes" />
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
