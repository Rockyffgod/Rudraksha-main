
export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  send: (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico', // Fallback icon
          badge: '/favicon.ico',
          ...options
        });
      } catch (e) {
        console.error("Notification failed", e);
      }
    }
  },

  hasPermission: (): boolean => {
    return 'Notification' in window && Notification.permission === 'granted';
  }
};
