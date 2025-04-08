'use client';

useEffect(() => {
  const verificarSesion = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${tipo}/verify`, {
        method: 'GET', // 👈 ¡IMPORTANTE!
        credentials: 'include' // 👈 para que mande la cookie
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message === 'Sesión activa') {
          router.push(`/${tipo}/dashboard`); // redirige según el tipo
        }
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
    }
  };

  verificarSesion();
}, [tipo]);


