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
import Chat from '@/components/Chat';

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
  const [selectedContact, setSelectedContact] = useState(null);
  const [showChat, setShowChat] = useState(false);

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

  const handleContactClick = (contacto) => {
    setSelectedContact(contacto);
    setShowChat(true);
    // Eliminar la redirección
    // window.location.href = `/chat/psicologo/${contacto.id}`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <Navbar />
      
      <div className="flex-1 p-4 sm:p-6 overflow-hidden">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Bienvenido/a, {cliente?.nombre}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-160px)]">
          {/* Sidebar - Se convierte en pantalla completa en móvil cuando el chat está abierto */}
          <div className={`${showChat ? 'fixed inset-0 z-50 bg-white p-4' : ''} 
                          lg:relative lg:col-span-4 h-full flex flex-col gap-4`}>
            {showChat && (
              <button
                onClick={() => setShowChat(false)}
                className="lg:hidden mb-4 text-gray-600 hover:text-gray-800"
              >
                ← Volver
              </button>
            )}
            
            <div className="flex-1 overflow-hidden">
              <ContactList 
                contactos={contactos} 
                onContactClick={handleContactClick}
              />
            </div>
            
            {!showChat && (
              <div className="h-auto lg:h-1/2 overflow-auto mt-4">
                <AppointmentForm
                  formulario={formulario}
                  handleChange={handleChange}
                  psicologos={psicologos}
                  reservarCita={reservarCita}
                  mensaje={mensaje}
                />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className={`${showChat && 'hidden lg:block'} lg:col-span-8 h-full overflow-hidden`}>
            {showChat ? (
              <Chat 
                clienteId={cliente?.id}
                psicologoId={selectedContact.id}
                onClose={() => setShowChat(false)}
              />
            ) : (
              <div className="h-full flex flex-col gap-4">
                <div className="flex-1">
                  <CalendarSection
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    citas={citas}
                    setCitaDetails={setCitaDetails}
                  />
                </div>
                
                {citaDetails && (
                  <div className="h-1/3">
                    <AppointmentDetails cita={citaDetails} />
                  </div>
                )}
                
                <div className="mt-auto">
                  <GoogleCalendarButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
