// TR: AI YANITLARI VE ARAMA SONUÇLARI GÖRÜNTÜLEME COMPONENTİ
// EN: OUTPUT COMPONENT FOR DISPLAYING AI RESPONSES AND SEARCH RESULTS
"use client";

import { useLanguage } from "@/i18n/LanguageProvider";

interface SearchResult {
  id: string;
  content: string;
  metadata: {
    madde_no: string;
    baslik: string;
    kanun_adi: string;
    chunk_index: number;
    total_chunks: number;
    merged_chunks?: number;
    chunk_indices?: number[];
    is_merged?: boolean;
    paragraflar?: Array<{ no: string; icerik: string }>;
    icerik?: string;
  };
  similarity: number;
}

interface OutputBoxProps {
  content: string;
  searchResults?: SearchResult[];
  context?: string;
  translationInfo?: { wasTranslated: boolean; searchQuery?: string } | null;
  originalQuery?: string;
}

export default function OutputBox({ content, searchResults, context, translationInfo, originalQuery }: OutputBoxProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Main Response */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">{t('aiAnalysis')}</h3>
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {content || "No analysis performed yet."}
        </div>
      </div>

      {/* Context Information */}
      {context && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-blue-900">{t('usedContext')}</span>
          </div>
          <p className="text-sm text-blue-800">{context}</p>
        </div>
      )}

      {/* Translation Information */}
      {translationInfo?.wasTranslated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="font-medium text-green-900">{t('translationInfo')}</span>
          </div>
          {translationInfo.searchQuery && (
            <p className="text-sm text-green-800">
              <span className="font-medium">{t('translatedQuery')}:</span> {translationInfo.searchQuery}
            </p>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {t('relevantLaws')} ({searchResults.length})
          </h3>

          <div className="space-y-4">
            {searchResults.map((result) => {
              const getColorScheme = (kanunAdi: string) => {
                if (kanunAdi.includes('Türk Ceza Kanunu')) {
                  return {
                    border: 'border-red-200',
                    bg: 'bg-red-50',
                    title: 'text-red-900',
                    subtitle: 'text-red-700',
                    content: 'text-red-800',
                    badge: 'bg-red-500'
                  };
                } else if (kanunAdi.includes('Borçlar') || kanunAdi.includes('Borç')) {
                  return {
                    border: 'border-blue-200',
                    bg: 'bg-blue-50',
                    title: 'text-blue-900',
                    subtitle: 'text-blue-700',
                    content: 'text-blue-800',
                    badge: 'bg-blue-500'
                  };
                } else if (kanunAdi.includes('Tüketici')) {
                  return {
                    border: 'border-green-200',
                    bg: 'bg-green-50',
                    title: 'text-green-900',
                    subtitle: 'text-green-700',
                    content: 'text-green-800',
                    badge: 'bg-green-500'
                  };
                } else if (kanunAdi.includes('Medeni')) {
                  return {
                    border: 'border-purple-200',
                    bg: 'bg-purple-50',
                    title: 'text-purple-900',
                    subtitle: 'text-purple-700',
                    content: 'text-purple-800',
                    badge: 'bg-purple-500'
                  };
                } else {
                  return {
                    border: 'border-gray-200',
                    bg: 'bg-gray-50',
                    title: 'text-gray-900',
                    subtitle: 'text-gray-700',
                    content: 'text-gray-800',
                    badge: 'bg-gray-500'
                  };
                }
              };

              const colors = getColorScheme(result.metadata.kanun_adi);

              return (
                <div
                  key={result.id}
                  className={`bg-white border ${colors.border} rounded-lg shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className={`font-semibold ${colors.title} text-sm mb-1`}>
                          {result.metadata.kanun_adi}
                        </div>
                        <div className={`text-xs ${colors.subtitle} flex items-center gap-2 flex-wrap`}>
                          <span className="font-medium">
                            {t('article')} {result.metadata.madde_no}
                          </span>
                          {result.metadata.is_merged ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              {result.metadata.merged_chunks} {t('mergedSections')}
                            </span>
                          ) : result.metadata.total_chunks > 1 && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {t('section')} {result.metadata.chunk_index + 1}/{result.metadata.total_chunks}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className={`px-3 py-1 rounded-full text-white text-xs font-medium ${result.similarity > 0.8 ? 'bg-emerald-500' :
                            result.similarity > 0.7 ? colors.badge :
                              result.similarity > 0.6 ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}
                        >
                          {(result.similarity * 100).toFixed(0)}% {t('similarity')}
                        </span>
                      </div>
                    </div>

                    <div className={`text-sm ${colors.content} leading-relaxed p-3 bg-gray-50 rounded border-l-4 ${colors.border.replace('border-', 'border-l-')}`}>
                      {result.metadata.is_merged && (
                        <div className="mb-3 text-xs text-gray-600 font-medium flex items-center gap-1 p-2 bg-blue-50 rounded border border-blue-200">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('completeArticle')}
                        </div>
                      )}
                      <div className="text-justify">
                        {result.content}
                      </div>

                      {/* Complete Article Structure */}
                      {result.metadata.paragraflar && result.metadata.paragraflar.length > 0 && (
                        <div className="mt-4 p-3 bg-white rounded border border-gray-300">
                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t('completeArticleStructure')}
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="font-medium">{t('articleLabel')}:</span> {result.metadata.madde_no}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">{t('titleLabel')}:</span> {result.metadata.baslik}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">{t('contentLabel')}:</span> {result.metadata.icerik}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">{t('paragraphsLabel')}:</span>
                              <div className="ml-4 mt-1 space-y-1">
                                {result.metadata.paragraflar.map((para, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium">#{para.no}:</span> {para.icerik}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">{t('lawLabel')}:</span> {result.metadata.kanun_adi}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Prompt Display */}
      {originalQuery && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="font-medium text-gray-900">{t('aiPromptTitle')}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
            {`Sen Türk hukuk sistemine hâkim bir hukuk uzmanısın. Kullanıcının sorusunu aşağıdaki bağlamda yanıtla:

  ${t('userQuestion')}: ${originalQuery}
  ${translationInfo?.wasTranslated ? `(${t('searchTranslation')}: ${translationInfo.searchQuery})` : ''}

  ${searchResults && searchResults.length > 0 ? `
  ${t('relevantLegalRegulations')}:
  ${searchResults.map((result, index) => {
              let fullArticleContent = result.content;

              if (result.metadata.paragraflar && result.metadata.paragraflar.length > 0) {
                const paragraphsText = result.metadata.paragraflar
                  .map(para => `Paragraf ${para.no}: ${para.icerik}`)
                  .join('\n');
                fullArticleContent = `${result.metadata.baslik}
              ${result.metadata.icerik}
              Paragraflar: ${paragraphsText}`;
              }

              return ` ${index + 1}. ${result.metadata.kanun_adi} - ${t('article')} ${result.metadata.madde_no}: ${fullArticleContent} (${t('similarity')}: ${(result.similarity * 100).toFixed(1)}%)`;
            }).join('\n')}` : t('noRelevantArticles')}
${t('aiInstructions')}

${t('response')}:`}
          </div>
        </div>
      )}
    </div>
  );
}
