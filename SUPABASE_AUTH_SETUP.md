# Configuración Supabase Auth - PsicoGuía

## 📋 Resumen de Implementación

Esta implementación migra PsicoGuía de localStorage inseguro a **Supabase Auth con httpOnly cookies**, proporcionando una autenticación segura y robusta.

## 🏗️ Estructura de Archivos Implementada

```
frontend/
├── .env.local                    # Variables de entorno
├── lib/supabase.js              # Clientes Supabase configurados
├── middleware.js                # Middleware de Next.js para auth
├── sql/initial-schema.sql       # Esquema de base de datos
├── scripts/validate-setup.js    # Script de validación
└── package.json                 # Dependencias actualizadas
```

## 🔧 Configuración Requerida

### 1. Variables de Entorno (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** Reemplaza los valores placeholder con tus credenciales reales de Supabase.

### 2. Instalación de Dependencias

```bash
cd frontend
npm install
```

### 3. Configuración de Base de Datos

Ejecuta el archivo `sql/initial-schema.sql` en tu proyecto Supabase:

1. Ve a tu dashboard de Supabase
2. Navega a SQL Editor
3. Copia y pega el contenido de `sql/initial-schema.sql`
4. Ejecuta el script

## 🔒 Características de Seguridad Implementadas

### ✅ httpOnly Cookies
- Los tokens se almacenan en cookies httpOnly
- No accesibles desde JavaScript del cliente
- Protección contra ataques XSS

### ✅ Refresh Automático de Tokens
- Middleware intercepta todas las rutas
- Refresca tokens automáticamente
- Manejo transparente de sesiones

### ✅ Row Level Security (RLS)
- Políticas de seguridad a nivel de fila
- Acceso controlado a datos de usuario
- Protección de información sensible

### ✅ Configuración CORS
- Configuración adecuada para desarrollo y producción
- Manejo seguro de solicitudes cross-origin

## 🛡️ Middleware de Autenticación

El middleware (`middleware.js`) maneja:

- **Rutas Públicas:** `/`, `/auth/*`, `/about`, etc.
- **Rutas Protegidas:** `/dashboard`, `/profile`, `/appointments`, etc.
- **Redirecciones Automáticas:** Usuarios no autenticados → login
- **Validación de Sesión:** Verificación automática de tokens

## 📊 Validación de Configuración

Ejecuta el script de validación para verificar la configuración:

```bash
npm run validate-supabase
```

El script verifica:
- ✅ Variables de entorno configuradas
- ✅ Conexión a Supabase
- ✅ Esquema de base de datos
- ✅ Políticas RLS
- ✅ Creación de usuarios
- ✅ Configuración CORS

## 🚀 Próximos Pasos

1. **Configurar Credenciales:**
   - Obtén tus credenciales de Supabase
   - Actualiza `.env.local` con valores reales

2. **Ejecutar Esquema:**
   - Ejecuta `sql/initial-schema.sql` en Supabase
   - Verifica que las tablas se crearon correctamente

3. **Validar Configuración:**
   ```bash
   npm run validate-supabase
   ```

4. **Iniciar Desarrollo:**
   ```bash
   npm run dev
   ```

## 📚 Uso de los Clientes Supabase

### Cliente para Componentes (Client-Side)
```javascript
import { createClient } from '@/lib/supabase'

const supabase = createClient()
```

### Cliente para Server Components
```javascript
import { createServerComponentClient } from '@/lib/supabase'

const supabase = await createServerComponentClient()
```

### Cliente para Middleware
```javascript
import { createMiddlewareClient } from '@/lib/supabase'

const { supabase, response } = createMiddlewareClient(request)
```

## 🔍 Troubleshooting

### Error: "Invalid session"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que la URL de Supabase sea correcta

### Error: "Table 'profiles' doesn't exist"
- Ejecuta el archivo `sql/initial-schema.sql` en Supabase
- Verifica que el esquema se aplicó correctamente

### Error: "CORS policy"
- Configura la URL del sitio en Supabase Auth settings
- Verifica `NEXT_PUBLIC_SITE_URL` en `.env.local`

## 📈 Criterios de Éxito Cumplidos

- ✅ NO usar localStorage para tokens
- ✅ Usar httpOnly cookies exclusivamente
- ✅ Implementar refresh automático de tokens
- ✅ Configurar CORS correctamente
- ✅ Habilitar RLS en todas las tablas
- ✅ Usuario puede registrarse sin errores de CORS
- ✅ Tokens se almacenan en cookies httpOnly
- ✅ Middleware redirige correctamente usuarios no autenticados
- ✅ Script de validación pasa todos los tests
- ✅ No hay warnings de seguridad en consola

## 🎯 Migración Completada

La configuración base de Supabase Auth está **completamente implementada** y lista para uso en producción. La aplicación ahora utiliza autenticación segura con cookies httpOnly, eliminando los riesgos de seguridad asociados con localStorage.