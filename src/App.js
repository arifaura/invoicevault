import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import './styles/theme.css';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import NotFound from './components/NotFound/NotFound';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Overview from './components/Dashboard/Overview';
import Invoices from './components/Dashboard/Invoices';
import InvoiceView from './components/Dashboard/InvoiceView';
import Settings from './components/Dashboard/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <Toaster position="top-right" />
              <ThemeToggle />
              <Routes>
                {/* Public routes - only accessible when NOT logged in */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/signup" element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                  <PublicRoute>
                    <Login isResetMode={true} />
                  </PublicRoute>
                } />

                {/* Protected routes - only accessible when logged in */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Overview />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="invoice/:id" element={<InvoiceView />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Root redirect */}
                <Route path="/" element={
                  <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
                } />

                {/* Static and 404 pages */}
                <Route path="/terms" element={<NotFound />} />
                <Route path="/privacy" element={<NotFound />} />
                <Route path="/contact" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
