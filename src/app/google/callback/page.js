'use client';
import { Suspense } from 'react';
import GoogleCallbackContent from '@/components/GoogleCallbackContent';
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Conectando con Google Calendar...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}