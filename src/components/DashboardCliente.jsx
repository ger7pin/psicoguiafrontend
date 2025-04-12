import { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Asegúrate de que este componente está correctamente importado

// Estados iniciales
const [contactos, setContactos] = useState([]);
const [citas, setCitas] = useState([]);
const [psicologos, setPsicologos] = useState([]);

const abrirChat = (contactoId) => {
    // Redirigir al chat con el contacto seleccionado
    window.location.href = `/chat/${contactoId}`;
};

useEffect(() => {
    const fetchData = async (url, setState, errorMessage) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`${errorMessage}: ${response.status} ${response.statusText}`);
                return;
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error(`${errorMessage}: Respuesta no es JSON`);
                return;
            }
            const data = await response.json();
            setState(data || []);
        } catch (error) {
            console.error(`${errorMessage}:`, error);
        }
    };

    fetchData('/api/contactos', setContactos, 'Error al recuperar los contactos');
    fetchData('/api/citas', (data) => {
        const citasFormateadas = (data || []).map((cita) => ({
            title: cita.titulo || 'Sin título',
            start: cita.fechaInicio ? new Date(cita.fechaInicio) : new Date(),
            end: cita.fechaFin ? new Date(cita.fechaFin) : new Date(),
        }));
        setCitas(citasFormateadas);
    }, 'Error al recuperar las citas');
    fetchData('/api/psicologos', setPsicologos, 'Error al recuperar los psicólogos');
}, []);

return (
    <div>
        {/* Sección de contactos y mensajes */}
        <section>
            <h2>Contactos y Mensajes</h2>
            {contactos.length > 0 ? (
                contactos.map((contacto) => (
                    <div
                        key={contacto.id}
                        onClick={() => abrirChat(contacto.id)} // Abrir chat al hacer clic
                        style={{ cursor: 'pointer' }}
                    >
                        <h3>{contacto.nombre || 'Nombre no disponible'}</h3>
                        <p>Email: {contacto.email || 'No disponible'}</p>
                        <p>Teléfono: {contacto.telefono || 'No disponible'}</p>
                    </div>
                ))
            ) : (
                <p>No hay contactos disponibles.</p>
            )}
        </section>

        {/* Sección de calendario */}
        <section>
            <h2>Calendario de Citas</h2>
            {citas.length > 0 ? (
                <Calendar
                    events={citas}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                />
            ) : (
                <p>No hay citas disponibles.</p>
            )}
        </section>

        {/* Sección de reserva de citas */}
        <section>
            <h2>Reservar una Cita</h2>
            <form>
                <label htmlFor="psicologo">Selecciona un Psicólogo:</label>
                <select id="psicologo">
                    {psicologos.length > 0 ? (
                        psicologos.map((psicologo) => (
                            <option key={psicologo.id} value={psicologo.id}>
                                {psicologo.nombre || 'Nombre no disponible'}
                            </option>
                        ))
                    ) : (
                        <option disabled>Cargando psicólogos...</option>
                    )}
                </select>
                {/* ...otros campos del formulario... */}
            </form>
        </section>
    </div>
);
