// src/hooks/useAuthRedirect.js
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function useAuthRedirect(loginPath) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(loginPath);
    }
  }, [router, loginPath]);
}
