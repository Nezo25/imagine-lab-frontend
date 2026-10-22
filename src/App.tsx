import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Admin from '@/pages/Admin';
import AdminLogin from '@/pages/AdminLogin';
import { ToastContainer } from '@/components/Toast';
import { MaintenanceProvider } from '@/components/MaintenanceProvider';

function ProtectedAdmin() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('__adm_token') : null;
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Admin />;
}

export default function App() {
  return (
    <MaintenanceProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedAdmin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MaintenanceProvider>
  );
}
