// TR: LEGALMATE - GELİŞMİŞ HİBRİT ARAMA API'Sİ
// EN: LEGALMATE - ENHANCED HYBRID SEARCH API

import { NextRequest, NextResponse } from 'next/server';
import { embeddingService } from '../../../lib/embedding';
import { searchService } from '../../../lib/search';
import { hybridSearchService } from '../../../lib/hybridSearch';
import { professionalLegalSearchService } from '../../../lib/professionalLegalSearch';

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      limit = 10, 
      threshold = 0.6,
      useHybrid = true,
      useProfessional = true,
      lexicalWeight = 0.3,
      semanticWeight = 0.4,
      reRankWeight = 0.3,
      enableDomainFilter = true
    } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`Search request: "${query}" (hybrid: ${useHybrid}, professional: ${useProfessional})`);

    if (useProfessional) {
      console.log('Using professional legal search system');
      
      const results = await professionalLegalSearchService.search(query, {
        maxResults: limit,
        precision: 'balanced',
        enableEntityExtraction: true,
        enableDomainValidation: true,
        enableContextualExpansion: true,
        minPrecisionAtOne: 0.4
      });

      const formattedResults = results.map(result => ({
        id: result.id,
        content: result.content,
        similarity: result.finalScore,
        metadata: result.metadata,
        scores: {
          lexical: result.lexicalScore,
          semantic: result.semanticScore,
          crossEncoder: result.crossEncoderScore,
          entity: result.entityScore,
          domain: result.domainScore,
          context: result.contextScore,
          final: result.finalScore
        },
        confidence: result.confidence,
        explanation: result.relevanceExplanation,
        matchedEntities: result.matchedEntities.map(e => e.value),
        domainContext: result.domainContext
      }));

      return NextResponse.json({
        success: true,
        results: formattedResults,
        total: formattedResults.length,
        searchType: 'professional',
        query,
        metrics: {
          averageScore: formattedResults.length > 0 
            ? formattedResults.reduce((sum, r) => sum + r.similarity, 0) / formattedResults.length 
            : 0,
          highConfidenceCount: formattedResults.filter(r => r.confidence === 'high').length
        }
      });
    } else if (useHybrid) {
      console.log('Using hybrid search with domain filtering');
      
      const results = await hybridSearchService.hybridSearch(query, {
        limit,
        lexicalWeight,
        semanticWeight, 
        reRankWeight,
        minThreshold: threshold,
        enableDomainFilter
      });

      const formattedResults = results.map(result => ({
        id: result.id,
        content: result.content,
        similarity: result.finalScore,
        metadata: result.metadata,
        scores: {
          lexical: result.lexicalScore,
          semantic: result.semanticScore,
          reRank: result.reRankScore,
          final: result.finalScore
        },
        matchedKeywords: result.matchedKeywords,
        explanation: result.relevanceExplanation,
        type: 'hybrid'
      }));

      return NextResponse.json({
        success: true,
        query,
        searchType: 'hybrid',
        weights: { lexicalWeight, semanticWeight, reRankWeight },
        results: formattedResults,
        count: formattedResults.length,
        message: `Found ${formattedResults.length} high-quality results using hybrid search`
      });

    } else {
      console.log('Using legacy semantic search with filtering');
      
      const queryEmbedding = await embeddingService.embedQuery(query);
      const legalDomain = detectLegalDomain(query);
      
      const searchOptions = {
        threshold,
        limit,
        legalDomain,
        excludeKeywords: getExcludeKeywords(query),
        requireKeywords: getRequireKeywords(query)
      };

      const results = await searchService.searchWithFiltering(
        queryEmbedding,
        query,
        searchOptions
      );

      return NextResponse.json({
        success: true,
        query,
        searchType: 'semantic-filtered',
        detectedDomain: legalDomain,
        results,
        count: results.length,
        message: `Found ${results.length} results using filtered semantic search`
      });
    }

  } catch (error: unknown) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function detectLegalDomain(query: string): string | undefined {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('hükümlü') || queryLower.includes('ceza') || queryLower.includes('eğitimevi') || 
      queryLower.includes('infaz') || queryLower.includes('hapishane') || queryLower.includes('denetimli')) {
    return 'ceza';
  }
  
  if (queryLower.includes('işçi') || queryLower.includes('iş sözleşmesi') || queryLower.includes('çalışma') ||
      queryLower.includes('ücret') || queryLower.includes('mesai') || queryLower.includes('izin')) {
    return 'iş';
  }
  
  if (queryLower.includes('evlilik') || queryLower.includes('miras') || queryLower.includes('mülkiyet') ||
      queryLower.includes('aile') || queryLower.includes('velayet')) {
    return 'medeni';
  }
  
  if (queryLower.includes('gümrük') || queryLower.includes('ithalat') || queryLower.includes('ihracat')) {
    return 'gümrük';
  }
  
  return undefined;
}

function getExcludeKeywords(query: string): string[] {
  const queryLower = query.toLowerCase();
  const excludeKeywords: string[] = [];
  
  if (queryLower.includes('hükümlü') || queryLower.includes('ceza') || queryLower.includes('eğitimevi')) {
    excludeKeywords.push('gümrük', 'ithalat', 'ihracat', 'ticaret', 'ücret');
  }
  
  if (queryLower.includes('işçi') || queryLower.includes('iş sözleşmesi')) {
    excludeKeywords.push('hükümlü', 'ceza', 'hapis');
  }
  
  return excludeKeywords;
}

function getRequireKeywords(query: string): string[] {
  const queryLower = query.toLowerCase();
  const requireKeywords: string[] = [];
  
  if (queryLower.includes('eğitimevi')) {
    requireKeywords.push('eğitim', 'çocuk', 'kurum');
  }
  
  if (queryLower.includes('hükümlü')) {
    requireKeywords.push('hükümlü', 'mahkum', 'infaz');
  }
  
  return requireKeywords;
}
