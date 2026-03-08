// Registers the service worker shipped in /public/sw.js
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope:', registration.scope);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('Service worker update found:', newWorker);
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('New service worker state:', newWorker.state);
                // When the new worker is installed and there's an existing controller,
                // it means there's an update waiting. Notify the page so it can prompt the user.
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent('swWaiting', { detail: registration }));
                }
              });
            }
          });

          // If there's a waiting worker on registration (e.g., reload after install), notify page
          if (registration.waiting) {
            console.log('Service worker is waiting to activate. Notifying page to update.');
            window.dispatchEvent(new CustomEvent('swWaiting', { detail: registration }));
          }

          // Expose registration for debugging (not required)
          // @ts-ignore
          window.__sw_registration = registration;
        })
        .catch((err) => {
          console.warn('ServiceWorker registration failed:', err);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  }
}

export default registerServiceWorker;
