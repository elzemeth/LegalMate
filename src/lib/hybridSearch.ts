// TR: KELIME TABANLI (BM25), SEMANTİK (VEKTÖR) VE CROSS-ENCODER YENIDEN SIRALAMASINI BİRLEŞTİREN HİBRİT ARAMA
// EN: COMBINES LEXICAL (BM25), SEMANTIC (VECTOR), AND CROSS-ENCODER RE-RANKING

import { embeddingService } from './embedding';
import { searchService, SearchResult } from './search';
import { lexicalSearchService, LexicalSearchResult } from './lexicalSearch';
import { crossEncoderService, ReRankingResult } from './crossEncoder';

export interface HybridSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  lexicalScore: number;
  semanticScore: number;
  reRankScore: number;
  finalScore: number;
  matchedKeywords: string[];
  relevanceExplanation: string;
}

export interface HybridSearchOptions {
  limit?: number;
  lexicalWeight?: number;
  semanticWeight?: number;
  reRankWeight?: number;
  minThreshold?: number;
  enableDomainFilter?: boolean;
}

export class HybridSearchService {

  /**
  * TR: BİRDEN FAZLA YAKLAŞIMI BİRLEŞTİREN HİBRİT ARAMA
  * EN: PERFORM HYBRID SEARCH COMBINING MULTIPLE APPROACHES
  */
  async hybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<HybridSearchResult[]> {
    const {
      limit = 10,
      lexicalWeight = 0.3,
      semanticWeight = 0.4,
      reRankWeight = 0.3,
      minThreshold = 0.6,
      enableDomainFilter = true
    } = options;

    try {
      console.log(`Starting hybrid search for: "${query}"`);

      // STEP 1: LEXICAL SEARCH (BM25-LIKE)
      // ADIM 1: LEXICAL ARAMA (BM25 BENZERİ)
      const lexicalResults = await lexicalSearchService.lexicalSearch(query, 50);
      console.log(`Found ${lexicalResults.length} lexical matches`);

      // STEP 2: SEMANTIC SEARCH
      // ADIM 2: SEMANTİK ARAMA
      const queryEmbedding = await embeddingService.embedQuery(query);
      const semanticResults = await searchService.similaritySearch(queryEmbedding, 50, 0.3);
      console.log(`Found ${semanticResults.length} semantic matches`);

      // STEP 3: MERGE RESULTS
      // ADIM 3: SONUÇLARI BİRLEŞTİRME
      const mergedResults = this.mergeResults(lexicalResults, semanticResults);
      console.log(`Merged to ${mergedResults.length} unique results`);

      // STEP 4: APPLY DOMAIN FILTERING
      // ADIM 4: DOMAIN FILTRELEMEYI UYGULAMA
      let filteredResults = mergedResults;
      if (enableDomainFilter) {
        console.log('Phase 4: Domain filtering...');
        filteredResults = this.applyDomainFiltering(query, mergedResults);
        console.log(`Filtered to ${filteredResults.length} domain-relevant results`);
      }

      // TR: ADIM 5: CROSS-ENCODER YENIDEN SIRALAMAYI YAPMA
      // EN: STEP 5: APPLY CROSS-ENCODER RE-RANKING
      console.log('Phase 5: Cross-encoder re-ranking...');
      const reRankedResults = await crossEncoderService.reRankResults(
        query,
        filteredResults,
        { threshold: 0.2, maxResults: limit * 2 }
      );
      console.log(`Re-ranked to ${reRankedResults.length} relevant results`);

      // TR: ADIM 6: FİNAL HİBRİT SKORLARINI HESAPLA
      // EN: STEP 6: CALCULATE FINAL HYBRID SCORES
      console.log('Phase 6: Final scoring...');
      const hybridResults = this.calculateHybridScores(
        reRankedResults,
        lexicalWeight,
        semanticWeight,
        reRankWeight,
        query
      );

      // TR: ADIM 7: FİNAL FİLTRELEME VE SIRALAMA
      // EN: STEP 7: FINAL FILTERING AND SORTING
      const finalResults = hybridResults
        .filter(result => result.finalScore >= minThreshold)
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);

      console.log(`Final: ${finalResults.length} high-quality results`);
      return finalResults;

    } catch (error) {
      console.error('Hybrid search error:', error);
      throw error;
    }
  }

  /**
   * TR: KELİME TABANLI VE SEMANTİK ARAMA SONUÇLARINI BİRLEŞTİRME
   * EN: MERGE LEXICAL AND SEMANTIC SEARCH RESULTS
   */
  private mergeResults(
    lexicalResults: LexicalSearchResult[],
    semanticResults: SearchResult[]
  ): Array<SearchResult & { lexicalScore: number; semanticScore: number }> {
    const resultMap = new Map();

    // TR: LEXİCAL SONUÇLARI EKLEME
    // EN: ADD LEXICAL RESULTS
    lexicalResults.forEach(result => {
      resultMap.set(result.id, {
        ...result,
        lexicalScore: result.bm25Score,
        semanticScore: 0,
        type: 'lexical'
      });
    });

    // TR: SEMANTİK SONUÇLARI EKLE VEYA BİRLEŞTİRME
    // EN: ADD OR MERGE SEMANTIC RESULTS
    semanticResults.forEach(result => {
      if (resultMap.has(result.id)) {
        // TR: MEVCUT LEXİCAL SONUÇLA BİRLEŞTİRME
        // EN: MERGE WITH EXISTING LEXICAL RESULT
        const existing = resultMap.get(result.id);
        existing.semanticScore = result.similarity;
        existing.type = 'both';
      } else {
        // TR: SADECE SEMANTİK SONUÇ OLARAK EKLEME
        // EN: ADD AS SEMANTIC-ONLY RESULT
        resultMap.set(result.id, {
          ...result,
          lexicalScore: 0,
          semanticScore: result.similarity,
          keywordMatches: [],
          type: 'semantic'
        });
      }
    });

    return Array.from(resultMap.values());
  }

  /**
   * TR: İLGİSİZ SONUÇLARI KALDIRMAK İÇİN ALAN TABANLI FİLTRELEME UYGULAMA
   * EN: APPLY DOMAIN-BASED FILTERING TO REMOVE IRRELEVANT RESULTS
   */
  private applyDomainFiltering(query: string, results: Array<SearchResult & { lexicalScore: number; semanticScore: number }>): Array<SearchResult & { lexicalScore: number; semanticScore: number }> {
    const queryDomain = this.detectQueryDomain(query);

    if (!queryDomain) {
      // TR: BELİRLİ BİR ALAN TESPİT EDİLMEDİ, HEPSİNİ DÖNDÜR 
      // EN: NO SPECIFIC DOMAIN DETECTED, RETURN ALL
      return results;
    }

    console.log(`Detected query domain: ${queryDomain}`);

    return results.filter(result => {
      const resultDomain = this.detectResultDomain(result);

      // TR: SONUÇ ALANI SORGU ALANIYLA EŞLEŞİYORSA, SAKLA
      // EN: IF RESULT DOMAIN MATCHES QUERY DOMAIN, KEEP IT
      if (resultDomain === queryDomain) {
        return true;
      }

      // TR: İLİŞKİLİ ALANLAR İÇİN KONTROL ETME
      // EN: CHECK FOR RELATED DOMAINS
      if (this.areDomainsRelated(queryDomain, resultDomain)) {
        return true;
      }

      // TR: SPESİFİK FİLTRELEME KURALLARINI UYGULAMA
      // EN: APPLY SPECIFIC FILTERING RULES
      return this.passesSpecificFilters(query, result);
    });
  }

  /**
   * TR: SORGUDAN HUKUKİ ALANI TESPİT ETME
   * EN: DETECT LEGAL DOMAIN FROM QUERY
   */
  private detectQueryDomain(query: string): string | null {
    const queryLower = query.toLowerCase();

    // TR: İNFAZ/İCRA HUKUKU GÖSTERGELERİ
    // EN: INFAZ/EXECUTION LAW INDICATORS
    if (queryLower.includes('hükümlü') || queryLower.includes('eğitimevi') ||
      queryLower.includes('mahkum') || queryLower.includes('cezaevi') ||
      queryLower.includes('denetimli serbestlik') || queryLower.includes('infaz')) {
      return 'infaz';
    }

    // TR: CEZA HUKUKU GÖSTERGELERİ
    // EN: CRIMINAL LAW INDICATORS
    if (queryLower.includes('suç') || queryLower.includes('ceza') ||
      queryLower.includes('mahkumiyet')) {
      return 'ceza';
    }

    // TR: İŞ HUKUKU GÖSTERGELERİ
    // EN: LABOR LAW INDICATORS
    if (queryLower.includes('işçi') || queryLower.includes('iş sözleşmesi') ||
      queryLower.includes('çalışma') || queryLower.includes('ücret')) {
      return 'is';
    }

    // TR: GÜMRÜK HUKUKU GÖSTERGELERİ
    // EN: CUSTOMS LAW INDICATORS
    if (queryLower.includes('gümrük') || queryLower.includes('ithalat') ||
      queryLower.includes('ihracat')) {
      return 'gumruk';
    }

    return null;
  }

  /**
  * TR: SONUÇTAN HUKUKİ ALANI TESPİT ET
  * EN: DETECT LEGAL DOMAIN FROM RESULT
  */
  private detectResultDomain(result: SearchResult & { lexicalScore: number; semanticScore: number }): string | null {
    const content = result.content.toLowerCase();
    const kanunAdi = result.metadata?.kanun_adi?.toLowerCase() || '';

    // TR: ÖNCE KANUN ADINI KONTROL ET
    // EN: CHECK LAW NAME FIRST
    if (kanunAdi.includes('ceza')) return 'ceza';
    if (kanunAdi.includes('medeni')) return 'medeni';
    if (kanunAdi.includes('iş')) return 'is';
    if (kanunAdi.includes('gümrük')) return 'gumruk';

    // TR: İÇERİĞİ KONTROL ET
    // EN: CHECK CONTENT
    if (content.includes('hükümlü') || content.includes('infaz') ||
      content.includes('eğitimevi') || content.includes('mahkum')) {
      return 'infaz';
    }

    if (content.includes('gümrük') || content.includes('ithalat') ||
      content.includes('ihracat') || content.includes('tarife')) {
      return 'gumruk';
    }

    if (content.includes('kumar') || content.includes('hakaret') ||
      content.includes('hırsızlık')) {
      return 'ceza';
    }

    return null;
  }

  /**
  * TR: ALANLARIN İLİŞKİLİ OLUP OLMADIĞINI KONTROL ET
  * EN: CHECK IF DOMAINS ARE RELATED
  */
  private areDomainsRelated(domain1: string | null, domain2: string | null): boolean {
    if (!domain1 || !domain2) return false;

    const relatedDomains: Record<string, string[]> = {
      'infaz': ['ceza'],
      'ceza': ['infaz']
    };

    return relatedDomains[domain1]?.includes(domain2) || false;
  }

  /**
  * TR: KÖTÜ EŞLEŞMELERİ ÖNLEMEK İÇİN SPESİFİK FİLTRELEME KURALLARI UYGULA
  * EN: APPLY SPECIFIC FILTERING RULES TO PREVENT BAD MATCHES
  */
  private passesSpecificFilters(query: string, result: SearchResult & { lexicalScore: number; semanticScore: number }): boolean {
    const queryLower = query.toLowerCase();
    const contentLower = result.content.toLowerCase();
    const kanunAdi = result.metadata?.kanun_adi?.toLowerCase() || '';

    // TR: HÜKÜMLÜ/EĞİTİMEVİ SORUYORSA AMA SONUÇ GÜMRÜK HAKKINDAYSa
    // EN: IF ASKING ABOUT PRISONER/EDUCATION INSTITUTION BUT RESULT IS ABOUT CUSTOMS
    if ((queryLower.includes('hükümlü') || queryLower.includes('eğitimevi')) &&
      (contentLower.includes('gümrük') || kanunAdi.includes('gümrük') ||
        contentLower.includes('ithalat') || contentLower.includes('ihracat'))) {
      return false;
    }

    // TR: GÜMRÜK SORUYORSA AMA SONUÇ CEZAİ/KUMAR HAKKINDAYSa
    // EN: IF ASKING ABOUT CUSTOMS BUT RESULT IS ABOUT CRIMINAL/GAMBLING
    if (queryLower.includes('gümrük') &&
      (contentLower.includes('kumar') || contentLower.includes('hırsızlık') ||
        contentLower.includes('hakaret'))) {
      return false;
    }

    return true;
  }

  /**
   * TR: FİNAL HİBRİT SKORLARINI HESAPLA
   * EN: CALCULATE FINAL HYBRID SCORES
   */
  private calculateHybridScores(
    results: ReRankingResult[],
    lexicalWeight: number,
    semanticWeight: number,
    reRankWeight: number,
    query: string
  ): HybridSearchResult[] {
    return results.map(result => {
      // TR: SKORLARI 0-1 ARALIGA SABİTLE
      // EN: NORMALIZE SCORES TO 0-1 RANGE
      const normalizedLexical = Math.min(1, (result as unknown as { lexicalScore: number }).lexicalScore || 0);
      const normalizedSemantic = Math.min(1, (result as unknown as { semanticScore: number }).semanticScore || 0);
      const normalizedReRank = result.reRankScore;

      // TR: AĞIRLIKLI FİNAL SKORUNU HESAPLA
      // EN: CALCULATE WEIGHTED FINAL SCORE
      const finalScore =
        (lexicalWeight * normalizedLexical) +
        (semanticWeight * normalizedSemantic) +
        (reRankWeight * normalizedReRank);

      return {
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        lexicalScore: normalizedLexical,
        semanticScore: normalizedSemantic,
        reRankScore: normalizedReRank,
        finalScore,
        matchedKeywords: (result as unknown as { keywordMatches?: string[] }).keywordMatches || [],
        relevanceExplanation: this.generateRelevanceExplanation(result, query)
      };
    });
  }

  /**
  * TR: SONUCUN NEDEN İLGİLİ OLDUĞUNA DAİR AÇIKLAMA OLUŞTURMA
  * EN: GENERATE EXPLANATION FOR WHY RESULT IS RELEVANT
  */
  private generateRelevanceExplanation(result: ReRankingResult, _query: string): string {
    const explanations: string[] = [];

    if (result.reRankScore > 0.7) {
      explanations.push('Yüksek semantik benzerlik');
    }

    const keywordMatches = (result as unknown as { keywordMatches?: string[] }).keywordMatches;
    if (keywordMatches && keywordMatches.length > 0) {
      explanations.push(`${keywordMatches.length} anahtar kelime eşleşmesi`);
    }

    if (result.isRelevant) {
      explanations.push('Cross-encoder onayı');
    }

    return explanations.length > 0 ? explanations.join(', ') : 'Genel benzerlik';
  }
}

export const hybridSearchService = new HybridSearchService();
