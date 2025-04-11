'use client';
import React, { useState, useEffect } from 'react';
import Chat from '@/components/Chat';
import ContactList from '@/components/ContactList';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function Dashboard() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuthUser();

  // Solicitar permiso para notificaciones al cargar el dashboard
  useEffect(() => {
    requestNotificationPermission();
    registerServiceWorker();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notificaciones permitidas');
      }
      } catch (error) {
      console.error('Error al solicitar permiso de notificaciones:', error);
      }
    };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado:', registration);
    } catch (error) {
        console.error('Error al registrar Service Worker:', error);
    }
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setShowChat(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <main className="flex-1 container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Panel izquierdo - Lista de contactos */}
          <div className="md:col-span-4 bg-white rounded-lg shadow">
            <ContactList
              onSelectContact={handleContactSelect}
              selectedContact={selectedContact}
            />
          </div>

          {/* Panel derecho - Chat o contenido del dashboard */}
          <div className="md:col-span-8">
            {showChat && selectedContact ? (
              <div className="bg-white rounded-lg shadow h-full">
                <Chat
                  contacto={selectedContact}
                  onClose={() => setShowChat(false)}
/>
          </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Bienvenido, {user?.nombre}
                </h2>
                <p className="text-gray-600">
                  Selecciona un contacto para comenzar a chatear
                </p>
        </div>
            )}
      </div>
        </div>
      </main>
    </div>
  );
}
