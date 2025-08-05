import { NextResponse } from 'next/server';
import { embeddingService } from '../../../lib/embedding';
import { supabase } from '../../../lib/supabase';

export async function POST() {
  try {
    // TR: EMBEDDING ÜRETİM TESTİ
    // EN: TEST EMBEDDING GENERATION
    const testQuery = "murder";
    const queryEmbedding = await embeddingService.embedQuery(testQuery);
    
    // TR: VERİTABANINDAN ÖRNEK VERİ ALMA
    // EN: GET A SAMPLE DATA FROM SUPABASE
    const { data: sampleData, error } = await supabase
      .from('law_chunks')
      .select('id, content, embedding')
      .limit(1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!sampleData || sampleData.length === 0) {
      throw new Error('No data found in database');
    }

    const sample = sampleData[0];
    
    let dbEmbedding;
    try {
      dbEmbedding = typeof sample.embedding === 'string' 
        ? JSON.parse(sample.embedding) 
        : sample.embedding;
    } catch {
      dbEmbedding = sample.embedding;
    }

    function cosineSimilarity(a: number[], b: number[]): number {
      if (a.length !== b.length) return 0;
      
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    const similarity = cosineSimilarity(queryEmbedding, dbEmbedding);

    return NextResponse.json({
      success: true,
      testQuery,
      queryEmbedding: {
        dimensions: queryEmbedding.length,
        first5Values: queryEmbedding.slice(0, 5),
        type: typeof queryEmbedding[0]
      },
      dbSample: {
        id: sample.id,
        content: sample.content.substring(0, 100) + "...",
        embedding: {
          dimensions: Array.isArray(dbEmbedding) ? dbEmbedding.length : 'Not array',
          first5Values: Array.isArray(dbEmbedding) ? dbEmbedding.slice(0, 5) : 'N/A',
          type: typeof dbEmbedding,
          rawType: typeof sample.embedding
        }
      },
      manualSimilarity: similarity,
      diagnosis: {
        dimensionsMatch: queryEmbedding.length === (Array.isArray(dbEmbedding) ? dbEmbedding.length : 0),
        bothAreArrays: Array.isArray(queryEmbedding) && Array.isArray(dbEmbedding),
        similarityReasonable: similarity > 0.1
      }
    });

  } catch (error: unknown) {
    console.error('Embedding test error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
