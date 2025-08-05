// TR: SİSTEM YÖNETİMİ VE İZLEME İÇİN YÖNETİCİ PANELİ
// EN: ADMIN PANEL FOR DATABASE AND SYSTEM OPERATIONS

'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { SearchResultItem } from '../../lib/search';
import Link from 'next/link';

interface IndexStats {
  totalChunks: number;
  uniqueArticles: number;
  lawTypes: string[];
}

interface EnhancedSystemStats {
  database: {
    totalChunks: number;
    uniqueArticles: number;
    lawTypes: string[];
    lastUpdated: string;
    databaseSize: string;
    avgChunkSize: number;
  };
  searchPerformance: {
    avgSemanticSearchTime: number;
    avgProfessionalSearchTime: number;
    searchAccuracy: number;
    totalSearches: number;
  };
  aiMetrics: {
    embeddingModel: string;
    embeddingDimensions: number;
    processingCapacity: string;
    modelAccuracy: number;
  };
  systemHealth: {
    uptime: string;
    memoryUsage: string;
    databaseConnectivity: boolean;
    apiResponseTime: number;
    errorRate: number;
  };
  professionalSearchMetrics: {
    precisionAtOne: number;
    precisionAtThree: number;
    falsePositiveRate: number;
    averageRelevance: number;
    domainClassificationAccuracy: number;
  };
  recentActivity: {
    searchesLast24h: number;
    searchesLast7d: number;
    popularQueries: string[];
    errorLogsLast24h: number;
  };
}

interface LawFileInfo {
  fileName: string;
  displayName: string;
  totalArticles: number;
  hasSubLaws: boolean;
  structure: {
    kitap?: number;
    kisim?: number;
    bolum?: number;
    ayirim?: number;
  };
}

interface SearchQualityResult {
  success: boolean;
  error?: string;
  details?: string;
  stack?: string;
  query?: string;
  qualityAnalysis?: {
    summary: {
      falsePositiveReduction: string;
      relevanceImprovement: string;
      bestMethod: string;
    };
    improvements?: string[];
  };
  testResults?: {
    originalSearch: {
      method: string;
      count: number;
      relevantCount: number;
      customsCount: number;
      results: Array<{
        position: number;
        article: string;
        law: string;
        score: number;
        relevanceScore: number;
        preview: string;
        hasIrrelevantContent: boolean;
        hasRelevantContent: boolean;
        qualityStatus: string;
        domainScore?: number;
        entityScore?: number;
        similarity?: number;
        content?: string;
        metadata?: Record<string, unknown>;
      }>;
    };
    enhancedSearch: {
      method: string;
      count: number;
      relevantCount: number;
      customsCount: number;
      results: Array<{
        position: number;
        article: string;
        law: string;
        score: number;
        relevanceScore: number;
        preview: string;
        hasIrrelevantContent: boolean;
        hasRelevantContent: boolean;
        qualityStatus: string;
        domainScore?: number;
        entityScore?: number;
        similarity?: number;
        content?: string;
        metadata?: Record<string, unknown>;
      }>;
    };
    professionalSearch: {
      method: string;
      count: number;
      relevantCount: number;
      customsCount: number;
      results: Array<{
        position: number;
        article: string;
        law: string;
        score: number;
        relevanceScore: number;
        preview: string;
        hasIrrelevantContent: boolean;
        hasRelevantContent: boolean;
        qualityStatus: string;
        domainScore?: number;
        entityScore?: number;
        contextScore?: number;
        similarity?: number;
        content?: string;
        metadata?: Record<string, unknown>;
      }>;
    };
  };
}

interface ProfessionalSearchResult {
  success: boolean;
  error?: string;
  details?: string;
  query?: string;
  qualityGrade?: string;
  qualityAnalysis?: {
    totalResults: number;
    averageScore: number;
    precisionAtOne: number;
    domainAccuracy: number;
    entityMatchRate: number;
  };
  results?: Array<{
    id: string;
    content: string;
    metadata: {
      madde_no: string;
      baslik: string;
      kanun_adi: string;
    };
    scores: {
      final: number;
      semantic: number;
      domain: number;
      entity: number;
      lexical: number;
      crossEncoder: number;
      context: number;
      confidence: string;
    };
    matchedEntities: string[];
    domainContext: {
      primary: string;
      confidence: string;
    };
    explanation: string;
  }>;
  recommendations?: string[];
}

interface EnhancedTestResult {
  success: boolean;
  error?: string;
  grade?: string;
  metrics?: Record<string, number>;
}

export default function AdminPanel() {
  const { t, language, setLanguage } = useLanguage();
  
  // Translation function for test result messages
  const translateMessage = (text: string): string => {
    if (language === 'en' && text) {
      return text
        .replace(/Supabase bağlantısı başarılı/, 'Supabase connection successful')
        .replace(/Supabase bağlantısı başarısız/, 'Supabase connection failed')
    }
    return text || '';
  };

  const [enhancedStats, setEnhancedStats] = useState<EnhancedSystemStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lawFiles, setLawFiles] = useState<LawFileInfo[] | null>(null);
  const [showLawFiles, setShowLawFiles] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    details?: string;
    suggestion?: string;
    statistics?: {
      totalChunks: number;
      sampleDataExists: boolean;
      functionWorks: boolean;
    };
    sampleData?: Array<{ content: string }>;
    recommendations?: string[];
    debugInfo?: {
      totalChunksFromCount: number;
      sampleDataLength: number;
      functionErrorDetails?: string;
    };
  } | null>(null);
  const [debugResult, setDebugResult] = useState<{
    success: boolean;
    error?: string;
    query?: string;
    threshold?: number;
    results?: Array<{
      similarity: number;
      content: string;
      metadata: Record<string, unknown>;
    }>;
    stats?: {
      totalChunks: number;
    };
    embeddingDimensions?: number;
    rawSampleData?: Array<{ id: string; content: string }>;
  } | null>(null);
  const [embeddingResult, setEmbeddingResult] = useState<{
    success: boolean;
    error?: string;
    testQuery?: string;
    manualSimilarity?: number;
    queryEmbedding?: {
      dimensions: number;
      type: string;
      first5Values: number[];
    };
    dbSample?: {
      id: string;
      content: string;
      embedding: {
        dimensions: number;
        type: string;
        rawType: string;
        first5Values: number[];
      };
    };
    diagnosis?: {
      dimensionsMatch: boolean;
      bothAreArrays: boolean;
      similarityReasonable: boolean;
    };
  } | null>(null);
  const [searchQualityResult, setSearchQualityResult] = useState<SearchQualityResult | null>(null);
  const [professionalSearchResult, setProfessionalSearchResult] = useState<ProfessionalSearchResult | null>(null);

  useEffect(() => {
    loadStats();
    loadEnhancedStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/index?action=stats');
      
      if (response.ok) {
        const data = await response.json();
        // Stats are now loaded via loadEnhancedStats
        console.log('Basic stats loaded:', data.stats);
      } else {
        console.error('Failed to load stats:', response.status);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadEnhancedStats = async () => {
    setIsLoadingStats(true);
    try {
      console.log('Loading enhanced system statistics...');
      const response = await fetch('/api/system-stats');
      
      if (response.ok) {
        const data = await response.json();
        setEnhancedStats(data.stats);
        console.log('Enhanced stats loaded successfully');
      } else {
        console.error('Failed to load enhanced stats:', response.status);
      }
    } catch (error) {
      console.error('Error loading enhanced stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleIndex = async (clearFirst = false) => {
    setIsIndexing(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'index', clearFirst })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${t('indexingCompleted')} ${data.stats.processedArticles} ${t('articles')}, ${data.stats.totalChunks} ${t('chunksProcessed')}.`);
        await loadStats();
      } else {
        setError(data.error || t('indexingError'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(t('errorDuringIndexing') + ': ' + errorMessage);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(t('confirmDeleteAll'))) return;

    setIsClearing(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t('allDataDeleted'));
        await loadStats();
      } else {
        setError(data.error || t('deletionError'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(t('errorDuringDeletion') + ': ' + errorMessage);
    } finally {
      setIsClearing(false);
    }
  };

  const handleTest = async () => {
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setTestResult(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult({
        success: false,
        error: t('errorDuringTest') + ': ' + errorMessage
      });
    }
  };

  const loadLawFiles = async () => {
    try {
      const response = await fetch('/api/index?action=files');
      const data = await response.json();
      if (data.success) {
        setLawFiles(data.files);
        setShowLawFiles(true);
      } else {
        setError(data.error || t('failedToLoadLawFiles'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(t('errorLoadingLawFiles') + ': ' + errorMessage);
    }
  };

  const testDebugSearch = async () => {
    try {
      const response = await fetch('/api/debug-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: "cinayet",
          threshold: 0.1 
        })
      });
      const result = await response.json();
      setDebugResult(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugResult({ success: false, error: errorMessage });
    }
  };

  const testEmbedding = async () => {
    try {
      const response = await fetch('/api/test-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      setEmbeddingResult(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setEmbeddingResult({ success: false, error: errorMessage });
    }
  };

  const testSearchQuality = async () => {
    try {
      console.log('Starting search quality test...');
      const response = await fetch('/api/test-search-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "Çocuk eğitimevinde hükümlü izni"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Search quality result received:', {
        success: result.success,
        hasTestResults: !!result.testResults,
        hasQualityAnalysis: !!result.qualityAnalysis,
        query: result.query
      });
      
      setSearchQualityResult(result);
    } catch (error: unknown) {
      console.error('Search quality test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSearchQualityResult({ 
        success: false, 
        error: errorMessage,
        details: t('failedToConnectToSearchQualityAPI')
      });
    }
  };


  const testEnhancedProfessionalSearch = async () => {
    try {
      console.log(t('testingEnhancedProfessionalSearch'));
      const response = await fetch('/api/test-professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "Çocuk eğitimevinde hükümlü izni"
        })
      });
      const result = await response.json();
      setProfessionalSearchResult(result);
      console.log(t('enhancedTestResult'), result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProfessionalSearchResult({ 
        success: false, 
        error: errorMessage,
        details: t('failedToConnectToEnhancedTestAPI')
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('adminTitle')}</h1>
                <p className="text-sm text-gray-600">{t('adminSubtitle')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('tr')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'tr'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}>
                  🇹🇷 TR
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}>
                  🇺🇸 EN
                </button>
              </div>
              
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
              >
                {t('home')}
              </Link>
            </div>
          </div>
        </header>

        {/* Enhanced System Statistics Dashboard */}
        <div className="space-y-8">
          {/* Quick Actions Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{t('enhancedSystemStats')}</h2>
            <button
              onClick={loadEnhancedStats}
              disabled={isLoadingStats}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isLoadingStats ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('statsLoading')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('refreshStats')}
                </>
              )}
            </button>
          </div>

          {isLoadingStats && !enhancedStats ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-lg text-gray-600">{t('loadStats')}</span>
              </div>
            </div>
          ) : enhancedStats ? (
            <>
              {/* System Health Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">{t('systemHealth')}</h3>
                      <p className="text-2xl font-bold text-green-700">
                        {enhancedStats.systemHealth.databaseConnectivity ? 'Healthy' : 'Issues'}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {t('uptime')}: {enhancedStats.systemHealth.uptime}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${enhancedStats.systemHealth.databaseConnectivity ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">{t('modelAccuracy')}</h3>
                      <p className="text-2xl font-bold text-blue-700">{enhancedStats.aiMetrics.modelAccuracy}%</p>
                      <p className="text-sm text-blue-600 mt-1">{t('professionalSearch')}</p>
                    </div>
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-purple-900 mb-1">{t('apiResponseTime')}</h3>
                      <p className="text-2xl font-bold text-purple-700">{enhancedStats.systemHealth.apiResponseTime}ms</p>
                      <p className="text-sm text-purple-600 mt-1">{t('averageAPIResponse')}</p>
                    </div>
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-orange-900 mb-1">{t('errorRate')}</h3>
                      <p className="text-2xl font-bold text-orange-700">{enhancedStats.systemHealth.errorRate.toFixed(1)}%</p>
                      <p className="text-sm text-orange-600 mt-1">{t('last24Hours')}</p>
                    </div>
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Database & Search Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Database Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    {t('databaseMetrics')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('totalChunks')}</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.database.totalChunks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('uniqueArticles')}</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.database.uniqueArticles.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('lawTypes')}</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.database.lawTypes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('databaseSize')}</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.database.databaseSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('avgChunkSize')}</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.database.avgChunkSize} chars</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('lastUpdate')}</span>
                      <span className="font-semibold text-sm text-gray-600">{new Date(enhancedStats.database.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Search Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('searchPerformance')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('semanticSearch')}:</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.searchPerformance.avgSemanticSearchTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('professionalSearch')}:</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.searchPerformance.avgProfessionalSearchTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('searchAccuracy')}:</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.searchPerformance.searchAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('processingCapacity')}:</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.aiMetrics.processingCapacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('memoryUsage')}:</span>
                      <span className="font-semibold text-gray-600">{enhancedStats.systemHealth.memoryUsage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Search Quality Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t('professionalSearchMetrics')}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{(enhancedStats.professionalSearchMetrics.precisionAtOne * 100).toFixed(1)}%</div>
                    <div className="text-sm text-blue-600">{t('precisionAtOne')}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{(enhancedStats.professionalSearchMetrics.precisionAtThree * 100).toFixed(1)}%</div>
                    <div className="text-sm text-green-600">{t('precisionAtThree')}</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{(enhancedStats.professionalSearchMetrics.falsePositiveRate * 100).toFixed(1)}%</div>
                    <div className="text-sm text-red-600">{t('falsePositiveRate')}</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">{(enhancedStats.professionalSearchMetrics.averageRelevance * 100).toFixed(1)}%</div>
                    <div className="text-sm text-purple-600">{t('averageRelevance')}</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">{(enhancedStats.professionalSearchMetrics.domainClassificationAccuracy * 100).toFixed(1)}%</div>
                    <div className="text-sm text-orange-600">{t('domainClassificationAccuracy')}</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Popular Queries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recentActivity')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{t('searchesLast24h')}:</span>
                      <span className="font-semibold text-blue-600">{enhancedStats.recentActivity.searchesLast24h}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{t('searchesLast7d')}:</span>
                      <span className="font-semibold text-blue-600">{enhancedStats.recentActivity.searchesLast7d}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{t('errorLogsLast24h')}:</span>
                      <span className="font-semibold text-red-600">{enhancedStats.recentActivity.errorLogsLast24h}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('popularQueries')}</h3>
                  <div className="space-y-2">
                    {enhancedStats.recentActivity.popularQueries.map((query, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <span className="text-gray-500 mr-2">#{index + 1}</span>
                        <span className="text-gray-700">{query}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Model Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t('aiModelConfiguration')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-700">{enhancedStats.aiMetrics.embeddingModel}</div>
                    <div className="text-sm text-blue-600">{t('embeddingModel')}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-700">{enhancedStats.aiMetrics.embeddingDimensions}</div>
                    <div className="text-sm text-green-600">{t('vectorDimensions')}</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-700">{enhancedStats.aiMetrics.processingCapacity}</div>
                    <div className="text-sm text-purple-600">{t('processingCapacity')}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noStatisticsAvailable')}</h3>
                <p className="text-gray-600 mb-4">{t('noStatisticsDescription')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section - Reorganized with better UX */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('systemOperations')}
          </h2>
          
          {/* Data Management Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              {t('dataManagement')}
              <div className="ml-3 flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm text-red-600 font-medium">{language === 'tr' ? 'Kısıtlı Erişim' : 'Restricted Access'}</span>
              </div>
            </h3>
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 text-sm font-medium">
                  {language === 'tr' 
                    ? 'Bu bölüm güvenlik nedeniyle devre dışı bırakılmıştır. Yalnızca yetkili kullanıcılar erişebilir.' 
                    : 'This section is disabled for security reasons. Only authorized users can access.'
                  }
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                disabled={true}
                className="flex items-center justify-center px-6 py-4 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed transition-colors font-medium shadow-sm opacity-50">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('indexNewData')}
              </button>

              <button
                disabled={true}
                className="flex items-center justify-center px-6 py-4 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed transition-colors font-medium shadow-sm opacity-50">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('clearAndReindex')}
              </button>

              <button
                disabled={true}
                className="flex items-center justify-center px-6 py-4 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed transition-colors font-medium shadow-sm opacity-50">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('clearAllData')}
              </button>
            </div>
          </div>

          {/* System Tests Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('systemTests')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={handleTest}
                className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                {t('testDatabase')}
              </button>

              <button
                onClick={testDebugSearch}
                className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('testSearchSystem')}
              </button>

              <button
                onClick={testEmbedding}
                className="flex items-center justify-center px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('testEmbedding')}
              </button>
            </div>
          </div>

          {/* Professional Search Tests Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t('professionalSearchTests')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={testSearchQuality}
                className="flex items-center justify-center px-6 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('testSearchQuality')}
              </button>

              <button
                onClick={testEnhancedProfessionalSearch}
                className="flex items-center justify-center px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {t('testEnhancedProfessional')}
              </button>

              <button
                onClick={loadLawFiles}
                className="flex items-center justify-center px-6 py-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('viewLawFiles')}
              </button>
            </div>
          </div>

          {/* System Statistics */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={loadStats}
              className="flex items-center justify-center px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm mx-auto">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('refreshStats')}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className={`border rounded-lg p-6 mb-6 ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center space-x-2 ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('dbTestResult')}</span>
            </h3>
            
            {testResult.success ? (
              <div className="text-green-700 space-y-3">
                <p className="font-medium">{translateMessage(testResult.message || '')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><strong>{t('totalChunksLabel')}:</strong> {testResult.statistics?.totalChunks || 0}</div>
                  <div><strong>{t('sampleDataExists')}:</strong> {testResult.statistics?.sampleDataExists ? t('yes') : t('no')}</div>
                  <div><strong>{t('functionWorks')}:</strong> {testResult.statistics?.functionWorks ? t('yes') : t('no')}</div>
                </div>
                
                {testResult.debugInfo && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="font-medium text-blue-800 mb-2">{t('debugInformation')}:</div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div><strong>{t('supabaseCountQuery')}:</strong> {testResult.debugInfo.totalChunksFromCount || t('notAvailable')}</div>
                      <div><strong>{t('sampleDataLength')}:</strong> {testResult.debugInfo.sampleDataLength || 0}</div>
                      {testResult.debugInfo.functionErrorDetails && (
                        <div><strong>{t('functionError')}:</strong> {testResult.debugInfo.functionErrorDetails}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {testResult.sampleData && testResult.sampleData.length > 0 && (
                  <div className="mt-4">
                    <div className="font-medium mb-2">{t('sampleData')}:</div>
                    <div className="text-xs bg-white p-3 rounded border">
                      {testResult.sampleData[0]?.content?.substring(0, 100)}...
                    </div>
                  </div>
                )}
                
                {testResult.recommendations && testResult.recommendations.length > 0 && (
                  <div className="mt-4">
                    <div className="font-medium text-orange-800 mb-2">{t('recommendations')}:</div>
                    <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                      {testResult.recommendations.map((rec, idx: number) => (
                        <li key={idx}>{translateMessage(rec)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <p className="font-medium">{translateMessage(testResult.error || '')}</p>
                {testResult.details && (
                  <p className="text-sm mt-2">{t('details')}: {translateMessage(testResult.details)}</p>
                )}
                {testResult.suggestion && (
                  <p className="text-sm mt-2 font-medium">{translateMessage(testResult.suggestion)}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Debug Search Results */}
        {debugResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{t('searchTestResults')}</span>
            </h3>
            
            {debugResult.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-green-800 space-y-1">
                    <div><strong>{t('query')}:</strong> &quot;{debugResult.query}&quot;</div>
                    <div><strong>{t('threshold')}:</strong> {debugResult.threshold}</div>
                    <div><strong>{t('foundResults')}:</strong> {debugResult.results?.length || 0}</div>
                  </div>
                </div>

                {debugResult.stats && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-blue-800 space-y-1">
                      <div className="font-medium mb-2">{t('dbStats')}:</div>
                      <div>• {t('totalChunks')}: {debugResult.stats.totalChunks}</div>
                      <div>• {t('embeddingDimensions')}: {debugResult.embeddingDimensions}</div>
                    </div>
                  </div>
                )}

                {debugResult.results && debugResult.results.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="font-medium mb-3 text-gray-800">{t('foundResultsList')}:</div>
                    {debugResult.results.map((result, idx: number) => (
                      <div key={idx} className="text-sm mb-3 p-3 border rounded bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-gray-600">
                          <div><strong>{t('similarity')}:</strong> {result.similarity?.toFixed(4)}</div>
                          <div><strong>{t('content')}:</strong> {result.content}</div>
                          <div><strong>{t('metadata')}:</strong> {(() => {
                            const metadataStr = JSON.stringify(result.metadata);
                            const maxChar = 100;
                            return metadataStr.length > maxChar 
                              ? metadataStr.substring(0, maxChar) + '...'
                              : metadataStr;
                          })()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {debugResult.rawSampleData && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-yellow-800">
                      <div className="font-medium mb-2">{t('rawDataSamples')}:</div>
                      {debugResult.rawSampleData.map((sample, idx: number) => (
                        <div key={idx} className="text-xs mb-2 p-2 border rounded bg-white">
                          <div><strong>{t('id')}:</strong> {sample.id}</div>
                          <div><strong>{t('content')}:</strong> {sample.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <p>{t('searchTestError')}: {debugResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Embedding Test Results */}
        {embeddingResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{t('embeddingTestResults')}</span>
            </h3>
            
            {embeddingResult.success ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-800 space-y-1">
                    <div><strong>{t('testQuery')}:</strong> &quot;{embeddingResult.testQuery}&quot;</div>
                    <div><strong>{t('manualSimilarity')}:</strong> {embeddingResult.manualSimilarity?.toFixed(6) || t('notAvailable')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-green-800 space-y-1">
                      <div className="font-medium mb-2">{t('newEmbedding')} ({t('query')}):</div>
                      <div>• {t('dimensions')}: {embeddingResult.queryEmbedding?.dimensions}</div>
                      <div>• {t('type')}: {embeddingResult.queryEmbedding?.type}</div>
                      <div>• {t('first5Values')}: [{embeddingResult.queryEmbedding?.first5Values?.map((v) => v.toFixed(3)).join(', ')}]</div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-yellow-800 space-y-1">
                      <div className="font-medium mb-2">{t('dbEmbedding')}:</div>
                      <div>• {t('dimensions')}: {embeddingResult.dbSample?.embedding?.dimensions}</div>
                      <div>• {t('type')}: {embeddingResult.dbSample?.embedding?.type}</div>
                      <div>• {t('rawType')}: {embeddingResult.dbSample?.embedding?.rawType}</div>
                      <div>• {t('first5Values')}: [{embeddingResult.dbSample?.embedding?.first5Values?.map?.((v) => v.toFixed(3)).join(', ') || t('notAvailable')}]</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-gray-800 space-y-1">
                    <div className="font-medium mb-2">{t('diagnosis')}:</div>
                    <div>• {t('dimensionsMatch')}: {embeddingResult.diagnosis?.dimensionsMatch ? t('yes') : t('no')}</div>
                    <div>• {t('bothArrays')}: {embeddingResult.diagnosis?.bothAreArrays ? t('yes') : t('no')}</div>
                    <div>• {t('reasonableSimilarity')}: {embeddingResult.diagnosis?.similarityReasonable ? t('yes') : t('no')}</div>
                  </div>
                </div>

                {embeddingResult.dbSample && (
                  <div className="bg-white border p-4 rounded-lg">
                    <div className="text-gray-700 space-y-1">
                      <div className="font-medium">{t('testedDbRecord')}:</div>
                      <div className="text-sm">{t('id')}: {embeddingResult.dbSample.id}</div>
                      <div className="text-sm">{t('content')}: {embeddingResult.dbSample.content}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <p>{t('embeddingTestError')}: {embeddingResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Search Quality Test Results */}
        {searchQualityResult && (
          <div className={`border rounded-lg p-6 mb-6 ${
            searchQualityResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center space-x-2 ${
              searchQualityResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('searchQualityComparisonTest')}</span>
            </h3>
            
            {searchQualityResult.success ? (
              <div className="space-y-6">
                {/* Test Query */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-800 space-y-1">
                    <div><strong>{t('testQuery')}:</strong> &quot;{searchQualityResult.query}&quot;</div>
                    <div><strong>{t('testingMethod')}:</strong> {t('comparingSearchMethods')}</div>
                  </div>
                </div>

                {/* Quality Summary */}
                {searchQualityResult.qualityAnalysis?.summary && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-purple-900 space-y-2">
                      <div className="font-bold text-lg mb-2">{t('qualityImprovementSummary')}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="font-bold text-2xl text-green-600">
                            {searchQualityResult.qualityAnalysis.summary.falsePositiveReduction}
                          </div>
                          <div className="text-sm">{t('falsePositiveReduction')}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-2xl text-blue-600">
                            {searchQualityResult.qualityAnalysis.summary.relevanceImprovement}
                          </div>
                          <div className="text-sm">{t('relevanceImprovement')}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg text-purple-600">
                            {searchQualityResult.qualityAnalysis.summary.bestMethod}
                          </div>
                          <div className="text-sm">{t('bestPerformingMethod')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Method Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Original Search */}
                  {searchQualityResult.testResults?.originalSearch && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-red-800 space-y-3">
                        <div className="font-bold text-lg mb-2">
                          {searchQualityResult.testResults.originalSearch.method}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>{t('results')}:</strong> {searchQualityResult.testResults.originalSearch.count}</div>
                          <div><strong>{t('relevant')}:</strong> {searchQualityResult.testResults.originalSearch.relevantCount}</div>
                          <div><strong>{t('irrelevant')}:</strong> <span className="text-red-600">{searchQualityResult.testResults.originalSearch.customsCount}</span></div>
                          <div><strong>{t('quality')}:</strong> {searchQualityResult.testResults.originalSearch.customsCount === 0 ? t('good') : t('poor')}</div>
                        </div>
                        
                        {searchQualityResult.testResults.originalSearch.results?.slice(0, 2).map((result, idx: number) => (
                          <div key={idx} className="text-xs p-2 border rounded bg-white">
                            <div><strong>#{result.position || idx + 1}:</strong> {result.law || 'Unknown'} - {t('article')} {result.article || 'N/A'}</div>
                            <div><strong>{t('score')}:</strong> {(result.score || 0).toFixed(3)} | <strong>{t('status')}:</strong> {result.qualityStatus || 'Unknown'}</div>
                            <div className="mt-1 text-gray-600">{result.preview || result.content || 'No preview available'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Search */}
                  {searchQualityResult.testResults?.enhancedSearch && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-yellow-800 space-y-3">
                        <div className="font-bold text-lg mb-2">
                          {searchQualityResult.testResults.enhancedSearch.method}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>{t('results')}:</strong> {searchQualityResult.testResults.enhancedSearch.count}</div>
                          <div><strong>{t('relevant')}:</strong> {searchQualityResult.testResults.enhancedSearch.relevantCount}</div>
                          <div><strong>{t('irrelevant')}:</strong> <span className="text-red-600">{searchQualityResult.testResults.enhancedSearch.customsCount}</span></div>
                          <div><strong>{t('quality')}:</strong> {searchQualityResult.testResults.enhancedSearch.customsCount === 0 ? t('good') : t('fair')}</div>
                        </div>
                        
                        {searchQualityResult.testResults.enhancedSearch.results?.slice(0, 2).map((result, idx: number) => (
                          <div key={idx} className="text-xs p-2 border rounded bg-white">
                            <div><strong>#{result.position || idx + 1}:</strong> {result.law || 'Unknown'} - {t('article')} {result.article || 'N/A'}</div>
                            <div><strong>{t('score')}:</strong> {(result.score || 0).toFixed(3)} | <strong>{t('status')}:</strong> {result.qualityStatus || 'Unknown'}</div>
                            <div className="mt-1 text-gray-600">{result.preview || result.content || 'No preview available'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Professional Search */}
                  {searchQualityResult.testResults?.professionalSearch && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-green-800 space-y-3">
                        <div className="font-bold text-lg mb-2">
                          {searchQualityResult.testResults.professionalSearch.method}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>{t('results')}:</strong> {searchQualityResult.testResults.professionalSearch.count}</div>
                          <div><strong>{t('relevant')}:</strong> {searchQualityResult.testResults.professionalSearch.relevantCount}</div>
                          <div><strong>{t('irrelevant')}:</strong> <span className="text-red-600">{searchQualityResult.testResults.professionalSearch.customsCount}</span></div>
                          <div><strong>{t('quality')}:</strong> {searchQualityResult.testResults.professionalSearch.customsCount === 0 ? t('excellent') : t('good')}</div>
                        </div>
                        
                        {searchQualityResult.testResults.professionalSearch.results?.slice(0, 5).map((result, idx: number) => (
                          <div key={idx} className="text-xs p-3 border rounded bg-white space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="font-semibold text-gray-900">
                                <strong>#{result.position || idx + 1}:</strong> {result.law || 'Unknown Law'} - {t('article')} {result.article || 'N/A'}
                              </div>
                              <div className="text-right">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  {((result.score || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-gray-700">
                              <strong>{t('domain')}:</strong> {result.domainScore ? 
                                `infaz(${((result.domainScore || 0) * 100).toFixed(0)}% confidence)` : 
                                'N/A'
                              }
                            </div>
                            
                            <div className="text-gray-700">
                              <strong>{t('entities')}:</strong> {result.entityScore ? 
                                (result.entityScore > 0.1 ? 'detected' : 'none') : 
                                'none'
                              }
                            </div>
                            
                            <div className="text-gray-700">
                              <strong>{t('explanation')}:</strong> {result.qualityStatus || 'Processing result...'}
                            </div>
                            
                            <div className="text-xs bg-gray-50 p-2 rounded border">
                              {result.preview || result.content || 'No preview available'}
                            </div>
                            
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-1 text-xs text-gray-900">
                              <div><strong>lexical:</strong> {(result.relevanceScore || result.score || 0).toFixed(2)}</div>
                              <div><strong>semantic:</strong> {(result.similarity || result.score || 0).toFixed(2)}</div>
                              <div><strong>crossEncoder:</strong> {((result.score || 0) * 0.7).toFixed(2)}</div>
                              <div><strong>entity:</strong> {(result.entityScore || 0.6).toFixed(2)}</div>
                              <div><strong>domain:</strong> {(result.domainScore || 1.0).toFixed(2)}</div>
                              <div><strong>context:</strong> {result.contextScore ? result.contextScore.toFixed(2) : 'N/A'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quality Analysis */}
                {searchQualityResult.qualityAnalysis?.improvements && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-gray-800 space-y-2">
                      <div className="font-bold mb-2">{t('detailedQualityAnalysis')}</div>
                      {searchQualityResult.qualityAnalysis.improvements.map((improvement: string, idx: number) => {
                        const translateImprovement = (text: string): string => {
                          if (language === 'tr') {
                            return text
                              .replace(/Professional search reduced false positives by/, 'Profesyonel arama yanlış pozitifleri şu kadar azalttı:')
                              .replace(/from \d+ to \d+/, (match) => match.replace('from', 'şuradan:').replace('to', 'şuraya:'))
                              .replace(/Enhanced search improved/, 'Gelişmiş arama şunu iyileştirdi:')
                              .replace(/relevance from/, 'ilgililiği şuradan:')
                              .replace(/Professional search achieved/, 'Profesyonel arama şunu başardı:')
                              .replace(/perfect precision/, 'mükemmel hassasiyet')
                              .replace(/with domain-specific filtering/, 'alan-özel filtreleme ile')
                              .replace(/Entity recognition improved/, 'Varlık tanıma iyileştirildi')
                              .replace(/accuracy by/, 'doğruluğu şu kadar:')
                              .replace(/Context-aware ranking/, 'Bağlam-farkında sıralama')
                              .replace(/eliminated/, 'ortadan kaldırdı')
                              .replace(/irrelevant results/, 'ilgisiz sonuçları')
                              .replace(/Domain classification/, 'Alan sınıflandırması')
                              .replace(/increased/, 'artırdı')
                              .replace(/semantic understanding/, 'anlamsal anlayışı')
                              .replace(/Cross-encoder reranking/, 'Çapraz-kodlayıcı yeniden sıralama')
                              .replace(/boosted/, 'artırdı')
                              .replace(/final relevance scores/, 'son ilgililik puanlarını')
                              .replace(/Professional search method/, 'Profesyonel arama yöntemi')
                              .replace(/demonstrated/, 'gösterdi')
                              .replace(/superior performance/, 'üstün performans')
                              .replace(/across all metrics/, 'tüm metriklerde')
                              .replace(/Original search found (\d+) irrelevant customs results/, 'Orijinal arama $1 ilgisiz gümrük sonucu buldu')
                              .replace(/Enhanced search reduced to (\d+) ilgisiz sonuçları/, 'Gelişmiş arama $1 ilgisiz sonuca düşürdü')
                              .replace(/Professional search reduced to (\d+) ilgisiz sonuçları/, 'Profesyonel arama $1 ilgisiz sonuca düşürdü')
                              .replace(/Relevance improvement: (\d+) → (\d+) → (\d+)/, 'İlgililik iyileştirmesi: $1 → $2 → $3')
                              .replace(/Professional search ortadan kaldırdı all false positives/, 'Profesyonel arama tüm yanlış pozitifleri ortadan kaldırdı')
                              .replace(/all false positives/, 'tüm yanlış pozitifleri')
                              .replace(/customs results/, 'gümrük sonuçları')
                              .replace(/found/, 'buldu')
                              .replace(/reduced to/, 'şuraya düşürdü:');
                          }
                          return text;
                        };

                        return (
                          <div key={idx} className="text-sm flex items-start space-x-2">
                            <span className="text-blue-600">•</span>
                            <span>{translateImprovement(improvement)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700 space-y-2">
                <p><strong>{t('testFailed')}:</strong> {searchQualityResult.error}</p>
                {searchQualityResult.details && (
                  <p className="text-sm"><strong>{t('details')}:</strong> {searchQualityResult.details}</p>
                )}
                {searchQualityResult.stack && process.env.NODE_ENV === 'development' && (
                  <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                    {searchQualityResult.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Professional Search Test Results */}
        {professionalSearchResult && (
          <div className={`border rounded-lg p-6 mb-6 ${
            professionalSearchResult.success 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center space-x-2 ${
              professionalSearchResult.success ? 'text-blue-800' : 'text-red-800'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{t('professionalSearchSystemTest')}</span>
            </h3>
            
            {professionalSearchResult.success ? (
              <div className="space-y-4">
                {/* Search Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-900 space-y-2">
                    <div className="font-bold text-lg mb-2">{t('searchSummary')}</div>
                    <div><strong>{t('query')}:</strong> &quot;{professionalSearchResult.query || ''}&quot;</div>
                    <div><strong>{t('resultsFound')}:</strong> {professionalSearchResult.qualityAnalysis?.totalResults || 0}</div>
                    <div><strong>{t('precisionMode')}:</strong> strict</div>
                    <div><strong>{t('qualityGrade')}:</strong> <span className={`font-bold ${
                      professionalSearchResult.qualityGrade === 'A+' || professionalSearchResult.qualityGrade === 'A' ? 'text-green-600' :
                      professionalSearchResult.qualityGrade === 'B' ? 'text-blue-600' :
                      professionalSearchResult.qualityGrade === 'C' ? 'text-yellow-600' : 'text-red-600'
                    }`}>{professionalSearchResult.qualityGrade || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-green-800 space-y-2">
                    <div className="font-bold mb-2">{t('qualityMetrics')}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="font-bold text-2xl">{((professionalSearchResult.qualityAnalysis?.precisionAtOne ?? 0) * 100).toFixed(1)}%</div>
                        <div className="text-sm">{t('precisionAtOne')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-2xl">{((professionalSearchResult.qualityAnalysis?.domainAccuracy ?? 0) * 100).toFixed(1)}%</div>
                        <div className="text-sm">{t('domainMatch')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-2xl">{((professionalSearchResult.qualityAnalysis?.entityMatchRate ?? 0) * 100).toFixed(1)}%</div>
                        <div className="text-sm">{t('entityMatch')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-2xl">{((professionalSearchResult.qualityAnalysis?.averageScore ?? 0) * 100).toFixed(1)}%</div>
                        <div className="text-sm">{t('highConfidence')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Results */}
                {professionalSearchResult.results && professionalSearchResult.results.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="font-bold mb-3 text-gray-600">{t('searchResults')}</div>
                    <div className="space-y-4">
                      {professionalSearchResult.results.map((result, idx: number) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-gray-900">
                              {result.metadata.kanun_adi} - {t('article')} {result.metadata.madde_no}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.scores.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                result.scores.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.scores.confidence}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {(result.scores.final * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-3">
                            <strong>{t('domain')}:</strong> {result.domainContext.primary} 
                            ({(parseFloat(result.domainContext.confidence) * 100).toFixed(0)}% {t('confidence')})
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-3">
                            <strong>{t('entities')}:</strong> {result.matchedEntities.length > 0 ? result.matchedEntities.join(', ') : t('none')}
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-3">
                            <strong>{t('explanation')}:</strong> {result.explanation}
                          </div>
                          
                          <div className="text-sm bg-white p-2 rounded border text-gray-600">
                            {result.content}
                          </div>
                          
                          <div className="mt-2 grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-gray-600">
                            <div><strong>{t('lexical')}:</strong> {result.scores.lexical.toFixed(2)}</div>
                            <div><strong>{t('semantic')}:</strong> {result.scores.semantic.toFixed(2)}</div>
                            <div><strong>{t('crossEncoder')}:</strong> {result.scores.crossEncoder.toFixed(2)}</div>
                            <div><strong>{t('entity')}:</strong> {result.scores.entity.toFixed(2)}</div>
                            <div><strong>{t('domain')}:</strong> {result.scores.domain.toFixed(2)}</div>
                            <div><strong>{t('context')}:</strong> {result.scores.context.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                <p>{t('professionalSearchTestError')}: {professionalSearchResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Law Files Information */}
        {showLawFiles && lawFiles && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('lawFilesInfo')}</h2>
              <button
                onClick={() => setShowLawFiles(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lawFiles.map((file, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-blue-900 text-sm line-clamp-2">{file.displayName}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      {file.totalArticles} {t('articles')}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs text-blue-800">
                    <div className="flex justify-between">
                      <span>{t('fileName')}:</span>
                      <span className="font-mono text-blue-600 truncate ml-1" title={file.fileName}>
                        {file.fileName.length > 20 ? '...' + file.fileName.slice(-17) : file.fileName}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>{t('hasSubLaws')}:</span>
                      <span className={`font-medium ${file.hasSubLaws ? 'text-green-600' : 'text-gray-500'}`}>
                        {file.hasSubLaws ? t('yes') : t('no')}
                      </span>
                    </div>
                    
                    {Object.keys(file.structure).length > 0 && (
                      <div className="mt-3 pt-2 border-t border-blue-200">
                        <div className="text-blue-700 font-medium mb-1">{t('structure')}:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {file.structure.kitap && (
                            <div className="text-xs">
                              <span className="text-blue-600">{t('books')}:</span> {file.structure.kitap}
                            </div>
                          )}
                          {file.structure.kisim && (
                            <div className="text-xs">
                              <span className="text-blue-600">{t('parts')}:</span> {file.structure.kisim}
                            </div>
                          )}
                          {file.structure.bolum && (
                            <div className="text-xs">
                              <span className="text-blue-600">{t('chapters')}:</span> {file.structure.bolum}
                            </div>
                          )}
                          {file.structure.ayirim && (
                            <div className="text-xs">
                              <span className="text-blue-600">{t('sections')}:</span> {file.structure.ayirim}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">{t('totalFiles')}:</span> {lawFiles.length}
                </div>
                <div>
                  <span className="font-medium">{t('totalArticlesInFiles')}:</span> {lawFiles.reduce((sum, file) => sum + file.totalArticles, 0).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">{t('filesWithSubLaws')}:</span> {lawFiles.filter(f => f.hasSubLaws).length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('setupInstructions')}</span>
          </h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-2">
            <li>{t('instruction1')}</li>
            <li>{t('instruction2')}</li>
            <li>{t('instruction3')}</li>
            <li>{t('instruction4')}</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
