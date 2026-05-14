import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import UserManagement from './components/UserManagement';
import LaunchPage from './components/LaunchPage';
import NoticiasHistoricas from './components/NoticiasHistoricas';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/noticias-historicas" element={<ProtectedRoute><NoticiasHistoricas /></ProtectedRoute>} />
      <Route path="/lanzamiento" element={<ProtectedRoute><LaunchPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
