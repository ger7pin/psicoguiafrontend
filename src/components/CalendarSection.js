'use client';
import { useState } from 'react';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarSection({ selectedDate, setSelectedDate, citas, psicologos, clientes, setCitaDetails: externalSetCitaDetails }) {
  const [internalCitaDetails, setInternalCitaDetails] = useState(null);
  
  // Determine si estamos en el dashboard del cliente o del psicólogo
  const esDashboardPsicologo = clientes && !psicologos;

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    
    // Encontrar citas para este día
    const citasDelDia = citas.filter(
      cita => new Date(cita.fecha_hora).toDateString() === date.toDateString()
    );
    
    if (citasDelDia.length > 0) {
      // Mostrar la primera cita del día (podríamos mostrar una lista en el futuro)
      const citaDelDia = citasDelDia[0];
      
      // Asegurarse de que la cita tenga toda la información necesaria
      let citaConDetalles;
      
      if (esDashboardPsicologo) {
        // Para psicólogos, mostrar info del cliente
        citaConDetalles = {
          ...citaDelDia,
          cliente: clientes?.find(c => c.id === citaDelDia.cliente_id) || {
            nombre: 'Cliente no encontrado'
          }
        };
      } else {
        // Para clientes, mostrar info del psicólogo
        citaConDetalles = {
          ...citaDelDia,
          psicologo: psicologos?.find(p => p.id === citaDelDia.psicologo_id) || {
            nombre: 'Psicólogo no encontrado'
          }
        };
      }
      
      // Si hay un manejador externo, usarlo
      if (externalSetCitaDetails) {
        externalSetCitaDetails(citaConDetalles);
      } else {
        // De lo contrario, usar el estado interno
        setInternalCitaDetails(citaConDetalles);
      }
    } else {
      if (externalSetCitaDetails) {
        externalSetCitaDetails(null);
      } else {
        setInternalCitaDetails(null);
      }
    }
  };

  // Función para personalizar la apariencia de cada día
  const getTileContent = ({ date, view }) => {
    // Solo procesamos la vista mensual
    if (view !== 'month') return null;

    // Encontrar todas las citas para este día
    const citasDelDia = citas.filter(
      cita => new Date(cita.fecha_hora).toDateString() === date.toDateString()
    );

    if (citasDelDia.length > 0) {
      return (
        <div className="relative w-full h-full">
          {/* Indicador de cita */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-1">
            <div className="flex gap-1 items-center">
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
              {citasDelDia.length > 1 && (
                <span className="text-xs text-blue-500 font-medium">
                  {citasDelDia.length}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Función para personalizar las clases de cada día
  const getTileClassName = ({ date, view }) => {
    if (view !== 'month') return '';

    const hayCita = citas.some(
      cita => new Date(cita.fecha_hora).toDateString() === date.toDateString()
    );

    return hayCita ? 'has-appointment' : '';
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-primary mb-4">Calendario</h2>
      
      <style jsx global>{`
        /* Estilos personalizados para el calendario */
        .react-calendar {
          border: none;
          background: transparent;
          width: 100%;
        }

        .react-calendar__tile {
          position: relative;
          height: 60px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding-top: 8px;
        }

        .react-calendar__tile.has-appointment {
          background-color: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          font-weight: 500;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: rgba(59, 130, 246, 0.2);
        }

        .react-calendar__tile--active {
          background-color: #2563eb !important;
          color: white !important;
        }

        .react-calendar__tile--active .text-blue-500 {
          color: white;
        }

        .react-calendar__tile--active span {
          color: white;
        }

        .react-calendar__month-view__days__day--weekend {
          color: #ef4444;
        }

        .react-calendar__month-view__days__day--neighboringMonth {
          color: #9ca3af;
        }
      `}</style>

      <Calendar
        onChange={handleSelectDate}
        value={selectedDate}
        tileContent={getTileContent}
        tileClassName={getTileClassName}
        className="w-full p-4"
      />

      {/* Sección de detalles de la cita - solo se muestra si no hay manejador externo */}
      {!externalSetCitaDetails && internalCitaDetails && (
        <div className="bg-white/10 mt-6 p-4 rounded-xl border border-white/10 shadow-md">
          <h3 className="text-lg font-semibold text-primary mb-2">Detalles de la Cita</h3>
          
          {esDashboardPsicologo ? (
            /* Vista para psicólogos */
            <p className="text-muted-foreground">
              <span className="font-medium">Cliente:</span>{' '}
              {internalCitaDetails.cliente?.nombre || 'Cliente no disponible'}
            </p>
          ) : (
            /* Vista para clientes */
            <p className="text-muted-foreground">
              <span className="font-medium">Psicólogo:</span>{' '}
              {internalCitaDetails.psicologo?.nombre || 'Nombre no disponible'}
            </p>
          )}
          
          <p className="text-muted-foreground">
            <span className="font-medium">Fecha y Hora:</span>{' '}
            {new Date(internalCitaDetails.fecha_hora).toLocaleString()}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Descripción:</span>{' '}
            {internalCitaDetails.descripcion || 'Sin descripción'}
          </p>
        </div>
      )}
    </div>
  );
}