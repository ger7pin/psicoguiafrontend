import React, { useState, useEffect } from 'react';
import { Sonner } from 'sonner';
import { useAuthUser } from '../hooks/useAuthUser';

const ContactList = ({ onSelectContact, selectedContact }) => {
  const [contacts, setContacts] = useState([]);
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuthUser();

  useEffect(() => {
    loadContacts();
    loadBlockedContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contactos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      Sonner.error('Error al cargar la lista de contactos');
    }
  };

  const loadBlockedContacts = async () => {
    try {
      const response = await fetch('/api/contactos/bloqueados', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setBlockedContacts(data.map(b => b.bloqueadoId));
    } catch (error) {
      console.error('Error al cargar contactos bloqueados:', error);
    }
  };

  const handleBlock = async (contactId) => {
    try {
      await fetch('/api/contactos/bloquear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bloqueadoId: contactId })
      });

      setBlockedContacts(prev => [...prev, contactId]);
      Sonner.success('Contacto bloqueado exitosamente');
    } catch (error) {
      console.error('Error al bloquear contacto:', error);
      Sonner.error('Error al bloquear el contacto');
    }
  };

  const handleUnblock = async (contactId) => {
    try {
      await fetch(`/api/contactos/desbloquear/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setBlockedContacts(prev => prev.filter(id => id !== contactId));
      Sonner.success('Contacto desbloqueado exitosamente');
    } catch (error) {
      console.error('Error al desbloquear contacto:', error);
      Sonner.error('Error al desbloquear el contacto');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Barra de búsqueda */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Buscar contactos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista de contactos */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer ${
              selectedContact?.id === contact.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => !blockedContacts.includes(contact.id) && onSelectContact(contact)}
          >
            {/* Avatar del contacto */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                {contact.nombre.charAt(0).toUpperCase()}
              </div>
              {contact.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Información del contacto */}
            <div className="flex-1 ml-4">
              <h3 className="font-semibold">{contact.nombre}</h3>
              <p className="text-sm text-gray-500">
                {contact.online ? 'En línea' : 'Desconectado'}
              </p>
            </div>

            {/* Botón de bloqueo/desbloqueo */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                blockedContacts.includes(contact.id)
                  ? handleUnblock(contact.id)
                  : handleBlock(contact.id);
              }}
              className={`p-2 rounded-lg ${
                blockedContacts.includes(contact.id)
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {blockedContacts.includes(contact.id) ? '🚫' : '⋮'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactList;
