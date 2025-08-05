// TR: GELİŞMİŞ PROFESYONEL ARAMA İÇİN TEST API'si
// EN: TEST ENDPOINT FOR ENHANCED PROFESSIONAL SEARCH FUNCTIONALLY

import { NextRequest, NextResponse } from 'next/server';
import { professionalLegalSearchService } from '../../../lib/professionalLegalSearch';

export async function POST(req: NextRequest) {
  try {
    const { query = "Çocuk eğitimevinde hükümlü izni" } = await req.json();
    
    console.log(`Testing enhanced professional search for: "${query}"`);
    
    // 0.65 - 0.621
    const results = await professionalLegalSearchService.search(query, {
      maxResults: 5,
      precision: 'strict',
      enableEntityExtraction: true,
      enableDomainValidation: true,
      enableContextualExpansion: true,
      minPrecisionAtOne: 0.8
    });
    
    console.log(`Professional search returned ${results.length} results`);
    
    const qualityAnalysis = {
      totalResults: results.length,
      averageScore: results.length > 0 ? 
        results.reduce((sum, r) => sum + r.finalScore, 0) / results.length : 0,
      precisionAtOne: results.length > 0 ? results[0].finalScore : 0,
      domainAccuracy: results.length > 0 ? 
        results.filter(r => r.domainScore > 0.7).length / results.length : 0,
      entityMatchRate: results.length > 0 ? 
        results.filter(r => r.entityScore > 0.5 || r.matchedEntities.length > 0).length / results.length : 0
    };
    
    // 0.6 - 0.7
    let qualityGrade = 'F';
    if (qualityAnalysis.precisionAtOne >= 0.65 && qualityAnalysis.domainAccuracy >= 0.6) {
      qualityGrade = 'A+';
    } else if (qualityAnalysis.precisionAtOne >= 0.6 && qualityAnalysis.domainAccuracy >= 0.5) {
      qualityGrade = 'A';
    } else if (qualityAnalysis.precisionAtOne >= 0.55 && qualityAnalysis.domainAccuracy >= 0.4) {
      qualityGrade = 'B';
    } else if (qualityAnalysis.precisionAtOne >= 0.5) {
      qualityGrade = 'C';
    } else if (qualityAnalysis.precisionAtOne >= 0.4) {
      qualityGrade = 'D';
    }
    
    const response = {
      success: true,
      query,
      qualityGrade,
      qualityAnalysis,
      results: results.map(result => ({
        id: result.id,
        content: result.content.substring(0, 300) + '...',
        metadata: {
          madde_no: result.metadata.madde_no,
          baslik: result.metadata.baslik,
          kanun_adi: result.metadata.kanun_adi
        },
        scores: {
          final: Number(result.finalScore.toFixed(3)),
          semantic: Number(result.semanticScore.toFixed(3)),
          domain: Number(result.domainScore.toFixed(3)),
          entity: Number(result.entityScore.toFixed(3)),
          lexical: Number(result.lexicalScore.toFixed(3)),
          crossEncoder: Number(result.crossEncoderScore.toFixed(3)),
          context: Number(result.contextScore.toFixed(3)),
          confidence: result.confidence
        },
        matchedEntities: result.matchedEntities.map(e => e.value),
        domainContext: {
          primary: result.domainContext.primary,
          confidence: result.domainContext.confidence.toFixed(3)
        },
        explanation: result.relevanceExplanation
      })),
      recommendations: qualityGrade === 'A+' ? 
        ['Professional search is working perfectly!'] : 
        qualityGrade === 'A' ? 
        ['Very good results, minor fine-tuning needed'] :
        qualityGrade === 'B' ? 
                ['Good results, but domain matching needs improvement'] :
        qualityGrade === 'C' ? 
                ['Poor results, thresholds need adjustment'] :
        [
          'Critical: Professional search needs major improvements',
          'Suggestion 1: Check if database has relevant legal content',
          'Suggestion 2: Verify entity extraction is working',
          'Suggestion 3: Review domain classification accuracy',
          'Suggestion 4: Consider lowering precision thresholds'
        ]
    };
    
    console.log(`Quality Grade: ${qualityGrade}`);
    console.log(`Precision@1: ${qualityAnalysis.precisionAtOne.toFixed(3)}`);
    console.log(`Domain Accuracy: ${qualityAnalysis.domainAccuracy.toFixed(3)}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Professional search test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: 'Professional search test failed',
      details: errorMessage,
      qualityGrade: 'F',
      recommendations: [
        'Critical Error: Professional search system is not working',
        'Check database connectivity',
        'Verify professional search service initialization',
        'Review error logs for specific issues'
      ],
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
