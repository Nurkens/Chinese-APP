import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';

const AppSimple: React.FC = () => {
  return (
    <AuthProvider>
      <ProgressProvider>
        <Router>
          <Routes>
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </Router>
      </ProgressProvider>
    </AuthProvider>
  );
};

export default AppSimple;
