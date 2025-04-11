'use client';

import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarSection({ selectedDate, setSelectedDate, citas, setCitaDetails, citaDetails }) {
    const handleSelectDate = (date) => {
        setSelectedDate(date);
      
        const citaDelDia = citas.find(
          cita => new Date(cita.fecha_hora).toDateString() === date.toDateString()
        );
      
        setCitaDetails(citaDelDia || null); // ⬅️ Esto actualiza la cita seleccionada
      };

  const getTileClassName = ({ date }) => {
    const hayCita = citas.some(
      cita => new Date(cita.fecha_hora).toDateString() === date.toDateString()
    );
    return hayCita ? 'bg-gray-300 rounded-full' : null;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-primary mb-4">Calendario</h2>
      <Calendar
        onChange={handleSelectDate}
        value={selectedDate}
        tileClassName={getTileClassName}
        className="w-full p-4"
      />

      {citaDetails && (
        <div className="bg-white/10 mt-6 p-4 rounded-xl border border-white/10 shadow-md">
          <h3 className="text-lg font-semibold text-primary mb-2">Detalles de la Cita</h3>
          <p className="text-muted-foreground">
            <span className="font-medium">Psicólogo:</span> {citaDetails.psicologo.nombre}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Fecha y Hora:</span> {new Date(citaDetails.fecha_hora).toLocaleString()}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Descripción:</span> {citaDetails.descripcion}
          </p>
        </div>
      )}
    </div>
  );
}
