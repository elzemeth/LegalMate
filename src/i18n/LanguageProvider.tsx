// TR: DİL DESTEĞİ
// EN: MULTI-LANGUAGE SUPPORT
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey, ApiErrorKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tError: (key: ApiErrorKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('tr');

  // TR: KULLANICI DİL TERCİHİNİ TARAYICI BELLEĞINDEN YÜKLE
  // EN: LOAD USER LANGUAGE PREFERENCE FROM BROWSER STORAGE
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // TR: DİL DEĞİŞİKLİĞİNDE TARAYICI BELLEĞİNE KAYDET
  // EN: SAVE LANGUAGE CHANGE TO BROWSER STORAGE
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // TR: ÇEVİRİ ANAHTARINI İLGİLİ DİL METNİNE ÇEVİR
  // EN: TRANSLATE KEY TO CORRESPONDING LANGUAGE TEXT
  const t = (key: string): string => {
    const translation = translations[language];
    const fallback = translations.tr;
    
    // Type assertion for accessing dynamic keys
    const translationValue = (translation as Record<string, unknown>)[key] as string;
    const fallbackValue = (fallback as Record<string, unknown>)[key] as string;
    
    return translationValue || fallbackValue || key;
  };

  // TR: API HATA MESAJLARI İÇİN ÇEVİRİ FONKSİYONU
  // EN: TRANSLATION FUNCTION FOR API ERROR MESSAGES
  const tError = (key: ApiErrorKey): string => {
    return translations[language].apiErrors[key] || translations.tr.apiErrors[key];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tError }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  // TR: DİL BAĞLAMININ DOĞRU KULLANILDIĞINI KONTROL ET
  // EN: ENSURE LANGUAGE CONTEXT IS USED CORRECTLY
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
