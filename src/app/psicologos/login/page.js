'use client';

import LoginForm from '@/components/LoginForm';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function PsicologoLoginPage() {
  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
        style={{ backgroundImage: "url('/img/login-psicologo-bg.png')" }}
      >
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-md w-full md:ml-170">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Accede como psicólogo
          </h2>
          <LoginForm userType="psicologos" />
          <p className="mt-6 text-sm text-center text-gray-600">
            ¿Aún no tienes una cuenta?{' '}
            <Link
              href="/psicologos/register"
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
