-- =====================================================
-- ESQUEMA INICIAL SUPABASE PARA PSICOGUÍA
-- =====================================================
-- Este archivo contiene el esquema inicial de la base de datos
-- incluyendo tablas, triggers y políticas RLS (Row Level Security)

-- =====================================================
-- EXTENSIONES NECESARIAS
-- =====================================================

-- Habilitar extensión UUID para generar IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA PROFILES
-- =====================================================
-- Tabla de perfiles vinculada a auth.users
-- Almacena información adicional de los usuarios

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
    user_type TEXT NOT NULL DEFAULT 'cliente' CHECK (user_type IN ('cliente', 'psicologo', 'admin')),
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- TABLA PSYCHOLOGISTS (PSICÓLOGOS)
-- =====================================================
-- Información específica para usuarios tipo psicólogo

CREATE TABLE IF NOT EXISTS public.psychologists (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    license_number TEXT UNIQUE NOT NULL,
    specializations TEXT[] DEFAULT '{}',
    years_experience INTEGER DEFAULT 0,
    education JSONB DEFAULT '{}',
    certifications JSONB DEFAULT '{}',
    consultation_fee DECIMAL(10,2),
    available_hours JSONB DEFAULT '{}',
    bio TEXT,
    languages TEXT[] DEFAULT '{"español"}',
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para la tabla profiles
CREATE INDEX IF NOT EXISTS profiles_user_type_idx ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);

-- Índices para la tabla psychologists
CREATE INDEX IF NOT EXISTS psychologists_is_verified_idx ON public.psychologists(is_verified);
CREATE INDEX IF NOT EXISTS psychologists_specializations_idx ON public.psychologists USING GIN(specializations);
CREATE INDEX IF NOT EXISTS psychologists_rating_idx ON public.psychologists(rating);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS psychologists_updated_at ON public.psychologists;
CREATE TRIGGER psychologists_updated_at
    BEFORE UPDATE ON public.psychologists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologists ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABLA PROFILES
-- =====================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil (manejado por trigger)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Los psicólogos verificados son visibles públicamente (para búsquedas)
CREATE POLICY "Verified psychologists are publicly readable" ON public.profiles
    FOR SELECT USING (
        user_type = 'psicologo' AND 
        is_active = true AND
        id IN (SELECT id FROM public.psychologists WHERE is_verified = true)
    );

-- =====================================================
-- POLÍTICAS PARA TABLA PSYCHOLOGISTS
-- =====================================================

-- Los psicólogos pueden ver y editar su propia información
CREATE POLICY "Psychologists can manage own data" ON public.psychologists
    FOR ALL USING (auth.uid() = id);

-- Los psicólogos verificados son visibles públicamente
CREATE POLICY "Verified psychologists are publicly readable" ON public.psychologists
    FOR SELECT USING (is_verified = true);

-- Solo los psicólogos pueden insertar en esta tabla
CREATE POLICY "Only psychologists can insert" ON public.psychologists
    FOR INSERT WITH CHECK (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND user_type = 'psicologo'
        )
    );

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario vinculados a auth.users';
COMMENT ON TABLE public.psychologists IS 'Información específica para psicólogos';

COMMENT ON COLUMN public.profiles.user_type IS 'Tipo de usuario: cliente, psicologo, admin';
COMMENT ON COLUMN public.profiles.preferences IS 'Preferencias del usuario en formato JSON';
COMMENT ON COLUMN public.profiles.emergency_contact IS 'Contacto de emergencia en formato JSON';

COMMENT ON COLUMN public.psychologists.license_number IS 'Número de licencia profesional';
COMMENT ON COLUMN public.psychologists.specializations IS 'Array de especializaciones';
COMMENT ON COLUMN public.psychologists.available_hours IS 'Horarios disponibles en formato JSON';
COMMENT ON COLUMN public.psychologists.verification_documents IS 'Documentos de verificación en formato JSON';