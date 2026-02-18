
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('CropGuard app loading...');
console.log('Root element:', document.getElementById("root"));

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
console.log('CropGuard app rendered successfully!');
