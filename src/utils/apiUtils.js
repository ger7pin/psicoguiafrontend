/**
 * Función utilitaria para manejar respuestas de API de manera segura
 * @param {Response} response - La respuesta de fetch
 * @returns {Promise<any>} - Los datos parseados o null si hay error
 */
export const safeJsonParse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      console.warn('Respuesta del servidor no es JSON:', text);
      return null;
    }
  } catch (error) {
    console.error('Error al parsear respuesta JSON:', error);
    return null;
  }
};

/**
 * Función para hacer fetch con manejo seguro de JSON
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise<{data: any, ok: boolean, status: number}>}
 */
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await safeJsonParse(response);
    
    return {
      data,
      ok: response.ok,
      status: response.status,
      response
    };
  } catch (error) {
    console.error('Error en safeFetch:', error);
    return {
      data: null,
      ok: false,
      status: 0,
      error
    };
  }
};