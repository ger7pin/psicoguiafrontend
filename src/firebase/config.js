import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';

// Verificar que las variables de entorno existan para evitar errores
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-app.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123'
};

// Asegurarnos de que el projectId no sea una cadena vacía
if (!firebaseConfig.projectId || firebaseConfig.projectId === 'undefined') {
  console.warn('Error: Firebase projectId no está definido, usando valor de respaldo');
  firebaseConfig.projectId = 'psicologia-app-default';
}

console.log('Inicializando Firebase con projectId:', firebaseConfig.projectId);

// Inicializar Firebase solo si no hay una instancia previa
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase inicializado correctamente');
} catch (error) {
  console.error('Error inicializando Firebase:', error);
  throw new Error('Error crítico: No se pudo inicializar Firebase');
}

// Inicializar Firestore con manejo de errores adecuado
let db;
try {
  db = getFirestore(app);
  console.log('Firestore inicializado correctamente');
  
  // En entorno de desarrollo, si las variables de entorno son las de prueba, usar el emulador
  if (process.env.NODE_ENV === 'development' && firebaseConfig.projectId === 'demo-project-id') {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Conectado al emulador de Firestore');
    } catch (emulatorError) {
      console.warn('No se pudo conectar al emulador de Firestore:', emulatorError);
    }
  }
} catch (dbError) {
  console.error('Error inicializando Firestore:', dbError);
  throw new Error('Error crítico: No se pudo inicializar Firestore');
}

// Intentar habilitar persistencia offline con manejo de errores
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('La persistencia offline falló - múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
      console.warn('El navegador no soporta persistencia offline');
    } else {
      console.error('Error en persistencia offline:', err);
    }
  });
} catch (persistenceError) {
  console.warn('Error al configurar persistencia:', persistenceError);
  // Continuamos sin persistencia
}

export { db };
export default app;
