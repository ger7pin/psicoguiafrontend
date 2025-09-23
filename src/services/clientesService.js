/**
 * Servicio para gestionar la información de clientes
 */

/**
 * Obtiene la lista de todos los clientes disponibles
 * @returns {Promise<Array>} Lista de clientes
 */
export const obtenerClientes = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
};

/**
 * Obtiene los detalles de un cliente específico
 * @param {number} id - ID del cliente
 * @returns {Promise<Object>} Datos del cliente
 */
export const obtenerClientePorId = async (id) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${id}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener cliente ${id}:`, error);
    return null;
  }
};
