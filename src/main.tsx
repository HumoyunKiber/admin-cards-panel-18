import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import { SimCardProvider } from './contexts/SimCardContext';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <ShopProvider>
        <SimCardProvider>
          <App />
          <Toaster />
        </SimCardProvider>
      </ShopProvider>
    </AuthProvider>
  </ErrorBoundary>
);
