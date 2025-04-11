'use client';

export default function ContactList({ contactos }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold mb-4 text-primary">Mis Contactos</h2>
      {contactos?.length === 0 ? (
        <p className="text-muted-foreground">No tienes contactos registrados aún.</p>
      ) : (
        <ul className="space-y-4">
          {contactos.map((contacto) => (
            <li key={contacto.id} className="border-b border-white/10 pb-3">
              <p className="font-medium text-primary">{contacto.nombre}</p>
              <p className="text-sm text-muted-foreground">{contacto.telefono}</p>
              <p className="text-sm text-muted-foreground">{contacto.email}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
