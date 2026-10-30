import React, { useState, useEffect } from 'react';
import { useLanguagePreference } from './LanguageContext';

export function StoreSettings() {
  const { language, setLanguage } = useLanguagePreference();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [pingData, setPingData] = useState<{ status: 'loading' | 'ok' | 'error', latency?: number }>({ status: 'loading' });

  useEffect(() => {
    const savedTheme = localStorage.getItem('forja_theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      setTheme('light');
    }
    
    // Initial ping
    testConnection();
    
    const interval = setInterval(testConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('forja_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const testConnection = async () => {
    setPingData({ status: 'loading', latency: pingData.latency });
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env as any).NEXT_PUBLIC_API_URL || 'https://api.imaginelab.seudominio.com.br';
      const cleanRoot = String(apiUrl).trim().replace(/\/+$/, '');
      const url = cleanRoot.endsWith('/api/v1') ? `${cleanRoot}/health/ping` : `${cleanRoot}/api/v1/health/ping`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Bad status');
      const data = await res.json();
      setPingData({ status: 'ok', latency: data.latency });
    } catch (e) {
      setPingData({ status: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
      
      {/* Theme Toggle */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-gray-100 font-bold text-lg">Tema Visual</h3>
          <p className="text-gray-400 text-sm mt-1">Alterne entre o Modo ImagineLab Escuro e Modo Claro</p>
        </div>
        <button 
          onClick={toggleTheme}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Language Preference */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-gray-100 font-bold text-lg">Idioma dos Tipos Pokémon</h3>
          <p className="text-gray-400 text-sm mt-1">Afeta as badges da vitrine e filtros</p>
        </div>
        <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button 
            onClick={() => setLanguage('PT')}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${language === 'PT' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            PT-BR
          </button>
          <button 
            onClick={() => setLanguage('EN')}
            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${language === 'EN' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* DB Latency */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-gray-100 font-bold text-lg">Monitor de Banco de Dados</h3>
          <p className="text-gray-400 text-sm mt-1">Status e latência da conexão MySQL no Backend</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            {pingData.status === 'loading' && <span className="w-3 h-3 rounded-full bg-gray-500 animate-pulse"></span>}
            {pingData.status === 'ok' && <span className={`w-3 h-3 rounded-full ${pingData.latency! < 200 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500'}`}></span>}
            {pingData.status === 'error' && <span className="w-3 h-3 rounded-full bg-red-500"></span>}
            
            <span className="text-sm font-semibold text-gray-200">
              {pingData.status === 'loading' && 'Testando...'}
              {pingData.status === 'ok' && `Conectado (${pingData.latency}ms)`}
              {pingData.status === 'error' && 'Desconectado'}
            </span>
          </div>
          <button 
            onClick={testConnection}
            className="text-orange-500 hover:text-orange-400 font-semibold text-sm underline"
          >
            Testar Agora
          </button>
        </div>
      </div>

    </div>
  );
}
