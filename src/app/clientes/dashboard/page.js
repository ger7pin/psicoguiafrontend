'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClienteDashboard() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const verificarToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/verify`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('No autorizado');

        const data = await res.json();
        setEmail(data.email);
      } catch (err) {
        console.error('No autorizado:', err);
        router.push('/clientes/login');
      }
    };

    verificarToken();
  }, [router]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Bienvenido, {email}</h1>
    </div>
  );
}
