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
      className="bg-cover bg-center min-h-[600px] flex items-center justify-center"
      style={{ backgroundImage: "url('/img/hero-bg.png')" }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-xl w-full text-center">
        <h1 className={`${fredoka.className} text-4xl md:text-6xl font-bold text-indigo-800 mb-6`}>
          Bienvenido a PsicoGuía
        </h1>

        <p className={`${fredoka.className} text-lg text-gray-700 mb-6`}>
          Conéctate con profesionales verificados, gestiona tus citas fácilmente y accede a tu historial en línea.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <FIRButton href="/clientes/login" variant="primary">
            Soy Cliente
          </FIRButton>
          <FIRButton href="/psicologos/login" variant="secondary">
            Soy Psicólogo
          </FIRButton>
        </div>
      </div>
    </section>
  );
}

