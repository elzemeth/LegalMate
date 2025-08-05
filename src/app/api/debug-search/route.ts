import { NextRequest, NextResponse } from 'next/server';
import { embeddingService } from '../../../lib/embedding';
import { searchService } from '../../../lib/search';
import { supabase } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { query = "test", threshold = 0.1 } = await req.json();

    console.log(`Debug search for: "${query}" with threshold: ${threshold}`);

    const queryEmbedding = await embeddingService.embedQuery(query);
    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);

    const results = await searchService.similaritySearch(queryEmbedding, 10, threshold);
    
    const stats = await searchService.getIndexStats();

    const { data: rawData, error } = await supabase
      .from('law_chunks')
      .select('id, content, metadata')
      .limit(3);

    return NextResponse.json({
      success: true,
      query,
      threshold,
      results: results.map(r => ({
        id: r.id,
        content: r.content.substring(0, 100) + "...",
        similarity: r.similarity,
        metadata: r.metadata
      })),
      stats,
      rawSampleData: rawData?.map((d: { id: string; content: string; metadata: Record<string, unknown> }) => ({
        id: d.id,
        content: d.content.substring(0, 100) + "...",
        metadata: d.metadata
      })),
      embeddingDimensions: queryEmbedding.length,
      databaseError: error?.message || null
    });

  } catch (error: unknown) {
    console.error('Debug search error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
