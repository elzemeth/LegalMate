// TR: HUKUKİ SORGU ARAYÜZÜ İLE ANA UYGULAMA SAYFASI
// EN: MAIN APPLICATION PAGE WITH LEGAL QUERY INTERFACE
"use client";

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import InputBox from "../components/InputBox";
import OutputBox from "../components/OutputBox";
import Link from "next/link";

interface SearchResult {
  id: string;
  content: string;
  metadata: {
    madde_no: string;
    baslik: string;
    kanun_adi: string;
    chunk_index: number;
    total_chunks: number;
    paragraflar?: Array<{ no: string; icerik: string }>;
    icerik?: string;
  };
  similarity: number;
}

interface GeminiResponse {
  text: string;
  searchResults?: SearchResult[];
  context?: string;
  error?: string;
  wasTranslated?: boolean;
  searchQuery?: string;
}

export default function Home() {
  const [result, setResult] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [context, setContext] = useState("");
  const [translationInfo, setTranslationInfo] = useState<{ wasTranslated: boolean; searchQuery?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [originalQuery, setOriginalQuery] = useState("");
  const { t, language, setLanguage } = useLanguage();

  const handlePrompt = async (msg: string) => {
    setIsLoading(true);
    setOriginalQuery(msg);
    
    try {
      // TR: AI ANALİZ API'SİNE SORGU GÖNDERİMİ
      // EN: SEND QUERY TO AI ANALYSIS API
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: msg,
          lang: language 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      
      // TR: AI YANIT VERİLERİNİ İŞLEME VE EKRANA YAZMA
      // EN: PROCESS AI RESPONSE DATA AND DISPLAY RESULTS
      if (data.error) {
        setResult(`Error: ${data.error}`);
        setSearchResults([]);
        setContext("");
        setTranslationInfo(null);
      } else {
        setResult(data.text || "No response received");
        setSearchResults(data.searchResults || []);
        setContext(data.context || "");
        setTranslationInfo(data.wasTranslated ? { 
          wasTranslated: true, 
          searchQuery: data.searchQuery 
        } : null);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult(`Error: ${errorMessage}`);
      setSearchResults([]);
      setContext("");
      setTranslationInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="LegalMate Logo" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-sm text-gray-600">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switch */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('tr')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'tr'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                🇹🇷 TR
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                🇺🇸 EN
              </button>
            </div>
            
            <Link 
              href="/admin" 
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t('admin')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('heroTitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <InputBox onSend={handlePrompt} disabled={isLoading} />
        </div>

        {/* Output Section */}
        {(result || isLoading) && (
          <div className="mb-8">
            <OutputBox 
              content={isLoading ? t('analyzing') : result} 
              searchResults={searchResults}
              context={context}
              translationInfo={translationInfo}
              originalQuery={originalQuery}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 mt-16 pt-8 border-t border-gray-200">
          <p className="mb-2">{t('disclaimer')}</p>
          <p>{t('copyright')}</p>
        </footer>
      </main>
    </div>
  );
}
