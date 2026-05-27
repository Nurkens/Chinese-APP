import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { XiaomeiProvider } from './contexts/XiaomeiContext';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import FloatingXiaomei from './components/FloatingXiaomei';

const AppSimple: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <SettingsProvider>
          <ProgressProvider>
            <XiaomeiProvider>
              <Router>
                <Routes>
                  <Route path="/welcome" element={<WelcomeScreen />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/" element={<Navigate to="/welcome" replace />} />
                </Routes>
              </Router>
              <FloatingXiaomei />
            </XiaomeiProvider>
          </ProgressProvider>
        </SettingsProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default AppSimple;
