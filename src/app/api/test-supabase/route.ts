import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { getApiError, getServerTranslation } from '../../../lib/serverTranslations';
import type { Language } from '../../../i18n/translations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') as Language) || 'tr';
  
  try {
    console.log('Testing Supabase connection and getting exact count...');
    
    // TR: SUPABASE BAĞLANTISINI KONTROL ETME VE CHUNK SAYISINI ALMA
    // EN: TEST SUPABASE CONNECTION AND GETTING CHUNK COUNT
    const { count: totalChunks, error: connectionError } = await supabase
      .from('law_chunks')
      .select('*', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Connection error:', connectionError);
      return NextResponse.json({
        success: false,
        error: getApiError('supabaseConnection', lang),
        details: connectionError.message,
        suggestion: getApiError('tableCheck', lang)
      }, { status: 500 });
    }

    // TR: ÖRNEK VERİ ÇEKME
    // EN: GET SAMPLE DATA
    const { data: sampleData, error: sampleError } = await supabase
      .from('law_chunks')
      .select('id, content, metadata')
      .limit(3);

    console.log(`Sample data result: ${sampleData?.length || 0} records, Error: ${sampleError?.message || 'None'}`);

    if (sampleError) {
      console.error('Sample data error:', sampleError);
      return NextResponse.json({
        success: false,
        error: getApiError('dataFetch', lang),
        details: sampleError.message
      }, { status: 500 });
    }

    // TR: EŞLEŞTİRME FONKSİYONU TESTİ
    // EN: TESTING MATCH FUNCTION
    console.log('Testing match_law_chunks function...');
    const { error: functionError } = await supabase.rpc(
      'match_law_chunks',
      {
        query_embedding: new Array(768).fill(0.001),
        match_threshold: 0.5,
        match_count: 1
      }
    );

    return NextResponse.json({
      success: true,
      message: getApiError('connectionSuccessful', lang),
      statistics: {
        totalChunks: totalChunks || 0,
        sampleDataExists: sampleData ? sampleData.length > 0 : false,
        functionWorks: !functionError
      },
      sampleData: sampleData?.slice(0, 2),
      functionError: functionError?.message || null,
      recommendations: sampleData && sampleData.length === 0 ? [
        getApiError('noDataYet', lang),
        getApiError('goToAdmin', lang),
        getApiError('clickReindex', lang)
      ] : [],
      debugInfo: {
        totalChunksFromCount: totalChunks,
        sampleDataLength: sampleData?.length || 0,
        functionErrorDetails: functionError?.message || null
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: getApiError('testError', lang),
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
