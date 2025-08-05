// TR: ARAMA KALİTESİ VE DOĞRULUK TESTİ
// EN: SEARCH QUALITY AND ACCURACY TEST

export async function testSearchAccuracy() {
  const testCases = [
    {
      query: "Çocuk eğitimevinde kalan hükümlüye hangi durumlarda kurum dışına çıkma izni verilebilir?",
      expectedDomain: "ceza",
      shouldNotContain: ["gümrük", "ithalat", "ihracat", "ticaret"],
      shouldContain: ["hükümlü", "eğitim", "izin", "kurum"]
    },
    {
      query: "İş sözleşmesi feshi nasıl yapılır?",
      expectedDomain: "iş", 
      shouldNotContain: ["hükümlü", "ceza", "gümrük"],
      shouldContain: ["iş", "sözleşme", "fesih"]
    },
    {
      query: "Tüketici hakları nelerdir?",
      expectedDomain: "tüketici",
      shouldNotContain: ["hükümlü", "ceza", "eğitimevi"],
      shouldContain: ["tüketici", "hak"]
    }
  ];

  const results = [];
  
  for (const testCase of testCases) {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: testCase.query,
          threshold: 0.8, 
          // EN: HIGHER THRESHOLD FOR BETTER ACCURARY
          // TR: YÜKSEK DOĞRULUK İÇİN YUKSEK THRESHOLD 
          limit: 3
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.results.length > 0) {
        const topResult = data.results[0];
        const content = topResult.content.toLowerCase();
        const kanun = topResult.metadata.kanun_adi.toLowerCase();
        
        const passedTests = {
          domainMatch: data.detectedDomain === testCase.expectedDomain,
          noForbiddenContent: !testCase.shouldNotContain.some(word => 
            content.includes(word) || kanun.includes(word)
          ),
          hasRequiredContent: testCase.shouldContain.some(word => 
            content.includes(word) || kanun.includes(word)
          ),
          relevantSimilarity: topResult.similarity > 0.7
        };
        
        results.push({
          query: testCase.query,
          success: Object.values(passedTests).every(Boolean),
          details: {
            detectedDomain: data.detectedDomain,
            expectedDomain: testCase.expectedDomain,
            topResult: {
              madde: topResult.metadata.madde_no,
              kanun: topResult.metadata.kanun_adi,
              similarity: topResult.similarity
            },
            tests: passedTests
          }
        });
      } else {
        results.push({
          query: testCase.query,
          success: false,
          details: { error: "No results found" }
        });
      }
    } catch (error) {
      results.push({
        query: testCase.query,
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }
  
  return results;
}
