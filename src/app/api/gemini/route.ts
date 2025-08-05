// TR: AI ANALİZİ İLE HUKUKİ SORGU İŞLEME İÇİN ANA API ENDPOINT'İ
// EN: PROCESSES LEGAL QUESTIONS USING SEMANTIC SEARCH AND AI ANALYSIS
import { GoogleGenerativeAI } from "@google/generative-ai";
import { embeddingService } from "../../../lib/embedding";
import { searchService } from "../../../lib/search";
import { translationService } from "../../../lib/translation";
import { getApiError } from "../../../lib/serverTranslations";
import type { Language } from "../../../i18n/translations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const lang = (body.lang as Language) || 'tr';

    if (!prompt) {
      return new Response(JSON.stringify({ error: getApiError('promptEmpty', lang) }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log("Original query:", prompt);

    // TR: ARAMA İÇİN SORGUYU İŞLE (GEREKİRSE TÜRKÇE'YE ÇEVİR)
    // EN: PROCESS QUERY FOR SEARCH (TRANSLATE TO TURKISH IF NEEDED)
    const { searchQuery, originalQuery, wasTranslated } = await translationService.processQueryForSearch(prompt);
    
    if (wasTranslated) {
      console.log("Translated query for search:", searchQuery);
    }

    // TR: İLGİLİ KANUN MADDELERİNİ BULMAK İÇİN SEMANTİK ARAMA YAP
    // EN: PERFORM SEMANTIC SEARCH TO FIND RELEVANT LAW ARTICLES
    let searchResults: Array<{
      id: string;
      content: string;
      metadata: {
        madde_no: string;
        baslik: string;
        kanun_adi: string;
        chunk_index: number;
        total_chunks: number;
      };
      similarity: number;
    }> = [];
    let context = "";
    
    try {
      // TR: PROFESYONEL HUKUK ARAMA SİSTEMİ İLE ARAMA YAP
      // EN: USE PROFESSIONAL LEGAL SEARCH SYSTEM FOR HIGH-QUALITY RESULTS
      console.log('Using Professional Legal Search System');
      
      // TR: PROFESYONEL ARAMA SERVİSİNİ IMPORT ETME
      // EN: IMPORT PROFESSIONAL SEARCH SERVICE
      const { professionalLegalSearchService } = await import('../../../lib/professionalLegalSearch');
      
      const professionalResults = await professionalLegalSearchService.search(searchQuery, {
        maxResults: 5,
        precision: 'strict',
        enableEntityExtraction: true,
        enableDomainValidation: true,
        enableContextualExpansion: true,
        minPrecisionAtOne: 0.85
      });
      
      searchResults = professionalResults.map(result => ({
        id: result.id,
        content: result.content,
        metadata: {
          madde_no: (result.metadata?.madde_no as string) || '',
          baslik: (result.metadata?.baslik as string) || '',
          kanun_adi: (result.metadata?.kanun_adi as string) || '',
          chunk_index: (result.metadata?.chunk_index as number) || 0,
          total_chunks: (result.metadata?.total_chunks as number) || 0,
          paragraflar: result.metadata?.paragraflar,
          icerik: result.metadata?.icerik
        },
        similarity: result.finalScore
      }));
      
      console.log(`Found ${searchResults.length} high-quality legal articles (Professional Search)`);
      
      if (professionalResults.length > 0) {
        const avgPrecision = professionalResults.reduce((sum, r) => sum + r.finalScore, 0) / professionalResults.length;
        const highConfidenceCount = professionalResults.filter(r => r.confidence === 'high').length;
        console.log(`Average precision: ${avgPrecision.toFixed(3)}, High confidence: ${highConfidenceCount}/${professionalResults.length}`);
      }
      
      if (searchResults.length > 0) {
        context = "\n\nRelevant Legal Regulations:\n";
        searchResults.forEach((result, index) => {
          context += `\n${index + 1}. ${result.metadata.kanun_adi} - Article ${result.metadata.madde_no}:\n`;
          context += `${result.content}\n`;
          context += `(Similarity: ${(result.similarity * 100).toFixed(1)}%)\n`;
        });
      }
    } catch (searchError) {
      console.error("Search error:", searchError);
      context = "\n\nNote: There was an issue accessing the legal database, general legal knowledge will be used.\n";
    }

    const enhancedPrompt = `Sen Türk hukuk sistemine hâkim bir hukuk uzmanısın. Kullanıcının sorusunu aşağıdaki bağlamda yanıtla:

Kullanıcı Sorusu: ${originalQuery}
${wasTranslated ? `(Arama için Türkçe çeviri: ${searchQuery})` : ''}

${context}

Lütfen:
1. Soruya detaylı ve doğru bir hukuki yanıt ver
2. İlgili kanun maddelerine referans ver
3. Pratik öneriler sun
4. Anlaşılır dil kullan
5. Konuyla ilgili spesifik bir hukuki düzenleme yoksa, genel hukuk ilkeleri çerçevesinde değerlendir

Yanıt:`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

    let result;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        result = await model.generateContent(enhancedPrompt);
        break;
      } catch (error: unknown) {
        attempts++;
        
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage?.includes('overloaded') && attempts < maxAttempts) {
          console.log(`API overloaded, retrying... (attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          continue;
        }
        
        throw error;
      }
    }

    if (!result) {
      throw new Error('Failed to get response after multiple attempts');
    }

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ 
      text,
      searchResults: searchResults.length > 0 ? searchResults : undefined,
      context: searchResults.length > 0 ? 
        (lang === 'tr' ? "Yanıt, Türk hukuk mevzuatındaki ilgili düzenlemeler temel alınarak hazırlanmıştır." : "Response prepared based on relevant regulations in Turkish legal legislation.") : 
        (lang === 'tr' ? "Genel hukuk bilgisi temel alınarak yanıtlanmıştır." : "Answered based on general legal knowledge."),
      wasTranslated,
      searchQuery: wasTranslated ? searchQuery : undefined
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
