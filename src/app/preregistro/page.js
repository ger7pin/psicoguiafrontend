'use client';
import FIRButton from '@/components/FIRButton';
import { Fredoka } from 'next/font/google';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: '400',
});

export default function RegistroSelector() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
      <div className="bg-white p-10 rounded-lg shadow-md text-center max-w-md w-full">
        <h1 className={`${fredoka.className} text-3xl font-bold text-indigo-700 mb-6`}>
          ¿Cómo deseas registrarte?
        </h1>
        <div className="flex flex-col gap-4">
          <FIRButton href="/clientes/register" variant="primary">
            Registrarme como Cliente
          </FIRButton>
          <FIRButton href="/psicologos/register" variant="secondary">
            Registrarme como Psicólogo
          </FIRButton>
        </div>
      </div>
    </main>
  );
}
