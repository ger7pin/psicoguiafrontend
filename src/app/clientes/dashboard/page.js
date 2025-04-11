'use client';

import { useEffect, useState } from 'react';
import useAuthUser from '@/hooks/useAuthUser'; // ⬅️ CAMBIO: nuevo hook
import Navbar from '@/components/Navbar';
import { crearCita, obtenerCitas } from '@/services/citasService';
import { obtenerPsicologos } from '@/services/psicologosService';
import Calendar from 'react-calendar'; // Importamos el calendario
import 'react-calendar/dist/Calendar.css'; // Estilos del calendario

export default function DashboardCliente() {
  const { cliente, cargando } = useAuthUser('clientes');
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
  const [selectedDate, setSelectedDate] = useState(null); // Fecha seleccionada
  const [citaDetails, setCitaDetails] = useState(null); // Detalles de la cita seleccionada

  // Cargar psicólogos, citas y contactos al inicio
  useEffect(() => {
    if (!cliente?.id) return;
    const cargarDatos = async () => {
      try {
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

  // Actualizar la cita seleccionada
  const handleSelectDate = (date) => {
    setSelectedDate(date);
    const citaDelDia = citas.find(cita => new Date(cita.fecha_hora).toDateString() === date.toDateString());
    if (citaDelDia) {
      setCitaDetails(citaDelDia); // Establecer los detalles de la cita si existe
    } else {
      setCitaDetails(null); // Si no hay cita, limpiar los detalles
    }
  };

  // Marcar los días con citas
  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const fecha = citas.find(cita => new Date(cita.fecha_hora).toDateString() === date.toDateString());
      return fecha ? 'marked-date' : ''; // Clase personalizada si hay una cita
    }
    return '';
  };

  

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

    const fechaHora = `${formulario.fecha} ${formulario.hora}:00.000Z`;
    const datos = { ...formulario, fecha_hora: fechaHora, cliente_id: cliente?.id };

    try {
      const nueva = await crearCita(datos);
      setMensaje('✅ Cita reservada correctamente');
      setFormulario({ psicologo_id: '', fecha: '', hora: '', descripcion: '' });
      setCitas(prev => [...prev, nueva.cita]);

      // 🔄 Actualizar contactos automáticamente
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contactos`, {
        credentials: 'include',
      });
      const nuevosContactos = await res.json();
      setContactos(nuevosContactos); // Actualizar estado de contactos

    } catch (error) {
      console.error('❌ Error al reservar cita:', error);
      setMensaje('❌ Error al reservar la cita');
    }
};


  if (cargando) return <div>Cargando...</div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Bienvenido/a, {cliente?.nombre}</h1>
  
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Columna izquierda: Contactos y formulario */}
          <div className="md:col-span-4 space-y-6">
            {/* Sección de Contactos */}
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-primary">Mis Contactos</h2>
              {contactos.length === 0 ? (
                <p className="text-muted-foreground">No tienes contactos registrados aún.</p>
              ) : (
                <ul className="space-y-4">
                  {contactos.map((contacto) => (
                    <li key={contacto.id} className="border-b border-white/10 pb-3">
                      <p className="font-medium text-primary">{contacto.nombre}</p>
                      <p className="text-sm text-muted-foreground">{contacto.telefono}</p>
                      <p className="text-sm text-muted-foreground">{contacto.email}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
  
            {/* Sección Reservar cita */}
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
              <h2 className="text-xl font-semibold text-primary mb-4">Reservar una nueva cita</h2>
              <form onSubmit={reservarCita} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-muted-foreground">Psicólogo</label>
                  <select
                    name="psicologo_id"
                    value={formulario.psicologo_id}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground focus:ring-2 focus:ring-primary"
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
  
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-muted-foreground">Fecha</label>
                    <input
                      type="date"
                      name="fecha"
                      value={formulario.fecha}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground focus:ring-2 focus:ring-primary"
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
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground focus:ring-2 focus:ring-primary"
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
                    rows="4"
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
  
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl
                  transform active:scale-95 transition-transform duration-150 ease-in-out
                  shadow-lg hover:shadow-xl"
                >
                  Reservar cita
                </button>
              </form>
              {mensaje && <p className="mt-4 text-center font-medium text-primary">{mensaje}</p>}
            </div>
          </div>
  
          {/* Columna derecha: Calendario y detalles */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
              <h2 className="text-xl font-semibold text-primary mb-4">Calendario</h2>
              <Calendar
                onChange={handleSelectDate}
                value={selectedDate}
                className="w-full p-4"
                tileClassName={getTileClassName}
                tileContent={({ date}) => {
                  const citaDelDia = citas.find(cita => 
                    new Date(cita.fecha_hora).toDateString() === date.toDateString()
                  );
                  return citaDelDia ? (
                    <div className="bg-primary/20 rounded-full w-2 h-2 mx-auto mt-1"></div>
                  ) : null;
                }}
              />
            </div>
  
            {citaDetails && (
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl
                            transform transition-all duration-300 ease-in-out
                            animate-slideDown">
                <h2 className="text-xl font-semibold text-primary mb-4">Detalles de la Cita</h2>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-primary">Psicólogo:</span> {citaDetails.psicologo_nombre}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-primary">Fecha y Hora:</span> {new Date(citaDetails.fecha_hora).toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-primary">Descripción:</span> {citaDetails.descripcion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}