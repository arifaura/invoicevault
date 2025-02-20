import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { UpgradeProvider } from './context/UpgradeContext';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';

// ... other imports ...

function App() {
  console.log('App rendering');
  
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <UpgradeProvider>
            <NotificationProvider>
              <Toaster position="top-right" />
              <AppRoutes />
            </NotificationProvider>
          </UpgradeProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 