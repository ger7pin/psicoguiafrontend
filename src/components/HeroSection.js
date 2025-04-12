'use client';

import { Fredoka } from 'next/font/google';
import FIRButton from '@/components/FIRButton'; // Asegúrate de que la ruta es correcta

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: '400',
});

export default function HeroSection() {
  return (
    <section
      className="min-h-[80vh] flex items-center justify-center p-4 sm:p-8"
      style={{ backgroundImage: "url('/img/hero-bg.png')" }}
    >
      <div className="bg-white/90 p-6 sm:p-8 rounded-lg shadow-lg max-w-xl w-full mx-4">
        <h1 className={`${fredoka.className} text-3xl sm:text-4xl md:text-6xl font-bold text-indigo-800 mb-4 sm:mb-6`}>
          Bienvenido a PsicoGuía
        </h1>

        <p className={`${fredoka.className} text-base sm:text-lg text-gray-700 mb-6`}>
          Conéctate con profesionales verificados, gestiona tus citas fácilmente y accede a tu historial en línea.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <FIRButton href="/clientes/login" variant="primary" className="w-full sm:w-auto">
            Soy Cliente
          </FIRButton>
          <FIRButton href="/psicologos/login" variant="secondary" className="w-full sm:w-auto">
            Soy Psicólogo
          </FIRButton>
        </div>
      </div>
    </section>
  );
}

