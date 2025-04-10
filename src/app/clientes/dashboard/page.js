'use client';

import { useEffect, useState } from 'react';
import useAuthUser from '@/hooks/useAuthUser'; // ⬅️ CAMBIO: nuevo hook
import Navbar from '@/components/Navbar';
import { crearCita, obtenerCitas } from '@/services/citasService';
import { obtenerPsicologos } from '@/services/psicologosService';

export default function DashboardCliente() {
  const { cliente, cargando } = useAuthUser('clientes'); // ⬅️ CAMBIO
  const [psicologos, setPsicologos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [formulario, setFormulario] = useState({
    psicologo_id: '',
    fecha: '',
    hora: '',
    descripcion: ''
  });

  // Cargar psicólogos, citas y contactos al inicio
  useEffect(() => {
    if (!cliente?.id) return;
    const cargarDatos = async () => {
      try {
        // Llamada paralela para obtener psicólogos, citas y contactos
        const [psicos, citasBD, contactosBD] = await Promise.all([
          obtenerPsicologos(),
          obtenerCitas(),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contactos`, { credentials: 'include' })
            .then(res => res.json())
        ]);
        
        setPsicologos(psicos);

        // Verificación de que citasBD es un array
        if (!Array.isArray(citasBD)) {
          throw new Error('La respuesta de citas no es un array');
        }
        const citasCliente = citasBD.filter(cita => cita.cliente_id === cliente.id);
        setCitas(citasCliente);
        
        // Actualizar contactos
        setContactos(contactosBD);
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
      }
    };
    cargarDatos();
  }, [cliente]);

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const validarFechaHora = () => {
    const now = new Date();
    const fechaHora = new Date(`${formulario.fecha}T${formulario.hora}`);
    if (fechaHora < now) {
      setMensaje('❌ La fecha y hora no pueden ser en el pasado.');
      return false;
    }
    return true;
  };

  const reservarCita = async (e) => {
    e.preventDefault();
    if (!validarFechaHora()) return;

    const fechaHora = `${formulario.fecha} ${formulario.hora}:00.000Z`; // Combina la fecha y hora en el formato adecuado
    const datos = { ...formulario, fecha_hora: fechaHora, cliente_id: cliente?.id };

    try {
      const nueva = await crearCita(datos);
      setMensaje('✅ Cita reservada correctamente');
      setFormulario({ psicologo_id: '', fecha: '', hora: '', descripcion: '' });
      setCitas(prev => [...prev, nueva.cita]); // añadir la nueva cita
    } catch (error) {
      console.error('❌ Error al reservar cita:', error);
      setMensaje('❌ Error al reservar la cita');
    }
  };

  const handleEnlazarGoogle = () => {
    window.location.href = '/api/routes/google/auth?rol=cliente'; // Ajusta la URL de acuerdo a tu ruta de autenticación
  };

  if (cargando) return <div>Cargando...</div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Bienvenido/a, {cliente?.nombre}</h1>

        {/* Formulario de cita */}
        <div className="bg-white shadow p-6 rounded-xl border mt-8">
          <h2 className="text-xl font-semibold mb-4">Reservar una nueva cita</h2>
          <form onSubmit={reservarCita} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Selecciona un psicólogo</label>
              <select
                name="psicologo_id"
                value={formulario.psicologo_id}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
              >
                <option value="">-- Selecciona --</option>
                {psicologos.map(psico => (
                  <option key={psico.id} value={psico.id}>
                    {psico.nombre} ({psico.especialidad})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={formulario.fecha}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Hora</label>
              <input
                type="time"
                name="hora"
                value={formulario.hora}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">descripcion</label>
              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Reservar cita
            </button>
          </form>
          {mensaje && <p className="mt-4 text-center font-medium">{mensaje}</p>}
        </div>

        {/* Tabla de citas */}
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
      <th className="py-2 px-3">descripcion</th>
    </tr>
  </thead>
  <tbody>
    {citas.map((cita) => {
      const psico = psicologos.find(p => p.id === cita.psicologo_id);
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


        {/* Sección de contactos */}
        <div className="bg-white shadow p-6 rounded-xl border mt-10">
          <h2 className="text-xl font-semibold mb-4">Mis Contactos</h2>
          {contactos.length === 0 ? (
            <p className="text-gray-600">No tienes contactos registrados aún.</p>
          ) : (
            <ul className="space-y-4">
              {contactos.map((contacto) => (
                <li key={contacto.id} className="border-b pb-2">
                  <p><strong>{contacto.nombre}</strong></p>
                  <p>{contacto.telefono}</p>
                  <p>{contacto.email}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Botón para enlazar con Google Calendar */}
        <div className="mt-10">
          <button
            onClick={handleEnlazarGoogle}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Enlazar con Google Calendar
          </button>
        </div>
      </div>
    </>
  );
}
