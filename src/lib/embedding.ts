import { GoogleGenerativeAI } from "@google/generative-ai";
// TR: METİN EMBEDDING'LERİ OLUŞTURMA VE YÖNETİM SERVİSİ
// EN: EMBEDDING SERVICE FOR GENERATING AND MANAGING TEXT EMBEDDINGS

export interface LawArticle {
  madde_no: string;
  baslik: string;
  icerik: string;
  paragraflar: Array<{ no: string; icerik: string }>;
  kanun_adi: string;
  kitap?: string;
  kisim?: string;
  bolum?: string;
  ayirim?: string;
  altKanunlar?: Array<Record<string, unknown>>;
}

export interface DocumentChunk {
  id?: string;
  content: string;
  metadata: {
    madde_no: string;
    baslik: string;
    kanun_adi: string;
    chunk_index: number;
    total_chunks: number;
    paragraflar?: Array<{ no: string; icerik: string }>;
    icerik?: string;
  };
  embedding?: number[];
}

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }

  /**
  * TR: GELİŞMİŞ ÖNİŞLEME İLE VERİLEN METİN İÇİN EMBEDDING OLUŞTUR
  * EN: GENERATE EMBEDDINGS FOR GIVEN TEXT WITH ENHANCED PREPROCESSING
  **/
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const cleanText = this.preprocessLegalText(text);
      
      const model = this.genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(cleanText);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding values returned from API');
      }
      
      return result.embedding.values;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Embedding generation error:', errorMessage);
      throw new Error(`Embedding generation failed: ${errorMessage}`);
    }
  }

  /**
  * TR: DAHA İYİ EMBEDDING İÇİN TÜRKÇE HUKUKİ METİNLERİ ÖNİŞLEME
  * EN: PREPROCESS TURKISH LEGAL TEXTS FOR BETTER EMBEDDING
  **/
  private preprocessLegalText(text: string): string {
    let cleanText = text.trim().replace(/\s+/g, ' ');
    
    const legalContext = this.extractLegalContext(cleanText);
    if (legalContext.length > 0) {
      cleanText = `${legalContext.join(' ')} - ${cleanText}`;
    }
    
    if (cleanText.length > 8000) {
      cleanText = cleanText.substring(0, 8000) + '...';
    }
    
    return cleanText;
  }

  /**
   * TR: METİNDEN HUKUKU BAĞLAM ANAHTAR KELİMELERİNİ ÇIKAR
   * EN: EXTRACT REVELANT LEGAL DOMAIN KEYWORDS FOR BETTER CONTEXT
   */
  private extractLegalContext(text: string): string[] {
    const keywords: string[] = [];
    
    const legalDomains = {
      'ceza': ['suç', 'ceza', 'hapis', 'infaz', 'hükümlü', 'mahkumiyet', 'denetimli serbestlik'],
      'medeni': ['evlilik', 'miras', 'mülkiyet', 'kişilik', 'aile', 'velayet'],
      'iş': ['işçi', 'işveren', 'iş sözleşmesi', 'ücret', 'çalışma', 'mesai'],
      'ticaret': ['ticaret', 'şirket', 'senet', 'kıymetli evrak', 'borsa'],
      'idare': ['idari', 'kamu', 'devlet', 'belediye', 'bürokrasi'],
      'gümrük': ['gümrük', 'ithalat', 'ihracat', 'vergi', 'tarife']
    };

    for (const [domain, terms] of Object.entries(legalDomains)) {
      if (terms.some(term => text.toLowerCase().includes(term))) {
        keywords.push(`${domain}_hukuku`);
      }
    }
    
    return keywords;
  }

  /**
  * TR: VERİLEN METİN İÇİN EMBEDDING OLUŞTUR
  * EN: GENERATE VECTOR EMBEDDINGS USING GOOGLE GEMINI API
  */
  async generateEmbeddingLegacy(text: string): Promise<number[]> {
    try {
      // TR: GEMİNİ EMBEDDİNG MODELİNİ KULLANMA
      // EN: USE GEMINI EMBEDDING MODEL FOR VECTOR GENERATION
      const model = this.genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      
      // TR: EMBEDDİNG SONUÇLARINI KONTROL ETME
      // EN: VALIDATE EMBEDDING RESULTS FROM API
      if (!result.embedding || !result.embedding.values) {
        throw new Error("No embedding values returned");
      }
      
      return result.embedding.values;
    } catch (error: unknown) {
      console.error("Error generating embedding:", error);
      
      // TR: DETAYLI HATA ANALİZİ
      // EN: DETAILED ERROR ANALYSIS
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage?.includes('API_KEY')) {
        throw new Error("Invalid API key. Please check your GEMINI_API_KEY");
      } else if (errorMessage?.includes('fetch failed')) {
        throw new Error("Network error. Please check your internet connection");
      } else if (errorMessage?.includes('quota')) {
        throw new Error("API quota exceeded. Please try again later");
      }
      
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
  * TR: UZUN METNİ DAHA İYİ EMBEDDING İÇİN KÜÇÜK PARÇALARA BÖL
  * EN: SPLOT LONG TEXT INTO MANAGABLE CHUNKS FOR VECTOR PROCESSING
  */
  chunkText(text: string, maxLength: number = 500): string[] {
    // TR: FAZLA BOŞLUKLARI KALDIR VE NORMALLEŞTİRME
    // EN: CLEAN AND NORMALİZE TEXT BEFORE CHUNKING
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= maxLength) {
      return [cleanText];
    }

    const chunks: string[] = [];
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      // TR: BU CÜMLEYİ EKLEME MAKSİMUM UZUNLUĞU AŞARSA, MEVCUT PARÇAYI KAYDETME
      // EN: CHECK CHUNK SIZE LIMITS AND HANDLE OVERFLOW
      if (currentChunk.length + trimmedSentence.length + 1 > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // TR: TEK CÜMLE ÇOK UZUNSA, DAHA DA BÖLME
        // EN: HANDLE OVERSIZED SENTENCES BY WORD-LEVEL SPLITTING
        if (trimmedSentence.length > maxLength) {
          const words = trimmedSentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if (wordChunk.length + word.length + 1 > maxLength) {
              if (wordChunk) {
                chunks.push(wordChunk.trim());
                wordChunk = '';
              }
            }
            wordChunk += (wordChunk ? ' ' : '') + word;
          }
          
          if (wordChunk) {
            currentChunk = wordChunk;
          }
        } else {
          currentChunk = trimmedSentence;
        }
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [cleanText];
  }

  /**
  * TR: KANUN MADDESİNİ EMBEDDING'LERİ OLAN PARÇALARA İŞLEME
  * EN: PROCESS A LAW ARTICLE INTO CHUNKS WITH EMBEDDINGS
  */
  async processLawArticle(article: LawArticle): Promise<DocumentChunk[]> {
    // TR: DAHA İYİ BAĞLAM İÇİN BAŞLIK, İÇERİK VE TÜM PARAGRAFLARI BİRLEŞTİRME
    // EN: COMBINE TITLE, CONTENT AND ALL PARAGRAPHS FOR BETTER CONTEXT
    let fullContent = `${article.baslik} ${article.icerik}`.trim();
    
    // TR: KOMPLE MADDE METNİ ELDE ETMEK İÇİN TÜM PARAGRAF İÇERİĞİNİ EKLEME
    // EN: ADD ALL PARAGRAPH CONTENT TO GET COMPLETE ARTICLE TEXT
    if (article.paragraflar && article.paragraflar.length > 0) {
      const paragraphContent = article.paragraflar
        .map(para => para.icerik)
        .join(' ');
      fullContent = `${article.baslik} ${paragraphContent}`.trim();
    }
    
    if (!fullContent || fullContent.length < 10) {
      return []; 
      // TR: ANLAMLI İÇERİĞİ OLMAYAN MADDELERİ ATLA 
      // EN: SKIP ARTICLES WITH NO MEANINGFUL CONTENT
    }

    const textChunks = this.chunkText(fullContent);
    const documentChunks: DocumentChunk[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      
      try {
        const embedding = await this.generateEmbedding(chunk);
        
        documentChunks.push({
          content: chunk,
          metadata: {
            madde_no: article.madde_no,
            baslik: article.baslik,
            kanun_adi: article.kanun_adi,
            chunk_index: i,
            total_chunks: textChunks.length,
            paragraflar: article.paragraflar,
            icerik: article.icerik
          },
          embedding
        });
        
        // TR: HIZLILIGI SINIRLAMAMAK İÇİN KÜÇÜK GECİKME
        // EN: SMALL DELAY TO AVOID RATE LIMITING
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing chunk ${i} for article ${article.madde_no}:`, error);
      }
    }

    return documentChunks;
  }

  /**
  * TR: ARAMA SORGUSU İÇİN EMBEDDING OLUŞTURMA
  * EN: GENERATE EMBEDDING FOR SEARCH QUERY
  */
  async embedQuery(query: string): Promise<number[]> {
    return this.generateEmbedding(query);
  }
}

export const embeddingService = new EmbeddingService();
