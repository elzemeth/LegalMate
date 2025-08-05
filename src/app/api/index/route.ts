// TR: HUKUKİ BELGELERİ EMBEDDİNG İLE İŞLEMEK VE DEPOLAMAK İÇİN İNDEKSLEME API'Sİ
// EN: DOCUMENT PROCESSING AND VECTOR INDEXING FOR LEGAL DATABASE
import { NextRequest, NextResponse } from 'next/server';
import { embeddingService, LawArticle } from '../../../lib/embedding';
import { searchService } from '../../../lib/search';
import { loadAllLawArticles, getLawFilesInfo, getBasicLawFilesInfo } from '../../../lib/lawLoader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'stats';

    if (action === 'stats') {
      const stats = await searchService.getIndexStats();
      return NextResponse.json({
        success: true,
        stats
      });

    } else if (action === 'files') {
      try {
        console.log('Getting law files info...');
        const filesInfo = getLawFilesInfo();
        const totalArticles = filesInfo.reduce((sum, file) => sum + file.totalArticles, 0);
        
        return NextResponse.json({
          success: true,
          files: filesInfo,
          summary: {
            totalFiles: filesInfo.length,
            totalArticles,
            uniqueLaws: [...new Set(filesInfo.map(f => f.displayName))].length
          }
        });
      } catch (fileError) {
        console.error('Error getting files info:', fileError);
        return NextResponse.json({
          success: false,
          error: 'Failed to load law files information',
          details: fileError instanceof Error ? fileError.message : 'Unknown error'
        }, { status: 500 });
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "stats" or "files" for GET requests' },
        { status: 400 }
      );
    }

  } catch (error: unknown) {
    console.error('GET request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Request failed', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action = 'index', clearFirst = false } = await req.json();

    if (action === 'index') {
      // TR: İSTENİRSE MEVCUT VERİYİ TEMİZLE
      // EN: OPTIONAL DATA CLEARING BEFORE REINDEXING
      if (clearFirst) {
        console.log('Clearing existing chunks...');
        await searchService.clearAllChunks();
      }

      console.log('Starting indexing process...');
      
      // TR: TÜM JSON DOSYALARINDAN KANUN MADDELERİNİ YÜKLE
      // EN: LOAD ARTICLES FROM ALL LEGAL JSON FILES
      console.log('Loading articles from all law files...');
      const validArticles = loadAllLawArticles();

      console.log(`Found ${validArticles.length} valid articles to process from all law files`);

      let totalChunks = 0;
      let processedArticles = 0;
      const lawStats = new Map<string, number>();

      const batchSize = 10;
      for (let i = 0; i < validArticles.length; i += batchSize) {
        const batch = validArticles.slice(i, i + batchSize);
        
        for (const article of batch) {
          try {
            console.log(`Processing article ${article.madde_no} from ${article.kanun_adi}`);
            
            const chunks = await embeddingService.processLawArticle(article);
            
            if (chunks.length > 0) {
              await searchService.insertChunks(chunks);
              totalChunks += chunks.length;
              processedArticles++;
              
              const currentCount = lawStats.get(article.kanun_adi) || 0;
              lawStats.set(article.kanun_adi, currentCount + 1);
              
              console.log(`✓ Processed article ${article.madde_no} from ${article.kanun_adi}: ${chunks.length} chunks`);
            } else {
              console.log(`Skipped article ${article.madde_no} from ${article.kanun_adi}: no valid chunks`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error processing article ${article.madde_no}:`, error);
          }
        }
        
        console.log(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validArticles.length / batchSize)}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Indexing completed',
        stats: {
          totalArticles: validArticles.length,
          processedArticles,
          totalChunks,
          skippedArticles: validArticles.length - processedArticles,
          lawBreakdown: Object.fromEntries(lawStats),
          filesProcessed: getBasicLawFilesInfo().length
        }
      });

    } else if (action === 'stats') {
      const stats = await searchService.getIndexStats();
      return NextResponse.json({
        success: true,
        stats
      });

    } else if (action === 'files') {
      const filesInfo = getLawFilesInfo();
      const totalArticles = filesInfo.reduce((sum, file) => sum + file.totalArticles, 0);
      
      return NextResponse.json({
        success: true,
        files: filesInfo,
        summary: {
          totalFiles: filesInfo.length,
          totalArticles,
          uniqueLaws: [...new Set(filesInfo.map(f => f.displayName))].length
        }
      });

    } else if (action === 'clear') {
      await searchService.clearAllChunks();
      return NextResponse.json({
        success: true,
        message: 'All chunks cleared'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "index", "stats", "files", or "clear"' },
        { status: 400 }
      );
    }

  } catch (error: unknown) {
    console.error('Indexing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Indexing failed', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
