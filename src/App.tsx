import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Admin from '@/pages/Admin';
import AdminLogin from '@/pages/AdminLogin';
import { ToastContainer } from '@/components/Toast';
import { LanguageProvider } from '@/components/LanguageContext';
import { MaintenanceProvider } from '@/components/MaintenanceProvider';

function ProtectedAdmin({ defaultSection }: { defaultSection?: any }) {
  const token = sessionStorage.getItem('__adm_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Admin defaultSection={defaultSection} />;
}

export default function App() {
  return (
    <MaintenanceProvider>
    <LanguageProvider>
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedAdmin />} />
        <Route path="/admin/destaques" element={<ProtectedAdmin defaultSection="destaques" />} />
        <Route path="/admin/pedidos-financas" element={<ProtectedAdmin defaultSection="pedidos" />} />
        <Route path="/admin/avaliacoes" element={<ProtectedAdmin defaultSection="avaliacoes" />} />
        <Route path="/admin/cupons" element={<ProtectedAdmin defaultSection="cupons" />} />
        <Route path="/admin/campanhas" element={<ProtectedAdmin defaultSection="campanhas" />} />
        <Route path="/admin/bastidores" element={<ProtectedAdmin defaultSection="bastidores" />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
    </MaintenanceProvider>
  );
}
