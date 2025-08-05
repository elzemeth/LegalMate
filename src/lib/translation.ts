// TR: OTOMATİK DİL ALGILA VE SORGU ÇEVİRİSİ
// EN: AUTOMATIC LANGUAGE DETECTION AND QUERY TRANSLATION
import { GoogleGenerativeAI } from "@google/generative-ai";

class TranslationService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }

  // TR: METNİN AĞIRLIKLI OLARAK İNGİLİZCE OLUP OLMADIĞINI ALGILAMAK İÇİN
  // EN: LANGUAGE DETECTION USING LINGUISTIC PATTERNS AND INDICATORS
  async detectLanguage(text: string): Promise<'tr' | 'en'> {
    // TR: YAYGIN İNGİLİZCE KELİMELER VE KALIPLARI KONTROL ET
    // EN: PATTERN-BASED LANGUAGE DETECTION FOR TURKISH VS ENGLISH
    const englishIndicators = [
      /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
      /\b(what|when|where|why|how|who|which)\b/gi,
      /\b(is|are|was|were|have|has|had|will|would|can|could|should)\b/gi,
      /\b(rights|law|legal|court|criminal|civil)\b/gi
    ];

    const turkishIndicators = [
      /\b(ve|veya|ama|fakat|için|ile|den|dan|da|de|ın|in|un|ün)\b/gi,
      /\b(ne|nerede|neden|nasıl|kim|hangi|kaç)\b/gi,
      /\b(hak|hukuk|kanun|mahkeme|ceza|medeni)\b/gi,
      /[çğıöşü]/gi
    ];

    let englishScore = 0;
    let turkishScore = 0;

    englishIndicators.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) englishScore += matches.length;
    });

    turkishIndicators.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) turkishScore += matches.length;
    });

    // TR: EĞER NET GÖSTERGELER YOKSA AI ALGILA KULLAN
    // EN: IF NO CLEAR INDICATORS, USE AI DETECTION
    if (englishScore === 0 && turkishScore === 0) {
      return await this.aiDetectLanguage(text);
    }

    return turkishScore > englishScore ? 'tr' : 'en';
  }

  // TR: YAPAY ZEKA İLE DİL ALGILAMA
  // EN: DETECT LANGUAGE USING ARTIFICIAL INTELLIGENCE
  private async aiDetectLanguage(text: string): Promise<'tr' | 'en'> {
    try {
      // TR: GEMİNİ AI MODELİ İLE DİL ANALİZİ
      // EN: LANGUAGE ANALYSIS WITH GEMINI AI MODEL
      const model = this.genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

      const prompt = `Detect the language of this text. Respond only with "tr" for Turkish or "en" for English:

Text: "${text}"

Language:`;

      const result = await model.generateContent(prompt);
      const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();

      return response === 'tr' ? 'tr' : 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      // TR: HATA DURUMUNDA VARSAYILAN TÜRKÇE
      // EN: DEFAULT TO TURKISH IN CASE OF ERROR
      return 'tr';
    }
  }

  // TR: METNİ TÜRKÇE'YE ÇEVİR
  // EN: TRANSLATE TEXT TO TURKISH
  async translateToTurkish(text: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

      const prompt = `Translate the following English text to Turkish. Maintain the legal terminology and context. Respond only with the Turkish translation:

English: "${text}"

Turkish:`;

      const result = await model.generateContent(prompt);
      const translation = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      return translation || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
      // TR: ÇEVİRİ BAŞARISIZ OLURSA ORİJİNALİ DÖNDÜR
      // EN: RETURN ORIGINAL IF TRANSLATION FAILS
    }
  }

  async processQueryForSearch(query: string): Promise<{ searchQuery: string; originalQuery: string; wasTranslated: boolean }> {
    const detectedLanguage = await this.detectLanguage(query);

    if (detectedLanguage === 'en') {
      console.log('English query detected, translating to Turkish for search...');
      const translatedQuery = await this.translateToTurkish(query);
      return {
        searchQuery: translatedQuery,
        originalQuery: query,
        wasTranslated: true
      };
    }

    return {
      searchQuery: query,
      originalQuery: query,
      wasTranslated: false
    };
  }
}

export const translationService = new TranslationService();
