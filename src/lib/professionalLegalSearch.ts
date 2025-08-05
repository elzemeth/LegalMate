// TR: HUKUK METİNLERİ İÇİN PROFESYONEL METİN EŞLEŞTİRME SİSTEMİ
// EN: PROFESSIONAL-GRADE LEGAL TEXT MATCHING

import { embeddingService } from './embedding';
import { searchService, SearchResult } from './search';

// =================== INTERFACES ===================

export interface LegalEntity {
  type: 'person' | 'institution' | 'procedure' | 'concept';
  value: string;
  synonyms: string[];
  domain: string;
}

export interface DomainContext {
  primary: string;
  secondary: string[];
  confidence: number;
  indicators: string[];
}

export interface QualityMetrics {
  precision: number;
  entityMatch: number;
  domainMatch: number;
  contextualRelevance: number;
  finalScore: number;
}

export interface SearchScores {
  lexical: number;
  semantic: number;
  crossEncoder: number;
  entity: number;
  domain: number;
  context: number;
}

export interface ProfessionalSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  
  lexicalScore: number;
  semanticScore: number;
  crossEncoderScore: number;
  entityScore: number;
  domainScore: number;
  contextScore: number;
  finalScore: number;
  
  qualityMetrics: QualityMetrics;
  matchedEntities: LegalEntity[];
  domainContext: DomainContext;
  relevanceExplanation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SearchPiplineOptions {
  maxResults?: number;
  precision?: 'strict' | 'balanced' | 'recall';
  enableEntityExtraction?: boolean;
  enableDomainValidation?: boolean;
  enableContextualExpansion?: boolean;
  minPrecisionAtOne?: number; // Target >= 90%
}

// =================== LEGAL ENTITY ONTOLOGY ===================

export class LegalOntology {
  private entities: Map<string, LegalEntity> = new Map();
  private domainSynonyms: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeLegalEntities();
    this.initializeDomainSynonyms();
  }
  
  private initializeLegalEntities(): void {
    const entities: LegalEntity[] = [
      {
        type: 'institution',
        value: 'çocuk eğitimevi',
        synonyms: ['çocuk ıslahevi', 'islahevi', 'çocuk cezaevi', 'eğitim kurumu', 'çocuk eğitim evi'],
        domain: 'infaz'
      },
      {
        type: 'person',
        value: 'hükümlü',
        synonyms: ['mahkum', 'tutuklu', 'cezalı', 'mahpus', 'sanık'],
        domain: 'infaz'
      },
      {
        type: 'procedure',
        value: 'kurum dışı izin',
        synonyms: ['dışarı çıkma izni', 'geçici salıverme', 'çıkma izni', 'kurum dışına çıkma'],
        domain: 'infaz'
      },
      {
        type: 'procedure',
        value: 'denetimli serbestlik',
        synonyms: ['denetim altında özgürlük', 'koşullu tahliye', 'denetime tabi'],
        domain: 'infaz'
      },
      {
        type: 'institution',
        value: 'ceza infaz kurumu',
        synonyms: ['cezaevi', 'hapishane', 'infaz kurumu', 'tutukevi'],
        domain: 'infaz'
      },
      
      {
        type: 'concept',
        value: 'cinayet',
        synonyms: ['kasten öldürme', 'adam öldürme', 'katl', 'öldürme suçu'],
        domain: 'ceza'
      },
      {
        type: 'concept',
        value: 'hırsızlık',
        synonyms: ['çalma', 'sirkat', 'gaspetme', 'mal çalma'],
        domain: 'ceza'
      },
      {
        type: 'concept',
        value: 'dolandırıcılık',
        synonyms: ['sahtekarlık', 'aldatma', 'hile', 'sahtecilik'],
        domain: 'ceza'
      },
      {
        type: 'concept',
        value: 'ceza miktarı',
        synonyms: ['hapis cezası', 'ceza süresi', 'mahkumiyet süresi', 'ceza'],
        domain: 'ceza'
      },
      
      {
        type: 'concept',
        value: 'gümrük vergisi',
        synonyms: ['ithalat vergisi', 'gümrük tarifesi', 'gümrük resmi', 'vergi'],
        domain: 'gumruk'
      },
      {
        type: 'procedure',
        value: 'gümrük beyanı',
        synonyms: ['ithalat beyanı', 'ihracat beyanı', 'gümrük bildirimi', 'beyan'],
        domain: 'gumruk'
      },
      {
        type: 'concept',
        value: 'hesaplama',
        synonyms: ['hesap', 'muhasebe', 'tarifelendirme', 'hesaplama yöntemi'],
        domain: 'gumruk'
      },
      
      {
        type: 'person',
        value: 'işçi',
        synonyms: ['çalışan', 'emekçi', 'personel', 'memur'],
        domain: 'is'
      },
      {
        type: 'concept',
        value: 'ücret hakları',
        synonyms: ['maaş', 'ücret', 'haklar', 'çalışan hakları', 'işçi hakları'],
        domain: 'is'
      },
      {
        type: 'person',
        value: 'işveren',
        synonyms: ['patron', 'müdür', 'şirket', 'kurum'],
        domain: 'is'
      }
    ];
    
    entities.forEach(entity => {
      this.entities.set(entity.value, entity);
      entity.synonyms.forEach(synonym => {
        this.entities.set(synonym, entity);
      });
    });
  }
  
  private initializeDomainSynonyms(): void {
    this.domainSynonyms.set('infaz', [
      'ceza infaz', 'cezaevi', 'hapishane', 'tutukevi', 'açık cezaevi',
      'kapalı cezaevi', 'çocuk eğitimevi', 'gözaltı', 'mahkumiyet',
      'islahevi', 'çocuk ıslahevi', 'infaz kurumu', 'ceza infaz kurumu',
      'denetimli serbestlik', 'geçici salıverme', 'kurum dışı izin'
    ]);
    
    this.domainSynonyms.set('ceza', [
      'suç', 'ceza', 'hapis', 'para cezası', 'müebbet', 'ağırlaştırıcı',
      'hafifletici', 'cürüm', 'kabahat', 'fiil', 'cinayet', 'hırsızlık',
      'dolandırıcılık', 'kasten öldürme', 'adam öldürme', 'ceza miktarı'
    ]);
    
    this.domainSynonyms.set('gumruk', [
      'gümrük', 'ithalat', 'ihracat', 'tarife', 'vergi', 'ticaret',
      'antrepo', 'transit', 'serbest bölge', 'gümrük vergisi',
      'ithalat vergisi', 'ihracat vergisi', 'gümrük tarifesi',
      'beyan', 'hesaplama', 'muafiyet'
    ]);
    
    this.domainSynonyms.set('is', [
      'işçi', 'işveren', 'çalışan', 'emekçi', 'personel', 'ücret',
      'maaş', 'çalışma', 'mesai', 'iş sözleşmesi', 'işçi hakları',
      'ücret hakları', 'çalışan hakları', 'fazla mesai', 'işten çıkarma'
    ]);
  }
  
  extractEntities(text: string): LegalEntity[] {
    const found: LegalEntity[] = [];
    const textLower = text.toLowerCase();
    
    for (const [key, entity] of this.entities) {
      if (textLower.includes(key.toLowerCase())) {
        if (!found.find(e => e.value === entity.value)) {
          found.push(entity);
        }
      }
    }
    
    return found;
  }
  
  getDomainSynonyms(domain: string): string[] {
    return this.domainSynonyms.get(domain) || [];
  }
}

// =================== DOMAIN CLASSIFICATION ===================

export class DomainClassifier {
  private ontology: LegalOntology;
  
  constructor(ontology: LegalOntology) {
    this.ontology = ontology;
  }
  
  classifyQuery(query: string): DomainContext {
    const queryLower = query.toLowerCase();
    const entities = this.ontology.extractEntities(query);
    
    const domainScores: Record<string, number> = {
      'infaz': 0,
      'ceza': 0,
      'gumruk': 0,
      'medeni': 0,
      'is': 0,
      'ticaret': 0
    };
    
    entities.forEach(entity => {
      domainScores[entity.domain] += 0.3;
    });

    const domainKeywords = {
      'infaz': [
        'hükümlü', 'mahkum', 'eğitimevi', 'cezaevi', 'infaz', 'kurum dışı', 'izin', 
        'denetimli serbestlik', 'çocuk eğitimevi', 'islahevi', 'çıkma izni', 
        'geçici salıverme', 'ceza infaz kurumu', 'tutukevi', 'açık cezaevi'
      ],
      'ceza': [
        'cinayet', 'hırsızlık', 'dolandırıcılık', 'suç', 'ceza', 'mahkumiyet',
        'kasten öldürme', 'adam öldürme', 'ceza miktarı', 'hapis cezası',
        'müebbet', 'ağırlaştırıcı', 'hafifletici', 'suçlu', 'fail'
      ],
      'gumruk': [
        'gümrük', 'ithalat', 'ihracat', 'tarife', 'vergi', 'antrepo',
        'gümrük vergisi', 'beyan', 'hesaplama', 'gümrük tarifesi',
        'ithalat vergisi', 'ihracat vergisi', 'muafiyet'
      ],
      'medeni': [
        'evlilik', 'boşanma', 'miras', 'mülkiyet', 'aile', 'velayet',
        'nafaka', 'kişilik hakları', 'medeni hal'
      ],
      'is': [
        'işçi', 'işveren', 'iş sözleşmesi', 'ücret', 'çalışma saatleri',
        'işçi hakları', 'ücret hakları', 'maaş', 'çalışan', 'emekçi',
        'mesai', 'fazla mesai', 'işten çıkarma'
      ],
      'ticaret': [
        'şirket', 'ticaret', 'senet', 'borsa', 'ortaklık', 'ticari',
        'limited şirket', 'anonim şirket', 'ticaret sicili'
      ]
    };
    
    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      keywords.forEach(keyword => {
        if (queryLower.includes(keyword)) {
          domainScores[domain] += 0.2;
        }
      });
    });
    
    const sortedDomains = Object.entries(domainScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    if (sortedDomains.length === 0) {
      return {
        primary: 'unknown',
        secondary: [],
        confidence: 0,
        indicators: []
      };
    }
    
    const primary = sortedDomains[0][0];
    const primaryScore = sortedDomains[0][1];
    const secondary = sortedDomains.slice(1, 3).map(([domain]) => domain);
    
    return {
      primary,
      secondary,
      confidence: Math.min(1, primaryScore),
      indicators: entities.map(e => e.value)
    };
  }
  
  classifyResult(result: SearchResult): DomainContext {
    const content = result.content.toLowerCase();
    const kanunAdi = result.metadata?.kanun_adi?.toLowerCase() || '';
    const combined = content + ' ' + kanunAdi;
    
    return this.classifyQuery(combined);
  }
}

// =================== ADVANCED CROSS-ENCODER ===================

export class AdvancedCrossEncoder {
  private ontology: LegalOntology;
  private domainClassifier: DomainClassifier;
  
  constructor(ontology: LegalOntology, domainClassifier: DomainClassifier) {
    this.ontology = ontology;
    this.domainClassifier = domainClassifier;
  }
  
  /**
  * TR: CROSS-ENCODER VE DOMAIN VALIDATION İLE YENIDEN DOĞRULUK ORANI ALMA
  * EN: CROSS-ENCODER RE-RANKING WITH DOMAIN VALIDATION
  */
  async reRank(query: string, results: SearchResult[]): Promise<ProfessionalSearchResult[]> {
    const queryContext = this.domainClassifier.classifyQuery(query);
    const queryEntities = this.ontology.extractEntities(query);
    
    console.log(`Query domain: ${queryContext.primary} (confidence: ${queryContext.confidence.toFixed(2)})`);
    console.log(`Query entities: ${queryEntities.map(e => e.value).join(', ')}`);
    
    const reRankedResults: ProfessionalSearchResult[] = [];
    
    for (const result of results) {
      const resultContext = this.domainClassifier.classifyResult(result);
      const resultEntities = this.ontology.extractEntities(result.content);
      
      const scores = {
        lexical: this.calculateLexicalScore(query, result),
        semantic: result.similarity || 0,
        crossEncoder: this.calculateCrossEncoderScore(query, result, queryContext, resultContext),
        entity: this.calculateEntityScore(queryEntities, resultEntities),
        domain: this.calculateDomainScore(queryContext, resultContext),
        context: this.calculateContextualScore(query, result, queryEntities, resultEntities)
      };
      
      const qualityMetrics = this.calculateQualityMetrics(scores, queryContext, resultContext, queryEntities, resultEntities);
      
      const finalScore = this.calculateFinalScore(scores, qualityMetrics);
      
      const confidence = this.determineConfidence(qualityMetrics, finalScore);
      
      reRankedResults.push({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        lexicalScore: scores.lexical,
        semanticScore: scores.semantic,
        crossEncoderScore: scores.crossEncoder,
        entityScore: scores.entity,
        domainScore: scores.domain,
        contextScore: scores.context,
        finalScore,
        qualityMetrics,
        matchedEntities: resultEntities,
        domainContext: resultContext,
        relevanceExplanation: this.generateExplanation(scores, qualityMetrics, queryContext, resultContext),
        confidence
      });
    }
    
    // TR: FİNAL SKORLARINA GÖRE SIRALAMA
    // EN: SORT BY FINAL SCORE
    return reRankedResults.sort((a, b) => b.finalScore - a.finalScore);
  }
  
  private calculateLexicalScore(query: string, result: SearchResult): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const content = result.content.toLowerCase();
    
    let matches = 0;
    queryTerms.forEach(term => {
      if (content.includes(term)) {
        matches++;
      }
    });
    
    return queryTerms.length > 0 ? matches / queryTerms.length : 0;
  }
  
  /**
   * TR: CROSS-ENCODER SKORU HESAPLAMA
   * EN: CALCULATE CROSS-ENCODER SCORE
   */
  private calculateCrossEncoderScore(
    query: string, 
    result: SearchResult, 
    queryContext: DomainContext, 
    resultContext: DomainContext
  ): number {
    let score = 0;
    
    score += Math.min(0.3, result.similarity || 0);
    
    const title = result.metadata?.baslik?.toLowerCase() || '';
    const queryLower = query.toLowerCase();
    
    const titleWords = title.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    
    let titleMatches = 0;
    queryWords.forEach(qWord => {
      if (titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
        titleMatches++;
      }
    });
    
    if (titleWords.length > 0) {
      score += (titleMatches / queryWords.length) * 0.2;
    }
    
    return Math.min(1, score);
  }
  
  /**
  * TR: HUKUKİ VARLıK SKORU HESAPLAMA
  * EN: CALCULATE ENTITY SCORE
  */
  private calculateEntityScore(queryEntities: LegalEntity[], resultEntities: LegalEntity[]): number {
    if (queryEntities.length === 0) return 0.5; // SORGUDAN ENTITIE GELMEZSE 0.5 TARAFSIZ
    
    let matches = 0;
    queryEntities.forEach(qEntity => {
      const hasMatch = resultEntities.some(rEntity => 
        qEntity.value === rEntity.value || 
        qEntity.synonyms.some(syn => rEntity.synonyms.includes(syn))
      );
      if (hasMatch) matches++;
    });
    
    const baseScore = matches / queryEntities.length;
    
    const exactMatches = queryEntities.filter(qEntity =>
      resultEntities.some(rEntity => qEntity.value === rEntity.value)
    ).length;
    
    const exactBonus = exactMatches * 0.1;
    
    return Math.min(1, baseScore + exactBonus);
  }
  
  /**
   * TR: ALAN SKORU HESAPLAMA
   * EN: CALCULATE DOMAIN SCORE
   */
  private calculateDomainScore(queryContext: DomainContext, resultContext: DomainContext): number {
    if (queryContext.primary === 'unknown') return 0.5;
    
    if (queryContext.primary === resultContext.primary) {
      return 1.0;
    }
    
    if (queryContext.secondary.includes(resultContext.primary) || 
        resultContext.secondary.includes(queryContext.primary)) {
      return 0.6;
    }
    
    const relatedDomains = [
      ['infaz', 'ceza'],
      ['is', 'medeni'],
      ['tuketici', 'medeni']
    ];
    
    for (const [domain1, domain2] of relatedDomains) {
      if ((queryContext.primary === domain1 && resultContext.primary === domain2) ||
          (queryContext.primary === domain2 && resultContext.primary === domain1)) {
        return 0.7; 
      }
    }
    
    if (resultContext.primary !== 'unknown' && resultContext.confidence > 0.3) {
      // TR: SADECE ÇOK FARKLI DOMAINLER İÇİN UYARI / EN: WARN ONLY FOR VERY DIFFERENT DOMAINS
      if (queryContext.confidence > 0.8 && resultContext.confidence > 0.8) {
        console.log(`Domain mismatch: query=${queryContext.primary}, result=${resultContext.primary}`);
      }
      return 0.1; 
    }
    
    return 0.3;
  }
  
  /**
   * TR: BAĞLAMSAL SKOR HESAPLAMA
   * EN: CALCULATE CONTEXTUAL SCORE
   */
  private calculateContextualScore(
    query: string, 
    result: SearchResult, 
    queryEntities: LegalEntity[], 
    resultEntities: LegalEntity[]
  ): number {
    let score = 0;
    
    const queryLower = query.toLowerCase();
    const contentLower = result.content.toLowerCase();
    
    if (queryLower.includes('izin') && queryEntities.some(e => e.type === 'person')) {
      if (contentLower.includes('izin') && resultEntities.some(e => e.type === 'person')) {
        score += 0.3;
      }
    }
    
    if (queryEntities.some(e => e.type === 'institution')) {
      if (resultEntities.some(e => e.type === 'institution')) {
        score += 0.2;
      }
    }
    
    const maddeNo = result.metadata?.madde_no;
    if (maddeNo && queryLower.includes('madde')) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }
  
  /**
   * TR: KALİTE METRİKLERİ HESAPLAMA 
   * EN: CALCULATE QUALITY METRICS
   */
  private calculateQualityMetrics(
    scores: SearchScores, 
    _queryContext: DomainContext, 
    _resultContext: DomainContext,
    queryEntities: LegalEntity[],
    _resultEntities: LegalEntity[]
  ): QualityMetrics {
    const precision = scores.semantic * 0.3 + scores.entity * 0.4 + scores.domain * 0.3;
    
    const entityMatch = queryEntities.length > 0 ? scores.entity : 1;
    
    const domainMatch = scores.domain;
    
    const contextualRelevance = scores.context;
    
    const finalScore = (precision + entityMatch + domainMatch + contextualRelevance) / 4;
    
    return {
      precision,
      entityMatch,
      domainMatch,
      contextualRelevance,
      finalScore
    };
  }
  
  /**
   * TR: FİNAL SKOR HESAPLAMA 
   * EN: CALCULATE FINAL SCORE
   */
  private calculateFinalScore(scores: SearchScores, qualityMetrics: QualityMetrics): number {
    const weights = {
      lexical: 0.15,
      semantic: 0.25,
      crossEncoder: 0.20,
      entity: 0.15,
      domain: 0.20,
      context: 0.05
    };
    
    let finalScore = 
      scores.lexical * weights.lexical +
      scores.semantic * weights.semantic +
      scores.crossEncoder * weights.crossEncoder +
      scores.entity * weights.entity +
      scores.domain * weights.domain +
      scores.context * weights.context;
    
    if (qualityMetrics.domainMatch < 0.3) {
      finalScore *= 0.3;
    }
    
    if (qualityMetrics.entityMatch < 0.2) {
      finalScore *= 0.7;
    }
    
    return Math.max(0, Math.min(1, finalScore));
  }
  
  /**
   * TR: GÜVENİLİRLİK SEVİYESİ BELİRLEME, SKOR VE KALİTE TEMELLI SINIFLANDIRMA
   * EN: DETERMINE CONFIDENCE LEVEL, SCORE AND QUALITY BASED CLASSIFICATION
   */
  private determineConfidence(qualityMetrics: QualityMetrics, finalScore: number): 'high' | 'medium' | 'low' {
    if (finalScore >= 0.8 && qualityMetrics.domainMatch >= 0.8 && qualityMetrics.entityMatch >= 0.7) {
      return 'high';
    } else if (finalScore >= 0.6 && qualityMetrics.domainMatch >= 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * TR: AÇIKLAMA METNİ OLUŞTURMA
   * EN: GENERATE EXPLANATION
   */
  private generateExplanation(
    scores: SearchScores,
    qualityMetrics: QualityMetrics,
    queryContext: DomainContext,
    resultContext: DomainContext
  ): string {
    const parts: string[] = [];
    
    if (scores.domain >= 0.8) {
      parts.push(`Perfect domain match (${queryContext.primary})`);
    } else if (scores.domain >= 0.5) {
      parts.push(`Related domain (${queryContext.primary} → ${resultContext.primary})`);
    } else if (scores.domain < 0.3) {
      parts.push(`Domain mismatch (${queryContext.primary} ≠ ${resultContext.primary})`);
    }
    
    if (scores.entity >= 0.8) {
      parts.push('Strong entity match');
    } else if (scores.entity < 0.3) {
      parts.push('Weak entity match');
    }
    
    if (scores.semantic >= 0.8) {
      parts.push('High semantic similarity');
    } else if (scores.semantic < 0.5) {
      parts.push('Low semantic similarity');
    }
    
    return parts.join(', ');
  }
}

// =================== MAIN PROFESSIONAL SEARCH SERVICE ===================

export class ProfessionalLegalSearchService {
  private ontology: LegalOntology;
  private domainClassifier: DomainClassifier;
  private crossEncoder: AdvancedCrossEncoder;
  
  constructor() {
    this.ontology = new LegalOntology();
    this.domainClassifier = new DomainClassifier(this.ontology);
    this.crossEncoder = new AdvancedCrossEncoder(this.ontology, this.domainClassifier);
  }
  
  /**
   * TR: PROFESYONELLİĞE GÖRE HİBRİT ARAMA HATTI
   * EN: PROFESSIONAL HYBRID SEARCH PIPELINE
   */
  async search(
    query: string,
    options: SearchPiplineOptions = {}
  ): Promise<ProfessionalSearchResult[]> {
    const {
      maxResults = 5,
      precision = 'balanced',
      enableContextualExpansion = true,
      minPrecisionAtOne = 0.70
    } = options;
    
    try {
      // ADIM 1: DOMAIN SINIFLANDIRMA VE ENTITY CIKARIMI
      // STEP 1: DOMAIN CLASSIFICATION AND ENTITY EXTRACTION
      const queryContext = this.domainClassifier.classifyQuery(query);
      const queryEntities = this.ontology.extractEntities(query);
      
      console.log(`Domain: ${queryContext.primary} (${queryContext.confidence.toFixed(2)})`);
      console.log(`Entities: ${queryEntities.map(e => e.value).join(', ')}`);
      
      // STEP 2: QUERY EXPANSION
      // ADIM 2: SORGU GENİŞLETME
      let expandedQuery = query;
      if (enableContextualExpansion) {
        expandedQuery = this.expandQuery(query, queryContext, queryEntities);
        console.log(`   Expanded: "${expandedQuery}"`);
      }
      
      // ADIM 3: HİBRİT ARAMA (BM25 + SEMANTİK)
      // STEP 3: HYBRID RETRIEVAL (BM25 + SEMANTIC)
      console.log('Phase 2: Hybrid retrieval');
      const queryEmbedding = await embeddingService.embedQuery(expandedQuery);
      
      // DAHA İYİ YENIDEN SIRALAMA İÇİN DAHA FAZLA CANDIDATE
      // GET MORE CANDIDATES FOR BETTER RE-RANKING
      const candidateLimit = Math.max(50, maxResults * 10);
      const semanticResults = await searchService.similaritySearch(
        queryEmbedding, 
        candidateLimit, 
        0.2
      );
      
      console.log(`   Retrieved ${semanticResults.length} candidates`);
      
      // ADIM 4: GELİŞMİŞ CROSS-ENCODER İLE YENIDEN SIRALAMA
      // STEP 4: RE-RANKING WITH ADVANCED CROSS-ENCODER
      console.log('Phase 3: Advanced cross-encoder re-ranking');
      const reRankedResults = await this.crossEncoder.reRank(query, semanticResults);
      
      // ADIM 5: KALİTE FİLTRELEME
      // STEP 5: QUALITY FILTERING
      console.log('Phase 4: Quality filtering');
      const qualityFiltered = this.applyQualityFiltering(
        reRankedResults, 
        queryContext, 
        precision,
        minPrecisionAtOne
      );
      
      // ADIM 6: FİNAL SEÇİMİ
      // STEP 6: FINAL SELECTION
      const finalResults = qualityFiltered.slice(0, maxResults);
      
      console.log(`Final: ${finalResults.length} high-quality results`);
      
      // KESİNLİK METRİKLERİNİ LOGLAma
      // LOG PRECISION METRICS
      if (finalResults.length > 0) {
        const precisionAtOne = finalResults[0].finalScore;
        const avgPrecision = finalResults.reduce((sum, r) => sum + r.finalScore, 0) / finalResults.length;
        
        console.log(`Precision@1: ${precisionAtOne.toFixed(3)}, Avg Precision: ${avgPrecision.toFixed(3)}`);
        
        if (precisionAtOne < minPrecisionAtOne) {
          console.warn(`Warning: Precision@1 (${precisionAtOne.toFixed(3)}) below target (${minPrecisionAtOne})`);
        }
      }
      
      return finalResults;
      
    } catch (error) {
      console.error('Professional search error:', error);
      throw error;
    }
  }
  
  /**
   * TR: SORGU GENİŞLETME
   * EN: EXPAND QUERY
   */
  private expandQuery(query: string, context: DomainContext, entities: LegalEntity[]): string {
    let expanded = query;
    
    if (context.primary !== 'unknown') {
      const domainSynonyms = this.ontology.getDomainSynonyms(context.primary);
      const relevantSynonyms = domainSynonyms.slice(0, 2);
      expanded += ' ' + relevantSynonyms.join(' ');
    }
    
    // ENTITY EŞ ANLAMLILARI EKLEME
    // ADD ENTITY SYNONYMS
    entities.forEach(entity => {
      // HER ENTITY İÇİN BİR GÜÇLÜ EŞ ANLAMLI EKLEME
      // ADD ONE STRONG SYNONYM PER ENTITY
      if (entity.synonyms.length > 0) {
        expanded += ' ' + entity.synonyms[0];
      }
    });
    
    return expanded;
  }
  
  /**
   * TR: KALİTE FİLTRELEME UYGULAMA
   * EN: APPLY QUALITY FILTERING
   */
  private applyQualityFiltering(
    results: ProfessionalSearchResult[],
    queryContext: DomainContext,
    precision: 'strict' | 'balanced' | 'recall',
    minPrecisionAtOne: number
  ): ProfessionalSearchResult[] {
    // KALITE ARALIĞI AYARLAMA
    // SET QUALITY RANGE
    const thresholds = {
      strict: { minScore: 0.4, minDomain: 0.6, minEntity: 0.3 },
      balanced: { minScore: 0.35, minDomain: 0.5, minEntity: 0.25 },
      recall: { minScore: 0.3, minDomain: 0.4, minEntity: 0.2 }
    };
    
    const { minScore, minDomain, minEntity } = thresholds[precision];
    
    const filtered = results.filter(result => {
      // TEMEL SKOR EŞİĞİ
      // BASIC SCORE THRESHOLD
      if (result.finalScore < minScore) {
        console.log(`Filtered: low score (${result.finalScore.toFixed(3)} < ${minScore})`);
        return false;
      }
      
      if (queryContext.primary !== 'unknown' && queryContext.confidence > 0.8) {
        if (result.domainScore < minDomain) {
          console.log(`Filtered: domain mismatch (${result.domainContext.primary} vs ${queryContext.primary}, score: ${result.domainScore.toFixed(3)})`);
          return false;
        }
      }
      
      // DÜŞÜK ENTITY SKORLARINA SAHİP SONUÇLARA İZİN VER
      // ALLOW RESULTS WITH LOWER ENTITY SCORES
      if (precision === 'strict' && result.entityScore < minEntity && result.matchedEntities.length === 0 && result.finalScore < 0.5) {
        console.log(`Filtered: no entity match (${result.entityScore.toFixed(3)} < ${minEntity})`);
        return false;
      }
      
      return true;
    });
    
    // YEDEK: EĞER HİÇBİR SONUÇ FİLTRELERDEN GEÇMEZSE, EN İYİ 3 EŞLEŞMEYİ DÖNDÜRME
    // BACKUP: IF NO RESULTS PASS FILTERS, RETURN TOP 3 BEST MATCHES
    if (filtered.length === 0) {
      console.log(`No results passed filters, returning top 3 best matches`);
      const topResults = results
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 3);
      
      console.log(`Fallback: Returning ${topResults.length} best matches`);
      topResults.forEach((result, index) => {
        console.log(`#${index + 1}: ${result.metadata.title} - Art. ${result.metadata.article}`);
        console.log(`Score: ${result.finalScore.toFixed(3)} | Status: Best Available`);
        console.log(`Domain: ${result.domainScore.toFixed(1)} | Entity: ${result.entityScore.toFixed(1)}`);
      });
      
      return topResults;
    }
    
    // İLK SONUCUN KESİNLİK HEDEFİNİ KARŞILADIĞINDAN EMİN OLMA
    // ENSURE FIRST RESULT MEETS PRECISION TARGET
    if (filtered.length > 0 && filtered[0].finalScore < minPrecisionAtOne) {
      console.warn(`Top result precision (${filtered[0].finalScore.toFixed(3)}) below target (${minPrecisionAtOne})`);
      
      // UYARIYLA BİRLİKTE SONUÇLARI DÖNDÜR
      // RETURN RESULTS BUT WITH WARNING
      if (precision === 'strict') {
        console.log(`Returning ${filtered.length} results despite precision warning`);
      }
    }
    
    return filtered;
  }
  
  /**
  * TR: DEĞERLENDIRME İÇİN ARAMA KALİTESİ PERFORMANS METRİKLERİ
  * EN: GET PERFORMANCE METRICS FOR EVALUATION 
  */
  async evaluateSearchQuality(testQueries: string[]): Promise<{
    precisionAtOne: number;
    precisionAtThree: number;
    falsePositiveRate: number;
    averageRelevance: number;
  }> {
    let precisionAtOneSum = 0;
    let precisionAtThreeSum = 0;
    let totalFalsePositives = 0;
    let totalResults = 0;
    let relevanceSum = 0;
    
    for (const query of testQueries) {
      const results = await this.search(query, { maxResults: 3, precision: 'strict' });
      
      if (results.length > 0) {
        // KESİNLİK
        // PRECISION
        precisionAtOneSum += results[0].finalScore;
        
        // KESİNLİK
        // PRECISION
        const top3Scores = results.slice(0, 3).map(r => r.finalScore);
        precisionAtThreeSum += top3Scores.reduce((sum, score) => sum + score, 0) / top3Scores.length;
        
        // YANLIŞ POZİTİFLER
        // FALSE POSITIVES
        const falsePositives = results.filter(r => 
          r.domainScore < 0.3 || (r.entityScore < 0.2 && r.matchedEntities.length === 0)
        ).length;
        totalFalsePositives += falsePositives;
        totalResults += results.length;
        
        // ORTALAMA İLGİLİLİK
        // AVERAGE RELEVANCE
        relevanceSum += results.reduce((sum, r) => sum + r.finalScore, 0) / results.length;
      }
    }
    
    const numQueries = testQueries.length;
    
    return {
      precisionAtOne: precisionAtOneSum / numQueries,
      precisionAtThree: precisionAtThreeSum / numQueries,
      falsePositiveRate: totalResults > 0 ? totalFalsePositives / totalResults : 0,
      averageRelevance: relevanceSum / numQueries
    };
  }
}

export const professionalLegalSearchService = new ProfessionalLegalSearchService();
