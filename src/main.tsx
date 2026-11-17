import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { HueProvider } from './context/HueContext';
import './index.css';

// macOS draws the traffic lights inside the header, so the wordmark has to
// clear them (see `--d-brand-inset`). Tagging the root keeps that in CSS.
if (/Mac/i.test(navigator.userAgent)) {
  document.documentElement.dataset.platform = 'mac';
}

// Prevent default browser drag & drop behavior (which opens the image in window)
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HueProvider>
        <App />
      </HueProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
