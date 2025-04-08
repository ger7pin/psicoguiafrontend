"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const useAuthRedirect = ({ userType }) => {
  const router = useRouter();

  useEffect(() => {
    const verificarToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
          method: 'GET',
          credentials: 'include', // 🔥 Importante para que la cookie viaje
        });

        if (!res.ok) throw new Error("No autorizado");

        const data = await res.json();
        const { email, rol } = data;

        if (rol !== userType) throw new Error("Rol incorrecto");

        router.push(`/${userType}s/dashboard`);
      } catch (err) {
        console.log("🔒 Usuario no autenticado, permanece en login");
      }
    };

    verificarToken();
  }, [router, userType]);
};

export default useAuthRedirect;

