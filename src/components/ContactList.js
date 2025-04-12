import React, { useState } from 'react';
import { toast } from 'sonner';
import useAuthUser from '../hooks/useAuthUser';

const ContactList = ({ contactos, onContactClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuthUser('clientes');

  const filteredContacts = contactos.filter(contact =>
    contact.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
      <div className="p-6 border-b border-gray-200/20">
        <h2 className="text-xl font-semibold text-primary mb-4">Mis Contactos</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pl-10 rounded-lg bg-white border border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500"
          />
          <svg 
            className="absolute left-3 top-3 w-4 h-4 text-gray-400"
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredContacts.map((contacto) => (
          <div
            key={contacto.id}
            onClick={() => onContactClick({
              id: contacto.id,
              nombre: contacto.nombre,
              email: contacto.email,
              tipo: 'psicologo'
            })}
            className="flex items-center p-4 hover:bg-blue-50/50 cursor-pointer border-b border-gray-200/20"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium shadow-sm">
              {contacto.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{contacto.nombre}</p>
              <p className="text-sm text-gray-500 truncate">{contacto.email}</p>
            </div>
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactList;
