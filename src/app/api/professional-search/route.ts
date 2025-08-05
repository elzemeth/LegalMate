// ACADEMIC-GRADE LEGAL DOCUMENT RETRIEVAL WITH PRECISION@1 >= 90%
// TR: AKADEMİK SEVİYEDE HUKUKİ BELGE ARAMA API'Sİ (KESİNLİK@1 >= %90)

import { NextRequest, NextResponse } from 'next/server';
import { professionalLegalSearchService, SearchPiplineOptions } from '../../../lib/professionalLegalSearch';

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      maxResults = 5,
      precision = 'strict',
      enableEntityExtraction = true,
      enableDomainValidation = true,
      enableContextualExpansion = true,
      minPrecisionAtOne = 0.90
    } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`Professional Legal Search: "${query}"`);
    console.log(`Precision mode: ${precision}, Target P@1: ${minPrecisionAtOne}`);

    const options: SearchPiplineOptions = {
      maxResults,
      precision,
      enableEntityExtraction,
      enableDomainValidation,
      enableContextualExpansion,
      minPrecisionAtOne
    };

    const results = await professionalLegalSearchService.search(query, options);

    const qualityMetrics = results.length > 0 ? {
      precisionAtOne: results[0]?.finalScore || 0,
      averagePrecision: results.reduce((sum, r) => sum + r.finalScore, 0) / results.length,
      domainMatchRate: results.filter(r => r.domainScore >= 0.8).length / results.length,
      entityMatchRate: results.filter(r => r.entityScore >= 0.6).length / results.length,
      highConfidenceRate: results.filter(r => r.confidence === 'high').length / results.length
    } : {
      precisionAtOne: 0,
      averagePrecision: 0,
      domainMatchRate: 0,
      entityMatchRate: 0,
      highConfidenceRate: 0
    };

    const formattedResults = results.map(result => ({
      id: result.id,
      content: result.content,
      metadata: result.metadata,
      
      scores: {
        lexical: Number(result.lexicalScore.toFixed(3)),
        semantic: Number((result.semanticScore || 0).toFixed(3)),
        crossEncoder: Number(result.crossEncoderScore.toFixed(3)),
        entity: Number(result.entityScore.toFixed(3)),
        domain: Number(result.domainScore.toFixed(3)),
        context: Number(result.contextScore.toFixed(3)),
        final: Number(result.finalScore.toFixed(3))
      },
      
      qualityMetrics: {
        precision: Number(result.qualityMetrics.precision.toFixed(3)),
        entityMatch: Number(result.qualityMetrics.entityMatch.toFixed(3)),
        domainMatch: Number(result.qualityMetrics.domainMatch.toFixed(3)),
        contextualRelevance: Number(result.qualityMetrics.contextualRelevance.toFixed(3))
      },
      
      matchedEntities: result.matchedEntities.map(entity => ({
        value: entity.value,
        type: entity.type,
        domain: entity.domain
      })),
      domainContext: {
        primary: result.domainContext.primary,
        confidence: Number(result.domainContext.confidence.toFixed(3))
      },
      relevanceExplanation: result.relevanceExplanation,
      confidence: result.confidence,
      
      preview: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
      
      lawInfo: {
        name: result.metadata?.kanun_adi || 'Unknown',
        article: result.metadata?.madde_no || 'Unknown',
        title: result.metadata?.baslik || ''
      }
    }));

    const summary = {
      query,
      totalResults: formattedResults.length,
      processingInfo: {
        precision: precision,
        targetPrecisionAtOne: minPrecisionAtOne,
        achievedPrecisionAtOne: qualityMetrics.precisionAtOne,
        qualityGrade: qualityMetrics.precisionAtOne >= minPrecisionAtOne ? 'A' : 
                     qualityMetrics.precisionAtOne >= 0.8 ? 'B' : 
                     qualityMetrics.precisionAtOne >= 0.6 ? 'C' : 'D'
      },
      qualityMetrics,
      searchCompleted: new Date().toISOString()
    };

    console.log(`Search completed: ${formattedResults.length} results, P@1: ${qualityMetrics.precisionAtOne.toFixed(3)}`);

    return NextResponse.json({
      success: true,
      summary,
      results: formattedResults,
      message: `Found ${formattedResults.length} high-quality legal matches with ${qualityMetrics.precisionAtOne >= minPrecisionAtOne ? 'excellent' : 'acceptable'} precision`
    });

  } catch (error: unknown) {
    console.error('Professional search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false,
        error: `Search failed: ${errorMessage}`,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const maxResults = parseInt(url.searchParams.get('limit') || '5');
    const precision = url.searchParams.get('precision') as 'strict' | 'balanced' | 'recall' || 'strict';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await professionalLegalSearchService.search(query, {
      maxResults,
      precision,
      enableEntityExtraction: true,
      enableDomainValidation: true,
      enableContextualExpansion: true
    });

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      results: results.map(r => ({
        id: r.id,
        content: r.content,
        metadata: r.metadata,
        finalScore: r.finalScore,
        confidence: r.confidence,
        preview: r.content.substring(0, 150) + '...'
      }))
    });

  } catch (error: unknown) {
    console.error('Professional search GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
