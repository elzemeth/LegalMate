// TR: DAHA İYİ BENZERLİK İÇİN TRANSFORMER MODELLERİ KULLANARAK ARAMA SONUÇLARINI YENIDEN SIRALAMA
// EN: USES TRANSFORMER MODELS TO RE-RANK SEARCH RESULTS FOR BETTER RELEVANCE

export interface ReRankingResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  originalScore: number;
  reRankScore: number;
  finalScore: number;
  isRelevant: boolean;
}

export class CrossEncoderService {
  
  /**
  * TR: CROSS-ENCODER YAKLAŞIMI KULLANARAK ARAMA SONUÇLARINI YENIDEN SIRALAMA
  * EN: RE-RANK SEARCH RESULTS USING CROSS-ENCODER APPROACH
  */
  async reRankResults(
    query: string, 
    results: Array<{ id: string; content: string; metadata: Record<string, unknown>; similarity?: number; bm25Score?: number }>, 
    options: { threshold?: number; maxResults?: number } = {}
  ): Promise<ReRankingResult[]> {
    const { threshold = 0.3, maxResults = 10 } = options;
    
    try {
      const reRankedResults: ReRankingResult[] = [];
      
      for (const result of results) {
        const reRankScore = this.calculateSemanticRelevance(query, result);
        const isRelevant = reRankScore >= threshold;
        
        const finalScore = this.combinescores(result.similarity || result.bm25Score || 0, reRankScore);
        
        reRankedResults.push({
          id: result.id,
          content: result.content,
          metadata: result.metadata,
          originalScore: result.similarity || result.bm25Score || 0,
          reRankScore,
          finalScore,
          isRelevant
        });
      }
      
      return reRankedResults
        .filter(result => result.isRelevant)
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, maxResults);
        
    } catch (error) {
      console.error('Re-ranking error:', error);
      return [];
    }
  }
  
  /**
  * EN: CALCULATE SEMANTIC REVELANCE USING DOMAIN-SPESIFIC RULES
  * TR: ALANA ÖZGÜ KURALLAR KULLANARAK SEMANTİK YAKINLIK HESAPLAMA
  */
  private calculateSemanticRelevance(query: string, result: { content: string; metadata: Record<string, unknown> }): number {
    const queryLower = query.toLowerCase();
    const contentLower = result.content.toLowerCase();
    const kanunAdi = (result.metadata?.kanun_adi as string)?.toLowerCase() || '';
    const baslik = (result.metadata?.baslik as string)?.toLowerCase() || '';
    
    let score = 0;
    
    // 1. DOMAIN MATCHING
    // 2. DOMAIN EŞLEŞTİRME
    const queryDomain = this.detectQueryDomain(queryLower);
    const resultDomain = this.detectResultDomain(contentLower, kanunAdi);
    
    if (queryDomain && resultDomain) {
      if (queryDomain === resultDomain) {
        score += 0.4;
      } else if (this.areRelatedDomains(queryDomain, resultDomain)) {
        score += 0.2;
      } else {
        score -= 0.3;
      }
    }
    
    // 2. EXACT KEYWORD MATCHING
    // 2. ANAHTAR KELİME EŞLEŞMESİ
    const queryKeywords = this.extractKeywords(queryLower);
    const contentKeywords = this.extractKeywords(contentLower + ' ' + baslik);
    
    const keywordMatches = queryKeywords.filter(keyword => 
      contentKeywords.some(contentKey => contentKey.includes(keyword))
    );
    
    score += (keywordMatches.length / queryKeywords.length) * 0.3;
    
    // 3. NEGATIVE INDICATORS
    // 3. NEGATİF BAĞLAÇLAR
    const negativeIndicators = this.checkNegativeIndicators(queryLower, contentLower, kanunAdi);
    score -= negativeIndicators * 0.5;
    
    // 4. SPRESIFIC ENTITY MATCHING
    // 4. SPESİFİK ENTITY EŞLEŞTİRME
    score += this.checkLegalEntityMatching(queryLower, contentLower, baslik) * 0.2;
    
    // 5. TITLE RELEVANCE BOOST
    // 5. BAŞLIK ALAKASINI ARTIRMA
    const titleRelevance = this.calculateTitleRelevance(queryLower, baslik);
    score += titleRelevance * 0.1;
    
    // TR: SKORU 0-1 ARASI NORMALİZE ETME
    // EN: NORMALIZE SCORE TO 0-1
    return Math.max(0, Math.min(1, score));
  }
  
  /**
  * EN: DETECT LEGAL DOMAIN FROM QUERY
  * TR: SORGUDAN HUKUKİ ALANLARI TESPİT ETME
  */
  private detectQueryDomain(query: string): string | null {
    const domainIndicators = {
      'infaz': ['hükümlü', 'mahkum', 'eğitimevi', 'cezaevi', 'hapishane', 'infaz', 'denetimli serbestlik', 'izin', 'çıkma'],
      'ceza': ['suç', 'ceza', 'hapis', 'para cezası', 'mahkumiyet'],
      'medeni': ['evlilik', 'boşanma', 'miras', 'mülkiyet', 'kişilik hakları', 'aile'],
      'is': ['işçi', 'işveren', 'iş sözleşmesi', 'ücret', 'çalışma', 'mesai'],
      'ticaret': ['şirket', 'ticaret', 'senet', 'borsa'],
      'idare': ['idari', 'kamu', 'belediye', 'bürokrasi'],
      'gumruk': ['gümrük', 'ithalat', 'ihracat', 'vergi', 'tarife']
    };
    
    for (const [domain, indicators] of Object.entries(domainIndicators)) {
      if (indicators.some(indicator => query.includes(indicator))) {
        return domain;
      }
    }
    
    return null;
  }
  
  /**
  * EN: DETECT THE LEGAL DOMAIN FROM RESULT CONTENT
  * TR: SONUÇ İÇERİĞİNDEN HUKUKİ ALANI TESPİT ETME
  */
  private detectResultDomain(content: string, kanunAdi: string): string | null {
    // TR: KANUN ADINI KONTROL ET
    // EN: CHECK LAW NAME
    if (kanunAdi.includes('ceza')) return 'ceza';
    if (kanunAdi.includes('medeni')) return 'medeni';
    if (kanunAdi.includes('iş') || kanunAdi.includes('çalışma')) return 'is';
    if (kanunAdi.includes('gümrük')) return 'gumruk';
    if (kanunAdi.includes('ticaret')) return 'ticaret';
    
    // TR: İÇERİĞİ KONTROL ET
    // EN: CHECK CONTENT
    if (content.includes('hükümlü') || content.includes('infaz') || content.includes('cezaevi')) return 'infaz';
    if (content.includes('kumar') || content.includes('hakaret') || content.includes('hırsızlık')) return 'ceza';
    if (content.includes('gümrük') || content.includes('ithalat')) return 'gumruk';
    
    return null;
  }
  
  /**
   * TR: ALANLARIN İLİŞKİLİ OLUP OLMADIĞINI KONTROL ET
   * EN: CHECK IF DOMAINS ARE RELATED
   */
  private areRelatedDomains(domain1: string, domain2: string): boolean {
    const relatedDomains: Record<string, string[]> = {
      'infaz': ['ceza'],
      'ceza': ['infaz'],
      'is': ['idare'],
      'idare': ['is']
    };
    
    return relatedDomains[domain1]?.includes(domain2) || false;
  }
  
  /**
   * TR: METİNDEN ANAHTAR HUKUKİ TERİMLERİ ÇIKAR
   * EN: EXTRACT KEY LEGAL TERMS FROM TEXT
   */
  private extractKeywords(text: string): string[] {
    const legalKeywords = [
      'hükümlü', 'mahkum', 'eğitimevi', 'izin', 'çıkma', 'kurum',
      'ceza', 'hapis', 'suç', 'mahkumiyet',
      'işçi', 'işveren', 'iş sözleşmesi', 'ücret',
      'gümrük', 'vergi', 'ithalat', 'ihracat',
      'evlilik', 'miras', 'mülkiyet'
    ];
    
    return legalKeywords.filter(keyword => text.includes(keyword));
  }
  
  /**
   * TR: ALAKASIZLIK GÖSTEREN NEGATİF GÖSTERGELERİ KONTROL ET
   * EN: CHECK FOR NEGATIVE INDICATORS THAT SUGGEST IRRELEVANCE
   */
  private checkNegativeIndicators(query: string, content: string, kanunAdi: string): number {
    let penalties = 0;

    // TR: HÜKÜMLÜ/GÖZALTı/EĞİTİM SORUYORSA AMA SONUÇ GÜMRÜK HAKKINDAYSA
    // EN: IF ASKING ABOUT PRISONER/DETENTION/EDUCATION BUT RESULT IS ABOUT CUSTOMS
    if ((query.includes('hükümlü') || query.includes('eğitimevi') || query.includes('çocuk') || query.includes('infaz')) && 
        (content.includes('gümrük') || kanunAdi.includes('gümrük') || 
         content.includes('ithalat') || content.includes('ihracat') || 
         content.includes('tarife') || content.includes('vergİ'))) {
      penalties += 5;
    }
    
    // TR: HÜKÜMLÜ/GÖZALTI SORUYORSA AMA SONUÇ KUMAR HAKKINDAYSa
    // EN: IF ASKING ABOUT PRISONER/DETENTION BUT RESULT IS ABOUT GAMBLING
    if ((query.includes('hükümlü') || query.includes('eğitimevi') || query.includes('infaz')) && 
        (content.includes('kumar') || content.includes('bahis'))) {
      penalties += 5;
    }
    
    // TR: HÜKÜMLÜ/GÖZALTı SORUYORSA AMA SONUÇ HIRSIZLIK HAKKINDAYSA
    // EN: IF ASKING ABOUT PRISONER/DETENTION BUT RESULT IS ABOUT THEFT
    if ((query.includes('hükümlü') || query.includes('eğitimevi') || query.includes('infaz')) && 
        content.includes('hırsızlık')) {
      penalties += 4;
    }
    
    // TR: HÜKÜMLÜ/GÖZALTı SORUYORSA AMA SONUÇ HAKARET/TEHDİT HAKKINDAYSa
    // EN: IF ASKING ABOUT PRISONER/DETENTION BUT RESULT IS ABOUT INSULT/THREAT
    if ((query.includes('hükümlü') || query.includes('eğitimevi') || query.includes('infaz')) && 
        (content.includes('hakaret') || content.includes('tehdit'))) {
      penalties += 3;
    }
    
    // TR: İŞ HUKUKU SORUYORSA AMA SONUÇ CEZA HUKUKU HAKKINDAYSA
    // EN: IF ASKING ABOUT WORK LAW BUT RESULT IS ABOUT CRIMINAL LAW
    if ((query.includes('işçi') || query.includes('iş sözleşmesi')) && 
        (content.includes('kumar') || content.includes('hırsızlık') || content.includes('hükümlü'))) {
      penalties += 4;
    }
    
    // TR: GÜMRÜK SORUYORSA AMA SONUÇ CEZA HUKUKU HAKKINDAYSA
    // EN: IF ASKING ABOUT CUSTOMS BUT RESULT IS ABOUT CRIMINAL LAW
    if (query.includes('gümrük') && 
        (content.includes('hükümlü') || content.includes('ceza') || content.includes('hapishane'))) {
      penalties += 4;
    }
    
    // TR: EK SPESİFİK UYUMSUZLUKLAR
    // EN: ADDITIONAL SPECIFIC MISMATCHES
    if (query.includes('çocuk') && content.includes('kumar')) {
      penalties += 5;
    }
    
    if (query.includes('eğitim') && content.includes('ithalat')) {
      penalties += 4;
    }
    
    return penalties;
  }
  
  /**
   * TR: BELİRLİ HUKUKİ VARLIK EŞLEŞMESİNİ KONTROL ET
   * EN: CHECK FOR SPECIFIC LEGAL ENTITY MATCHING
   */
  private checkLegalEntityMatching(query: string, content: string, title: string): number {
    let score = 0;
    
    // TR: KURUM EŞLEŞMESİ
    // EN: INSTITUTION MATCHING
    if (query.includes('eğitimevi') && 
        (content.includes('eğitim') || content.includes('kurum') || title.includes('eğitim'))) {
      score += 1;
    }
    
    // TR: KİŞİ TİPİ EŞLEŞMESİ
    // EN: PERSON TYPE MATCHING
    if (query.includes('hükümlü') && 
        (content.includes('hükümlü') || content.includes('mahkum'))) {
      score += 1;
    }
    
    // TR: EYLEM EŞLEŞMESİ
    // EN: ACTION MATCHING
    if (query.includes('izin') && 
        (content.includes('izin') || content.includes('çıkma') || content.includes('müsaade'))) {
      score += 1;
    }
    
    return score;
  }
  
  /**
  * TR: BAŞLIK İLGİLİLİĞİNİ HESAPLA
  * EN: CALCULATE TITLE RELEVANCE
  */
  private calculateTitleRelevance(query: string, title: string): number {
    if (!title) return 0;
    
    const queryWords = query.split(/\s+/).filter(w => w.length > 2);
    const titleWords = title.split(/\s+/).filter(w => w.length > 2);
    
    const matches = queryWords.filter(qw => 
      titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
    );
    
    return queryWords.length > 0 ? matches.length / queryWords.length : 0;
  }
  
  /**
  * TR: ORİJİNAL ARAMA SKORUNU YENİDEN SIRALAMA SKORU İLE BİRLEŞTİR
  * EN: COMBINE ORIGINAL SEARCH SCORE WITH RE-RANKING SCORE
  */
  private combinescores(originalScore: number, reRankScore: number): number {
    // TR: AĞIRLIKLI BİRLEŞTİRME: %30 ORİJİNAL, %70 YENİDEN SIRALAMA
    // EN: WEIGHTED COMBINATION: 30% ORIGINAL, 70% RE-RANKING
    return 0.3 * originalScore + 0.7 * reRankScore;
  }
}

export const crossEncoderService = new CrossEncoderService();
