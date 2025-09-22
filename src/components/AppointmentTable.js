'use client';

export default function AppointmentTable({ citas, psicologos }) {
  return (
    <div className="bg-white shadow p-6 rounded-xl border mt-10">
      <h2 className="text-xl font-semibold mb-4">Mis citas</h2>
      {citas.length === 0 ? (
        <p className="text-gray-600">No tienes citas registradas aún.</p>
      ) : (
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-3">Fecha y Hora</th>
              <th className="py-2 px-3">Psicólogo</th>
              <th className="py-2 px-3">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => {
              const psico = psicologos.find((p) => p.id === cita.psicologo_id);
              return (
                <tr key={cita.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{new Date(cita.fecha_hora).toLocaleString()}</td>
                  <td className="py-2 px-3">{psico?.nombre || `ID ${cita.psicologo_id}`}</td>
                  <td className="py-2 px-3">{cita.descripcion}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

