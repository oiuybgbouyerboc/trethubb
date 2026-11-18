import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';
import { isAdminIgnored, syncAdminIgnoreFromUrl } from './utils/analyticsAdmin';

// Applique et mémorise ?admin=trethub_off avant le chargement de Vercel Analytics
syncAdminIgnoreFromUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics beforeSend={(event) => (isAdminIgnored() ? null : event)} />
  </StrictMode>
);
