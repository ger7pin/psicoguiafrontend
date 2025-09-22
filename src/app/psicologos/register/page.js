'use client';

import RegisterForm from '@/components/RegisterForm';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function PsicologoRegisterPage() {
  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
        style={{ backgroundImage: "url('/img/login-psicologo-bg.png')" }}
      >
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-md w-full md:ml-170">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Regístrate como psicólogo
          </h2>
          <RegisterForm userType="psicologos" />
          <p className="mt-6 text-sm text-center text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href="/psicologos/login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

