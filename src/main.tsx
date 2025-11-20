import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './index.css'
import { logger } from './utils/logger'

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  logger.error('Unhandled error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

createRoot(document.getElementById("root")!).render(<App />);
