// TR: BM25 KELİME TABANLI ARAMA İLE SEMANTİK VEKTÖR ARAMAYI BİRLEŞTİREN HİBRİT ARAMA
// EN: COMBINES BM25 LEXICAL SEARCH WITH SEMANTIC VECTOR SEARCH

export interface LexicalSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  bm25Score: number;
  keywordMatches: string[];
}

export class LexicalSearchService {

  /**
  * TR: BM25 BENZERİ KELİME TABANLI ARAMA İMPLEMENTASYONU
  * EN: BM25-LIKE LEXICAL SEARCH IMPLEMENTATION
  */
  async lexicalSearch(query: string, limit: number = 50): Promise<LexicalSearchResult[]> {
    try {
      const queryTerms = this.preprocessQuery(query);

      // TR: TÜM DOSYALARI AL
      // EN: GET ALL DOCS
      const { data: allDocs, error } = await supabase
        .from('law_chunks')
        .select('id, content, metadata');

      if (error) throw error;
      if (!allDocs || allDocs.length === 0) return [];

      // TR: BM25 SKORLARINI HESAPLAMA
      // EN: CALCULATE BM25 SCORES
      const scoredResults = allDocs.map(doc => {
        const bm25Score = this.calculateBM25Score(queryTerms, doc.content, allDocs);
        const keywordMatches = this.getKeywordMatches(queryTerms, doc.content);

        return {
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          bm25Score,
          keywordMatches
        };
      });

      // TR: FİLTRELEME VE SIRALAMA
      // EN: FILTER AND SORT 
      return scoredResults
        .filter(result => result.bm25Score > 0)
        .sort((a, b) => b.bm25Score - a.bm25Score)
        .slice(0, limit);

    } catch (error) {
      console.error('Lexical search error:', error);
      return [];
    }
  }

  /**
  * TR: DAHA İYİ KELİME EŞLEŞMESİ İÇİN SORGUYU ÖNİŞLE
  * EN: PREPROCESS QUERY FOR BETTER LEXICAL MATCHING 
  */
  private preprocessQuery(query: string): string[] {
    const normalized = query
      .toLowerCase()
      .replace(/[^\w\sğüşöıçĞÜŞÖIÇ]/g, ' ')
      .trim();

    const terms = normalized.split(/\s+/).filter(term => term.length > 2);

    const expandedTerms = [...terms];

    terms.forEach(term => {
      const variants = this.getTurkishVariants(term);
      expandedTerms.push(...variants);
    });

    return [...new Set(expandedTerms)];
  }

  /**
  * TR: HUKUKİ TERİMLER İÇİN TÜRKÇE KELİME VARYANTLARI
  * EN: GET TURKISH WORDS FOR LEGAL TERMS
  */
  private getTurkishVariants(term: string): string[] {
    const variants: string[] = [];

    const legalTermVariants: Record<string, string[]> = {
      'hükümlü': ['mahkum', 'tutuklu', 'hükümlü'],
      'eğitimevi': ['eğitim', 'kurum', 'müessese'],
      'izin': ['izin', 'müsaade', 'ruhsat', 'çıkma'],
      'çocuk': ['çocuk', 'küçük', 'reşit olmayan'],
      'kurum': ['kurum', 'müessese', 'tesis', 'eğitimevi'],
      'infaz': ['infaz', 'cezaevi', 'hapishane'],
      'denetimli': ['denetimli', 'serbestlik', 'gözetim']
    };

    if (legalTermVariants[term]) {
      variants.push(...legalTermVariants[term]);
    }

    return variants;
  }

  /**
  * TR: BM25 SKORUNU HESAPLAMA 
  * EN: CALCULATE BM25 SCORE
  */
  private calculateBM25Score(queryTerms: string[], docContent: string, allDocs: Array<{ content: string }>): number {
    const k1 = 1.2;
    const b = 0.75;

    const docTerms = docContent.toLowerCase().split(/\s+/);
    const docLength = docTerms.length;
    const avgDocLength = allDocs.reduce((sum, doc) =>
      sum + doc.content.split(/\s+/).length, 0) / allDocs.length;

    let score = 0;

    queryTerms.forEach(term => {
      const termFreq = docTerms.filter(t => t.includes(term)).length;
      if (termFreq === 0) return;

      const docFreq = allDocs.filter(doc =>
        doc.content.toLowerCase().includes(term)).length;

      const idf = Math.log((allDocs.length - docFreq + 0.5) / (docFreq + 0.5));

      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));

      score += idf * (numerator / denominator);
    });

    return score;
  }

  /**
  * TR: ANAHTAR KELİME EŞLEŞTİRMELERİNİ ALMA 
  * EN: GET KEYWORD MATCHING
  */
  private getKeywordMatches(queryTerms: string[], content: string): string[] {
    const contentLower = content.toLowerCase();
    return queryTerms.filter(term => contentLower.includes(term));
  }
}

import { supabase } from './supabase';

export const lexicalSearchService = new LexicalSearchService();
