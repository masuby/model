import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/source-serif-4/wght.css';
import '@/styles/index.css';
import '@/i18n';
import App from '@/app/App';
import { installUpdateReload } from '@/app/updateReload';

installUpdateReload();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
