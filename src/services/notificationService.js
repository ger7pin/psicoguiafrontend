class NotificationService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL;
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }

  async registerForPushNotifications(token) {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications no soportadas');
      }

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado');

      // Obtener suscripción push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Enviar suscripción al servidor
      await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });

      return true;
    } catch (error) {
      console.error('Error al registrar para notificaciones push:', error);
      throw error;
    }
  }

  async unregisterFromPushNotifications(token) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Eliminar suscripción del servidor
        await fetch(`${this.baseUrl}/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(subscription)
        });

        // Eliminar suscripción local
        await subscription.unsubscribe();
      }

      return true;
    } catch (error) {
      console.error('Error al cancelar suscripción de notificaciones:', error);
      throw error;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error al solicitar permiso de notificaciones:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();