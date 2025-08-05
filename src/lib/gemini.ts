// TR: HUKUKİ ANALİZ VE YANIT ÜRETİMİ İÇİN GOOGLE GEMINI AI ENTEGRASYONU
// EN: GOOGLE GEMINI AI INTEGRATION FOR LEGAL ANALYSIS AND RESPONSE GENERATION
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// TR: HUKUKİ SORGULAR İÇİN AI YANITLARI ÜRET
// EN: GENERATE AI RESPONSES FOR LEGAL QUERIES
export const getGeminiResponse = async (prompt: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  return result.response.text();
};
