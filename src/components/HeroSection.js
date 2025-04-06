'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <section
      className="bg-cover bg-center min-h-[600px] flex items-center justify-center"
      style={{ backgroundImage: "url('/img/hero-bg.png')" }} // Aquí tu imagen limpia sin texto
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Encuentra tu psicólogo ideal</h1>
        <p className="text-lg text-gray-700 mb-6">
          Conéctate con profesionales verificados, gestiona tus citas fácilmente y accede a tu historial en línea.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link
            href="/clientes/login"
            className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-100 transition text-center"
          >
            Acceder como cliente
          </Link>
          <Link
            href="/psicologos/login"
            className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-100 transition text-center"
          >
            Acceder como psicólogo
          </Link>
        </div>
      </div>
    </section>
  );
}
