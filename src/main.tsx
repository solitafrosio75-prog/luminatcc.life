import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Bootstrap KB: registra todas las técnicas antes de montar la app.
// Vive aquí (no en registry.ts) para evitar TDZ circular.
import './knowledge/registry-init';

// Mock para desarrollo
import('../mockClinicalEngine').then(({ installMockFetch }) => {
  installMockFetch();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
