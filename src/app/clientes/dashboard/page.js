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
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Cargar psicólogos, citas y contactos al inicio
  useEffect(() => {
    if (!cliente?.id) return;
    const cargarDatos = async () => {
      try {
        const [psicos, citasBD, contactosBD] = await Promise.all([
          obtenerPsicologos(),
          obtenerCitas(),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clientes/contactos`, {
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

  useEffect(() => {
    // Verificar el estado de la conexión con Google Calendar
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clientes/google/connection-status`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsGoogleConnected(data.isConnected);
          // Guardar en localStorage para persistencia
          localStorage.setItem('googleConnected', data.isConnected);
        }
      } catch (error) {
        console.error('Error al verificar la conexión con Google:', error);
      }
    };

    // Verificar al montar y cuando cambie el cliente
    checkGoogleConnection();

    // Verificar el estado guardado en localStorage
    const savedState = localStorage.getItem('googleConnected');
    if (savedState === 'true') {
      setIsGoogleConnected(true);
    }

    // Configurar un intervalo para verificar periódicamente
    const interval = setInterval(checkGoogleConnection, 60000); // Cada minuto

    return () => clearInterval(interval);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clientes/contactos`, {
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

  const handleGoogleConnectionChange = (newStatus) => {
    setIsGoogleConnected(newStatus);
    localStorage.setItem('googleConnected', newStatus);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return null; // No renderizar nada mientras se redirige
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto pt-16"> {/* Añadido pt-16 para el navbar fijo */}
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Bienvenido/a, {cliente?.nombre}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar - Se convierte en pantalla completa en móvil cuando el chat está abierto */}
          <div className={`${
            showChat ? 'fixed inset-0 z-50 bg-white p-4 pt-16' : 'relative'
          } lg:static lg:col-span-4 h-[calc(100vh-8rem)] flex flex-col gap-4`}>
            {showChat && (
              <button
                onClick={() => setShowChat(false)}
                className="lg:hidden fixed top-20 left-4 z-50 bg-white p-2 rounded-lg shadow-md"
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
          <div className={`${
            showChat ? 'hidden lg:block' : ''
          } lg:col-span-8 h-[calc(100vh-8rem)] overflow-hidden`}>
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
                    psicologos={psicologos} // Asegúrate de pasar los psicólogos
                    setCitaDetails={setCitaDetails}
                  />
                </div>
                
                {citaDetails && (
                  <div className="h-1/3">
                    <AppointmentDetails cita={citaDetails} />
                  </div>
                )}
                
                <div className="mt-auto">
                  <GoogleCalendarButton 
                    isConnected={isGoogleConnected}
                    onConnectionChange={handleGoogleConnectionChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
