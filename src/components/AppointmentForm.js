'use client';

export default function AppointmentForm({
  formulario,
  handleChange,
  reservarCita,
  mensaje,
  psicologos
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-primary mb-4">Reservar cita</h2>
      <form onSubmit={reservarCita} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm text-muted-foreground">Psicólogo</label>
          <select
            name="psicologo_id"
            value={formulario.psicologo_id}
            onChange={handleChange}
            className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Selecciona --</option>
            {psicologos.map((psico) => (
              <option key={psico.id} value={psico.id}>
                {psico.nombre} ({psico.especialidad})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm text-muted-foreground">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formulario.fecha}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm text-muted-foreground">Hora</label>
            <input
              type="time"
              name="hora"
              value={formulario.hora}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm text-muted-foreground">Descripción</label>
          <textarea
            name="descripcion"
            value={formulario.descripcion}
            onChange={handleChange}
            rows="2"
            className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Breve descripción de la consulta..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg
            transform active:scale-95 transition-all duration-150 font-medium shadow-md hover:shadow-lg"
        >
          Reservar cita
        </button>
      </form>
      {mensaje && (
        <p className="mt-4 text-center text-sm font-medium text-primary">{mensaje}</p>
      )}
    </div>
  );
}
