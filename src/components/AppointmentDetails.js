// src/components/AppointmentDetails.js
'use client';

import { motion } from 'framer-motion';

export default function AppointmentDetails({ cita }) {
  if (!cita) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl mt-6"
    >
      <h2 className="text-xl font-semibold text-primary mb-4">Detalles de la Cita</h2>
      <div className="space-y-2">
        <p className="text-muted-foreground">
          <span className="font-medium text-primary">Psicólogo:</span> {cita.psicologo.nombre}
        </p>
        <p className="text-muted-foreground">
          <span className="font-medium text-primary">Fecha y Hora:</span>{' '}
          {new Date(cita.fecha_hora).toLocaleString()}
        </p>
        <p className="text-muted-foreground">
          <span className="font-medium text-primary">Descripción:</span> {cita.descripcion}
        </p>
      </div>
    </motion.div>
  );
}
