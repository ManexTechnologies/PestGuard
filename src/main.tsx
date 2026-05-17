
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('PestGuard application initializing...');

// Performance monitoring
const startTime = performance.now();

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element not found');
  throw new Error('Root element (#root) not found in DOM');
}

console.log('Root element found, creating React root...');

// Create and render React app
createRoot(rootElement).render(<App />);

// Log initialization time
const endTime = performance.now();
console.log(`PestGuard app initialized successfully in ${(endTime - startTime).toFixed(2)}ms`);

// Monitor if app becomes unresponsive
setTimeout(() => {
  const appElement = document.querySelector('[class*="App"]');
  if (!appElement) {
    console.warn('App may not have loaded correctly');
  }
}, 3000);
