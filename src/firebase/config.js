import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';

// Verificar que tenemos las variables de entorno necesarias
const hasAllEnvVars = (
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

// Si no tenemos todas las variables, mostrar advertencia clara
if (!hasAllEnvVars) {
  console.error('⚠️ CONFIGURACIÓN INCOMPLETA: Faltan variables de entorno para Firebase ⚠️');
  console.error('Por favor, crea un archivo .env.local con las credenciales correctas de Firebase.');
  console.error('Puedes usar .env.local.example como referencia.');
}

// Configuración con fallback para desarrollo
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoKeyForDevEnvironmentOnly',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'psicologia-app-demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'psicologia-app-demo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'psicologia-app-demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890'
};

// Verificar si estamos usando configuración de demo para alertar al usuario
const isUsingDemoConfig = (
  firebaseConfig.projectId === 'psicologia-app-demo' || 
  !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

if (isUsingDemoConfig) {
  console.warn('⚠️ ADVERTENCIA: Usando configuración de DEMO para Firebase ⚠️');
  console.warn('Esta configuración solo funciona en modo offline (caché local).');
  console.warn('Para usar Firebase en producción, agrega las variables de entorno correctas.');
}

console.log('Inicializando Firebase con projectId:', firebaseConfig.projectId);

// Inicializar Firebase solo si no hay una instancia previa
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase inicializado correctamente');
  
  // Informar al usuario sobre el estado de la configuración
  if (isUsingDemoConfig) {
    console.warn('Firebase está usando configuración de DEMO - funcionalidad limitada');
  } else {
    console.log('Firebase está utilizando tu configuración de proyecto real');
  }
} catch (error) {
  console.error('Error inicializando Firebase:', error);
  console.error('Detalles adicionales:', error.message);
  
  // No lanzar excepción, seguir con funcionalidad limitada
  console.warn('Continuando con funcionalidad limitada (sin conexión a Firebase).');
}

// Inicializar Firestore con manejo de errores adecuado
let db;
try {
  db = getFirestore(app);
  console.log('Firestore inicializado correctamente');
  
  // Si estamos en desarrollo y usando configuración de demo, conectar al emulador
  if (process.env.NODE_ENV === 'development' && isUsingDemoConfig) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Conectado al emulador de Firestore');
    } catch (emulatorError) {
      console.warn('No se pudo conectar al emulador de Firestore:', emulatorError);
    }
  }
} catch (dbError) {
  console.error('Error inicializando Firestore:', dbError);
  console.error('Detalles:', dbError.message);
  
  // Crear una instancia de db que no haga nada pero evite errores
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: () => false, data: () => ({}) }),
        set: async () => console.warn('Operación Firebase simulada: sin conexión'),
        update: async () => console.warn('Operación Firebase simulada: sin conexión')
      }),
      add: async () => console.warn('Operación Firebase simulada: sin conexión')
    })
  };
  console.warn('Usando un objeto Firestore simulado para prevenir errores');
}

// Intentar habilitar persistencia offline con manejo de errores
try {
  // Solo habilitamos persistencia si tenemos una instancia de db válida (no la simulada)
  if (db && typeof db !== 'object') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('La persistencia offline falló - múltiples pestañas abiertas');
      } else if (err.code === 'unimplemented') {
        console.warn('El navegador no soporta persistencia offline');
      } else {
        console.error('Error en persistencia offline:', err);
      }
    });
  }
} catch (persistenceError) {
  console.warn('Error al configurar persistencia:', persistenceError);
  // Continuamos sin persistencia
}

// Función auxiliar para verificar si Firebase está correctamente configurado
export const isFirebaseConfigured = () => {
  return !isUsingDemoConfig && db && typeof db !== 'object';
};

// Función para obtener el estado de la conexión a Firebase
export const getFirebaseConnectionStatus = () => {
  return {
    isDemo: isUsingDemoConfig,
    isConnected: !isUsingDemoConfig && db && typeof db !== 'object',
    projectId: firebaseConfig.projectId
  };
}

export { db };
export default app;
