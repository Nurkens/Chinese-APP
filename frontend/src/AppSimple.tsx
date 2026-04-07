import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { XiaomeiProvider } from './contexts/XiaomeiContext';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import FloatingXiaomei from './components/FloatingXiaomei';

const AppSimple: React.FC = () => {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
};

export default AppSimple;
