import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { openDB } from './lib/db';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import registerServiceWorker from './registerServiceWorker';

// Register the service worker so the app can be used offline (caches app shell and assets)
// Ensure IndexedDB is initialized on first run, then register service worker
openDB()
  .then(() => {
    console.log('IndexedDB initialized');
    registerServiceWorker();
  })
  .catch((err) => {
    console.warn('Failed to initialize IndexedDB:', err);
    // Still try registering the service worker
    registerServiceWorker();
  });
