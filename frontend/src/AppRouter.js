import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import IAFlowchart from './IAFlowchart';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<IAFlowchart />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
