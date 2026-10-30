import React, { createContext, useContext, useState, useEffect } from 'react';

export type LangMode = 'PT' | 'EN';

interface LanguageContextProps {
  language: LangMode;
  setLanguage: (lang: LangMode) => void;
  translateType: (type: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const typeDictionary: Record<string, string> = {
  'Normal': 'Normal',
  'Fogo': 'Fire',
  'Água': 'Water',
  'Elétrico': 'Electric',
  'Planta': 'Grass',
  'Gelo': 'Ice',
  'Lutador': 'Fighting',
  'Veneno': 'Poison',
  'Terra': 'Ground',
  'Voador': 'Flying',
  'Psíquico': 'Psychic',
  'Inseto': 'Bug',
  'Pedra': 'Rock',
  'Fantasma': 'Ghost',
  'Dragão': 'Dragon',
  'Sombrio': 'Dark',
  'Metálico': 'Steel',
  'Fada': 'Fairy'
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LangMode>('PT');

  useEffect(() => {
    const saved = localStorage.getItem('forja_language') as LangMode;
    if (saved) setLanguageState(saved);
  }, []);

  const setLanguage = (lang: LangMode) => {
    setLanguageState(lang);
    localStorage.setItem('forja_language', lang);
  };

  const translateType = (type: string) => {
    if (language === 'PT') return type;
    return typeDictionary[type] || type;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translateType }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguagePreference = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguagePreference must be used within LanguageProvider');
  return ctx;
};
