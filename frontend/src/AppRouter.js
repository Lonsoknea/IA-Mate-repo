import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './HomePage';
import IAFlowchart from './IAFlowchart';
import AIChat from './AIChat';
import Login from './Login';
import Profile from './Profile';
import ReferentPage from './ReferentPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><IAFlowchart /></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/referent" element={<ProtectedRoute><ReferentPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
