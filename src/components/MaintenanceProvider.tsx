import React, { createContext, useContext, useState, useEffect } from 'react';

interface MaintenanceContextProps {
  isMaintenance: boolean;
  setMaintenance: (val: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextProps | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMaintenance, setMaintenance] = useState(false);

  // Verificação de status e health check
  return (
    <MaintenanceContext.Provider value={{ isMaintenance, setMaintenance }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) throw new Error('useMaintenance must be used within MaintenanceProvider');
  return ctx;
};

function MaintenanceOverlay() {
  const { setMaintenance } = useMaintenance();
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env as any).NEXT_PUBLIC_API_URL || 'https://api.imaginelab.seudominio.com.br';
      const cleanRoot = String(apiUrl).trim().replace(/\/+$/, '');
      const url = cleanRoot.endsWith('/api/v1') ? `${cleanRoot}/health/ping` : `${cleanRoot}/api/v1/health/ping`;
      await fetch(url);
    } catch (e) {
      // still down
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-[#0B0D13]/95 backdrop-blur-md">
      <div className="flex flex-col items-center justify-center max-w-md text-center gap-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-2xl bg-gray-800 shadow-2xl flex items-center justify-center border-2 border-purple-500/40 relative">
          <img src="/images/logo.png" alt="ImagineLab 3D" className="w-16 h-16 object-contain z-10" />
          <div className="absolute inset-0 bg-purple-500/20 animate-ping rounded-2xl"></div>
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Atualizando o Laboratório!</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            O servidor está passando por uma atualização neste momento. 
            Nossas impressoras continuam a todo vapor. Voltamos em instantes!
          </p>
        </div>
        
        <button 
          onClick={checkStatus}
          disabled={checking}
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-bold transition-all shadow-lg shadow-purple-950/40 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {checking ? 'Verificando fornalhas...' : 'Tentar Novamente'}
        </button>
      </div>
    </div>
  );
}
