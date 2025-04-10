'use client';
import { useState, useEffect } from 'react';
import useAuthUser from '@/hooks/useAuthUser';
import Navbar from '@/components/Navbar';
import { obtenerCitas } from '@/services/citasService';

export default function DashboardPsicologo() {
  const { cliente: psicologo, cargando } = useAuthUser('psicologos');
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    if (!psicologo?.id) return;
    const cargarCitas = async () => {
      try {
        const todas = await obtenerCitas();
        const propias = todas.filter(c => c.psicologo_id === psicologo.id);
        setCitas(propias);
      } catch (err) {
        console.error('❌ Error al cargar citas:', err);
      }
    };
    cargarCitas();
  }, [psicologo]);

  if (cargando) return <div>Cargando...</div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Hola, {psicologo?.nombre}</h1>

        <div className="bg-white shadow p-6 rounded-xl border mt-4">
          <h2 className="text-xl font-semibold mb-4">Mis citas agendadas</h2>

          {citas.length === 0 ? (
            <p className="text-gray-600">Aún no tienes citas programadas.</p>
          ) : (
            <table className="w-full table-auto text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Hora</th>
                  <th className="py-2 px-3">Cliente</th>
                  <th className="py-2 px-3">descripcion</th>
                </tr>
              </thead>
              <tbody>
                {citas.map(cita => (
                  <tr key={cita.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{cita.fecha}</td>
                    <td className="py-2 px-3">{cita.hora}</td>
                    <td className="py-2 px-3">{cita.cliente?.nombre || `ID ${cita.cliente_id}`}</td>
                    <td className="py-2 px-3">{cita.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

