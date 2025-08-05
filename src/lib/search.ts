import { supabase, supabaseAdmin } from './supabase';
import { DocumentChunk } from './embedding';

// TR: HUKUK BELGESİ ALMA İÇİN VEKTÖR EMBEDDING KULLANARAK SEMANTİK ARAMA SERVİSİ
// EN: SEMANTIC SEARCH SERVICE USING VECTOR EMBEDDING FOR LEGAL DOCUMENT RETRIEVAL

export interface SearchResult {
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
  relevanceScore?: number; // Enhanced relevance scoring
}

export interface SearchResultItem {
  id?: string;
  content?: string;
  metadata?: {
    madde_no?: string;
    baslik?: string;
    kanun_adi?: string;
    chunk_index?: number;
    total_chunks?: number;
    paragraflar?: Array<{ no: string; icerik: string }>;
    icerik?: string;
  };
  similarity?: number;
  relevanceScore?: number;
  professionalScore?: number;
  domainMatch?: number;
  entityMatch?: number;
  position?: number;
  law?: string;
  article?: string;
  score?: number;
  qualityStatus?: string;
  preview?: string;
  domainScore?: number;
  entityScore?: number;
  lawInfo?: {
    name?: string;
    article?: string;
    section?: string;
  };
  confidence?: number | string;
  scores?: {
    relevance?: number;
    coherence?: number;
    completeness?: number;
    legal_accuracy?: number;
    final?: number;
    lexical?: number;
    semantic?: number;
    crossEncoder?: number;
    entity?: number;
    domain?: number;
    context?: number;
  };
  domainContext?: {
    primary_domain?: string;
    secondary_domains?: string[];
    legal_principles?: string[];
    primary?: string;
    confidence?: number;
  };
  matchedEntities?: Array<{
    entity?: string;
    type?: string;
    confidence?: number;
    value?: string;
  }>;
  reasoning?: {
    why_relevant?: string;
    key_concepts?: string[];
    legal_basis?: string;
  };
  citationInfo?: {
    article_reference?: string;
    law_name?: string;
    section_number?: string;
  };
  enhancement?: {
    summary?: string;
    key_points?: string[];
    related_articles?: string[];
  };
  qualityMetrics?: {
    precision?: number;
    recall?: number;
    f1_score?: number;
  };
  contextualRelevance?: number;
  legalAccuracy?: number;
  comprehensiveness?: number;
  relevanceExplanation?: string;
}

export interface SearchOptions {
  threshold?: number;
  limit?: number;
  legalDomain?: string;
  excludeKeywords?: string[];
  requireKeywords?: string[];
}

export class SearchService {

  /**
   * TR: ÇOK KATMANLI FİLTRELEME İLE GELİŞMİŞ SEMANTİK ARAMA
   * EN: ADVANCED SEMANTIC SEARCH WITH MULTI-LAYER FILTERING AND RELEVANCE SCORING
   */
  async searchWithFiltering(
    queryEmbedding: number[], 
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      threshold = 0.5,
      limit = 10,
      legalDomain,
      excludeKeywords = [],
      requireKeywords = []
    } = options;

    try {
      // ADIM 1: SEMANTİK BENZERLİK SONUÇLARINI AL
      // STEP 1: GET SEMANTIC SIMILARITY RESULTS
      const { data, error } = await supabase.rpc('match_law_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold * 0.7,
        match_count: limit * 3
      });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // ADIM 2: İÇERİK TABANLI FİLTRE UYGULA
      // STEP 2: APPLY CONTENT-BASED FILTERING
      let filteredResults = data.map((item: { id: string; content: string; metadata: Record<string, unknown>; similarity: number }) => ({
        id: item.id,
        content: item.content,
        metadata: item.metadata,
        similarity: item.similarity
      })) as SearchResult[];

      // ADIM 3: HUKUKİ ALAN FİLTRELEME
      // STEP 3: LEGAL DOMAIN FILTERING
      if (legalDomain) {
        filteredResults = this.filterByLegalDomain(filteredResults, legalDomain);
      }

      // ADIM 4: ANAHTAR KELİME FİLTRELEME
      // STEP 4: KEYWORD FILTERING
      filteredResults = this.applyKeywordFiltering(
        filteredResults, 
        query, 
        excludeKeywords, 
        requireKeywords
      );

      // ADIM 5: GELİŞMİŞ İLGİLİLİK PUANLAMASI
      // STEP 5: ENHANCED RELEVANCE SCORING
      filteredResults = this.calculateRelevanceScores(filteredResults, query);

      // ADIM 6: BİRLEŞİK PUANA GÖRE YENIDEN SIRALAMA VE FİNAL EŞİĞİ UYGULAMA
      // STEP 6: RE-RANK BY COMBINED SCORE AND APPLY FINAL THRESHOLD
      filteredResults = filteredResults
        .filter(result => result.similarity >= threshold)
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, limit);

      return filteredResults;

    } catch (error) {
      console.error('Enhanced search error:', error);
      throw error;
    }
  }

  /**
   * TR: SONUÇLARI HUKUKİ ALANA GÖRE FİLTRELE
   * EN: FILTER SEARCH RESULTS BY LEGAL DOMAIN CONTEXT
   */
  private filterByLegalDomain(results: SearchResult[], domain: string): SearchResult[] {
    const domainKeywords = {
      'ceza': ['ceza', 'suç', 'hapis', 'infaz', 'hükümlü', 'mahkumiyet', 'cezaevi', 'eğitimevi'],
      'medeni': ['medeni', 'evlilik', 'miras', 'mülkiyet', 'kişilik', 'aile', 'velayet'],
      'iş': ['iş', 'işçi', 'işveren', 'çalışma', 'ücret', 'mesai'],
      'ticaret': ['ticaret', 'şirket', 'senet', 'ticari'],
      'idare': ['idari', 'kamu', 'devlet', 'belediye'],
      'gümrük': ['gümrük', 'ithalat', 'ihracat', 'vergi']
    };

    const keywords = domainKeywords[domain.toLowerCase() as keyof typeof domainKeywords];
    if (!keywords) return results;

    return results.filter(result => {
      const content = (result.content + ' ' + result.metadata.kanun_adi + ' ' + result.metadata.baslik).toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    });
  }

  /**
   * TR: ANAHTAR KELİME TABANLI FİLTRELEME
   * EN: FILTER RESULTS BASED ON REQUIRED AND EXCLUDED KEYWORDS
   */
  private applyKeywordFiltering(
    results: SearchResult[], 
    query: string,
    excludeKeywords: string[], 
    requireKeywords: string[]
  ): SearchResult[] {
    return results.filter(result => {
      const content = (result.content + ' ' + result.metadata.baslik).toLowerCase();
      const queryLower = query.toLowerCase();

      if (excludeKeywords.some(keyword => content.includes(keyword.toLowerCase()))) {
        return false;
      }

      if (requireKeywords.length > 0 && !requireKeywords.some(keyword => content.includes(keyword.toLowerCase()))) {
        return false;
      }

      if (this.isObviousMismatch(queryLower, content, result.metadata.kanun_adi.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  /**
   * TR: SORGU VE İÇERİK ARASINDAKİ UYUMSUZLUK KONTROLÜ
   * EN: CHECK FOR IRRELEVANT RESULTS BETWEEN QUERY AND CONTENT
   */
  private isObviousMismatch(query: string, content: string, lawName: string): boolean {
    const domainKeywords = {
      'ceza': ['ceza', 'suç', 'hapis', 'infaz', 'hükümlü', 'mahkumiyet', 'cezaevi', 'eğitimevi'],
      'medeni': ['medeni', 'evlilik', 'miras', 'mülkiyet', 'kişilik', 'aile', 'velayet'],
      'iş': ['iş', 'işçi', 'işveren', 'çalışma', 'ücret', 'mesai'],
      'ticaret': ['ticaret', 'şirket', 'senet', 'ticari'],
      'idare': ['idari', 'kamu', 'devlet', 'belediye'],
      'gümrük': ['gümrük', 'ithalat', 'ihracat', 'vergi']
    };

    const queryDomains = Object.entries(domainKeywords)
      .filter(([_, keywords]) => keywords.some(k => query.includes(k)))
      .map(([domain]) => domain);

    const lawDomains = Object.entries(domainKeywords)
      .filter(([_, keywords]) => keywords.some(k => lawName.includes(k) || content.includes(k)))
      .map(([domain]) => domain);

    if (queryDomains.length > 0 && lawDomains.length > 0) {
      const overlap = queryDomains.some(domain => lawDomains.includes(domain));
      if (!overlap) {
        return true;
      }
    }

    if (queryDomains.length === 1 && lawDomains.length === 0) {
      return true;
    }

    return false;
  }

  /**
  * TR: GELİŞMİŞ BENZERLİK SKORLARI HESAPLAMA
  * EN: CALCULATE ADVANCED REVELANCE SCORES
  */
  private calculateRelevanceScores(results: SearchResult[], query: string): SearchResult[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);

    return results.map(result => {
      let relevanceScore = result.similarity;
      const content = result.content.toLowerCase();
      const title = result.metadata.baslik.toLowerCase();

      const exactMatches = queryWords.filter(word => content.includes(word) || title.includes(word)).length;
      relevanceScore += (exactMatches / queryWords.length) * 0.3;

      const titleMatches = queryWords.filter(word => title.includes(word)).length;
      relevanceScore += (titleMatches / queryWords.length) * 0.2;

      if (result.content.length > 5000) {
        relevanceScore *= 0.9;
      }

      result.relevanceScore = relevanceScore;
      return result;
    });
  }
  
  /**
  * TR: CHUNKLARI SUPABASE'E EKLEME
  * EN: STORE DOCUMENT CHUNKS TO SUPABASE
  **/
  async insertChunks(chunks: DocumentChunk[]): Promise<void> {
    try {
      // TR: VERİTABANINA BELGE PARÇALARINI EMBEDDİNG İLE EKLE
      // EN: INSERT DOCUMENT CHUNKS WITH EMBEDDINGS TO DATABASE
      const { error } = await supabaseAdmin
        .from('law_chunks')
        .insert(
          chunks.map(chunk => ({
            content: chunk.content,
            metadata: chunk.metadata,
            embedding: chunk.embedding
          }))
        );

      if (error) {
        throw error;
      }

      console.log(`Successfully inserted ${chunks.length} chunks`);
    } catch (error) {
      console.error('Error inserting chunks:', error);
      throw error;
    }
  }

  /**
  * TR: BENZERLİK ARAMASI GERÇEKLEŞTIR
  * EN: VECTOR SIMILARITY SEARCH IN DATABASE
  **/
  async similaritySearch(
    queryEmbedding: number[], 
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<SearchResult[]> {
    try {
      // TR: VEKTÖR BENZERLİK ARAMASI FONKSİYONU ÇAĞIR
      // EN: CALL VECTOR SIMILARITY SEARCH FUNCTION
      const { data, error } = await supabase.rpc('match_law_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw error;
    }
  }

  /**
  * TR: BELİRLİ BİR MAKALE İÇİN TÜM PARÇALARI GETIR
  * EN: RETRIEVE ALL CHUNKS FOR A SPECIFIC LEGAL ARTICLE
  **/
  async getArticleChunks(maddeNo: string, kanunAdi: string): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('law_chunks')
        .select('*')
        .eq('metadata->>madde_no', maddeNo)
        .eq('metadata->>kanun_adi', kanunAdi)
        .order('metadata->>chunk_index', { ascending: true });

      if (error) {
        throw error;
      }

      return data?.map(item => ({
        id: item.id,
        content: item.content,
        metadata: item.metadata,
        similarity: 1.0
      })) || [];
    } catch (error) {
      console.error('Error getting article chunks:', error);
      throw error;
    }
  }

  /**
  * TR: TÜM CHUNKLARI SİLME (TEKRAR İNDEKSELEME İÇİN)
  * EN: DELETE ALL CHUNKS (FOR RE-INDEX)
  **/
  async clearAllChunks(): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('law_chunks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // RD

      if (error) {
        throw error;
      }

      console.log('Successfully cleared all chunks');
    } catch (error) {
      console.error('Error clearing chunks:', error);
      throw error;
    }
  }

  /**
  * TR: İNDEKSLENMİŞ DATALAR İÇİN İSTATİSTİKLERİ GETİRME
  * EN: GET STATISTICS ABOUT THE INDEXED DATA
  **/
  async getIndexStats(): Promise<{
    totalChunks: number;
    uniqueArticles: number;
    lawTypes: string[];
  }> {
    try {
      console.log('Getting database statistics...');
      
      // TR: TOPLAM CHUNK SAYISI İÇİN HIZLI SAYMA
      // EN: FAST COUNT FOR TOTAL CHUNKS
      const { count: totalChunks, error: countError } = await supabase
        .from('law_chunks')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting count:', countError);
        throw countError;
      }

      console.log(`Total chunks: ${totalChunks}`);

      // TR: SADECE GEREKLİ METADATALARI ALIP GRUPLANDIRMA
      // EN: GET ONLY NECESSARY METADATA WITH AGGREGATION
      const { data: lawStats, error: lawStatsError } = await supabase
        .rpc('get_law_stats');

      if (lawStatsError) {
        console.warn('RPC function not available, using fallback method');
        
        // TR: FALLBACK: LİMİTLİ VERİ ÇEKİMİ
        // EN: FALLBACK: LIMITED DATA FETCH
        const { data: chunks, error: chunksError } = await supabase
          .from('law_chunks')
          .select('metadata->kanun_adi, metadata->madde_no')
          .limit(10000); // TR: SADECE İLK 10K KAYIT / EN: ONLY FIRST 10K RECORDS

        if (chunksError) {
          console.error('Error getting metadata:', chunksError);
          throw chunksError;
        }

        const articles = new Set();
        const laws = new Set();

        chunks?.forEach(chunk => {
          const kanunAdi = chunk.kanun_adi as string;
          const maddeNo = chunk.madde_no as string;
          if (kanunAdi && maddeNo) {
            articles.add(`${kanunAdi}-${maddeNo}`);
            laws.add(kanunAdi);
          }
        });

        console.log(`Unique articles: ${articles.size}, Law types: ${laws.size}`);

        return {
          totalChunks: totalChunks || 0,
          uniqueArticles: articles.size,
          lawTypes: Array.from(laws) as string[]
        };
      }

      // TR: RPC SONUÇLARINI İŞLEME
      // EN: PROCESS RPC RESULTS
      const articles = new Set();
      const laws = new Set();

      lawStats?.forEach((stat: { kanun_adi?: string; madde_no?: string }) => {
        if (stat.kanun_adi && stat.madde_no) {
          articles.add(`${stat.kanun_adi}-${stat.madde_no}`);
          laws.add(stat.kanun_adi);
        }
      });

      console.log(`Unique articles: ${articles.size}, Law types: ${laws.size}`);

      return {
        totalChunks: totalChunks || 0,
        uniqueArticles: articles.size,
        lawTypes: Array.from(laws) as string[]
      };
    } catch (error) {
      console.error('Error getting index stats:', error);
      return {
        totalChunks: 0,
        uniqueArticles: 0,
        lawTypes: []
      };
    }
  }
}

export const searchService = new SearchService();
