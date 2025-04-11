'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ContactList from '@/components/ContactList';
import CalendarSection from '@/components/CalendarSection';
import AppointmentForm from '@/components/AppointmentForm';
import AppointmentDetails from '@/components/AppointmentDetails';
import GoogleCalendarButton from '@/components/GoogleCalendarButton';
import useAuthUser from '@/hooks/useAuthUser';
import { crearCita, obtenerCitas } from '@/services/citasService';
import { obtenerPsicologos } from '@/services/psicologosService';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [citaDetails, setCitaDetails] = useState(null);

  // Cargar psicólogos, citas y contactos al inicio
  useEffect(() => {
    if (!cliente?.id) return;
    const cargarDatos = async () => {
      try {
        const [psicos, citasBD, contactosBD] = await Promise.all([
          obtenerPsicologos(),
          obtenerCitas(),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contactos`, {
            credentials: 'include',
          }).then(res => res.json())
        ]);

        setPsicologos(psicos);

        if (!Array.isArray(citasBD)) {
          throw new Error('La respuesta de citas no es un array');
        }

        const citasCliente = citasBD.filter(cita => cita.cliente_id === cliente.id);
        setCitas(citasCliente);
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

    const fechaHora = `${formulario.fecha} ${formulario.hora}:00.000Z`;
    const datos = { ...formulario, fecha_hora: fechaHora, cliente_id: cliente?.id };

    try {
      const nueva = await crearCita(datos);
      setMensaje('✅ Cita reservada correctamente');
      setFormulario({ psicologo_id: '', fecha: '', hora: '', descripcion: '' });
      setCitas(prev => [...prev, nueva.cita]);

      // Actualizar contactos
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contactos`, {
        credentials: 'include',
      });
      const nuevosContactos = await res.json();
      setContactos(nuevosContactos);
    } catch (error) {
      console.error('❌ Error al reservar cita:', error);
      setMensaje('❌ Error al reservar la cita');
    }
  };

  if (cargando) return <div className="text-center mt-10">Cargando...</div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Bienvenido/a, {cliente?.nombre}</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-6">
            <ContactList contactos={contactos} />
            <AppointmentForm
              formulario={formulario}
              handleChange={handleChange}
              psicologos={psicologos}
              reservarCita={reservarCita}
              mensaje={mensaje}
            />
          </div>

          <div className="md:col-span-8 space-y-6">
          <CalendarSection
  selectedDate={selectedDate}
  setSelectedDate={setSelectedDate}
  citas={citas}
  setCitaDetails={setCitaDetails} // ⬅️ Añade esta línea
/>


            {citaDetails && <AppointmentDetails cita={citaDetails} />}
            <GoogleCalendarButton />
          </div>
        </div>
      </div>
    </>
  );
}
