'use client';

import { useState, useEffect } from 'react';
import useAuthUser from '@/hooks/useAuthUser';
import Navbar from '@/components/Navbar';
import { obtenerCitas } from '@/services/citasService';
import { obtenerClientes } from '@/services/clientesService';
import ContactList from '@/components/ContactList';
import CalendarSection from '@/components/CalendarSection';
import GoogleCalendarButton from '@/components/GoogleCalendarButton';
import Chat from '@/components/Chat';

export default function DashboardPsicologo() {
  const { cliente: psicologo, cargando } = useAuthUser('psicologos');
  const [citas, setCitas] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [citaDetails, setCitaDetails] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    if (!psicologo?.id) return;
    
    const cargarDatos = async () => {
      try {
        // Cargar citas, contactos y clientes en paralelo
        const [citasData, contactosData, clientesData] = await Promise.all([
          obtenerCitas(),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contactos`, {
            credentials: 'include',
          }).then(res => res.json()),
          obtenerClientes()
        ]);

        // Filtrar citas propias
        const citasPropias = citasData.filter(c => c.psicologo_id === psicologo.id);
        setCitas(citasPropias);
        
        // Configurar contactos (clientes del psicólogo)
        setContactos(contactosData);
        
        // Guardar lista de clientes para referencias
        setClientes(clientesData);
      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
      }
    };
    
    cargarDatos();
  }, [psicologo]);

  useEffect(() => {
    // Verificar el estado de la conexión con Google Calendar
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/google/connection-status`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsGoogleConnected(data.isConnected);
          localStorage.setItem('googleConnected', data.isConnected);
        }
      } catch (error) {
        console.error('Error al verificar la conexión con Google:', error);
      }
    };

    checkGoogleConnection();

    const savedState = localStorage.getItem('googleConnected');
    if (savedState === 'true') {
      setIsGoogleConnected(true);
    }

    const interval = setInterval(checkGoogleConnection, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [psicologo]);

  const handleContactClick = (contacto) => {
    setSelectedContact(contacto);
    setShowChat(true);
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

  if (!psicologo) {
    return null; // No renderizar nada mientras se redirige
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto pt-16">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Bienvenido/a, {psicologo?.nombre}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar - Lista de contactos y chat */}
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
              <div className="bg-white rounded-lg shadow-md h-full overflow-hidden">
                <h2 className="text-lg font-semibold p-4 border-b">Mis Pacientes</h2>
                <ContactList 
                  contactos={contactos} 
                  onContactClick={handleContactClick}
                />
              </div>
            </div>
          </div>

          {/* Main Content - Calendario y Chat */}
          <div className={`${
            showChat ? 'hidden lg:block' : ''
          } lg:col-span-8 h-[calc(100vh-8rem)] overflow-hidden`}>
            {showChat ? (
              <Chat 
                clienteId={selectedContact.id}
                psicologoId={psicologo?.id}
                onClose={() => setShowChat(false)}
              />
            ) : (
              <div className="h-full flex flex-col gap-4">
                <div className="flex-1">
                  <CalendarSection
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    citas={citas}
                    clientes={clientes}
                    setCitaDetails={setCitaDetails}
                  />
                </div>
                
                {citaDetails && (
                  <div className="h-1/3">
                    <div className="bg-white shadow-md rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">Detalles de la Cita</h3>
                      <p><span className="font-medium">Fecha:</span> {new Date(citaDetails.fecha_hora).toLocaleDateString()}</p>
                      <p><span className="font-medium">Hora:</span> {new Date(citaDetails.fecha_hora).toLocaleTimeString()}</p>
                      <p><span className="font-medium">Cliente:</span> {
                        clientes.find(c => c.id === citaDetails.cliente_id)?.nombre || `Cliente #${citaDetails.cliente_id}`
                      }</p>
                      <p><span className="font-medium">Descripción:</span> {citaDetails.descripcion}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-auto">
                  <GoogleCalendarButton 
                    isConnected={isGoogleConnected}
                    onConnectionChange={handleGoogleConnectionChange}
                    userType="psicologo"
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
