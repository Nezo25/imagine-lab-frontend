import React, { createContext, useContext, useState, useEffect } from 'react';

interface MaintenanceContextType {
  isMaintenance: boolean;
  setMaintenance: (val: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenance: false,
  setMaintenance: () => {},
});

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const check = localStorage.getItem('imaginelab_maintenance') === 'true';
    setIsMaintenance(check);
  }, []);

  const setMaintenance = (val: boolean) => {
    setIsMaintenance(val);
    localStorage.setItem('imaginelab_maintenance', val ? 'true' : 'false');
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenance, setMaintenance }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}
