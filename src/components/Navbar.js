'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-indigo-600 text-white py-4 px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Botón estilo Hero Section */}
        <Link
          href="/"
          className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-md font-bold hover:bg-white transition"
        >
          PsicoGuía
        </Link>

        {/* Botones blancos para login */}
        <div className="space-x-4 hidden md:flex">
          <Link
            href="/clientes/login"
            className="bg-white text-indigo-600 px-4 py-2 rounded-md hover:bg-gray-100 transition font-medium"
          >
            Acceder como cliente
          </Link>
          <Link
            href="/psicologos/login"
            className="bg-white text-indigo-600 px-4 py-2 rounded-md hover:bg-gray-100 transition font-medium"
          >
            Acceder como psicólogo
          </Link>
        </div>
      </div>
    </nav>
  );
}
