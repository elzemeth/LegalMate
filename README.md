<p  align="center"  style="margin: 30px 0;">
<img  src="./public/logo.png"  width="120"  alt="LegalMate Logo"/>
</p>

  

<h1  align="center">LegalMate</h1>
<h3  align="center">Türk Hukuku için Yapay Zeka Destekli Hukuki Bilgilendirme Sistemi</h3>

  

<p  align="center">
<b>Türk mevzuatını RAG (Retrieval-Augmented Generation) ile analiz eden, Google Gemini destekli profesyonel hukuki BİLGİ VE EĞİTİM platformu.</b>
</p>

  

<p  align="center">
<a  href="https://choosealicense.com/licenses/mit/"><img  src="https://img.shields.io/badge/License-MIT-green.svg"  alt="License"></a>
<a  href="https://nextjs.org/"><img  src="https://img.shields.io/badge/Next.js-15.4-black?logo=next.js"  alt="Next.js"></a>
<a  href="https://www.typescriptlang.org/"><img  src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript"  alt="TypeScript"></a>
<a  href="https://supabase.com/"><img  src="https://img.shields.io/badge/Supabase-Vector_DB-green?logo=supabase"  alt="Supabase"></a>
<a  href="https://ai.google.dev/"><img  src="https://img.shields.io/badge/Google_Gemini-AI-orange?logo=google"  alt="Google Gemini"></a>
</p>

  

<p  align="center">
<a  href="https://github.com/elzemeth/LegalMate/stargazers"><img  src="https://img.shields.io/github/stars/elzemeth/LegalMate?style=social"  alt="GitHub stars"></a>
<a  href="https://github.com/elzemeth/LegalMate/forks"><img  src="https://img.shields.io/github/forks/elzemeth/LegalMate?style=social"  alt="GitHub forks"></a>
<a  href="https://github.com/elzemeth/LegalMate/issues"><img  src="https://img.shields.io/github/issues/elzemeth/LegalMate"  alt="GitHub issues"></a>
<a  href="http://makeapullrequest.com"><img  src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"  alt="PRs Welcome"></a>
</p>

  

<p  align="center">⚠️Yalnızca bilgilendirme amaçlıdır, hukuki görüş yerine geçmez.⚠️</p>

<p  align="center">
<a  href="https://legalmate.vercel.app"  target="_blank">
<img  src="https://img.shields.io/badge/🚀_Live_Demo-Canlı_Demo-blue?style=for-the-badge&logo=vercel&logoColor=white"  alt="Live Demo">
</a>
<a  href="https://github.com/elzemeth/LegalMate"  target="_blank">
<img  src="https://img.shields.io/badge/📁_Source_Code-Kaynak_Kod-green?style=for-the-badge&logo=github&logoColor=white"  alt="Source Code">
</a>
</p>

  

## İçindekiler

  

<details open>

<summary>Hızlı Erişim Menüsü</summary>

  

- [Amaç](#-amaç)

- [Öne Çıkanlar](#-öne-çıkanlar)

- [Hızlı Bakış](#-hızlı-bakış)

- [Teknoloji Stack](#️-teknoloji-stack)

- [Genel Bakış](#-genel-bakış)

- [Kullanılan Algoritmalar](#-kullanılan-algoritmalar)

- [Dil Desteği](#-dil-desteği)

- [Güvenlik](#️-güvenlik)

- [Kurulum](#-kurulum)

- [Kullanım](#-kullanım)

- [Teknik Mimari](#-teknik-mimari)

  

</details>

  

---

  

<div  align="center">
<h3 id="-amaç">NEYİ AMAÇLADIK?</h3>
</div>

<p  align="center"><b> Vatandaşların kendi haklarını öğrenmesini ve spesifik olaylar için güncel mevzuata dayalı, kanun maddeleriyle birlikte yorum alabilmesini, kendi haklarını öğrenmesini ve hukuki açıdan EĞİTİM/BİLGİ alabilmesini hedefliyoruz. </b></p>

  

## <h3 align="center"  id="-öne-çıkanlar">ÖNE ÇIKANLAR</h3>

  

- **Gelişmiş RAG Tabanlı Arama** (Lexical + Semantic + Cross-Encoder)

- **Türk Hukuk Mevzuatı**na dayalı bilgi sistemi

- **TR/EN Çok Dilli Destek** (Otomatik algılama ve çeviri)

- **RLS + Rate Limiting** ile kurumsal güvenlik

- **Kalite Metrikleri**: Precision@1, Domain Accuracy, FP Reduction

  

## <h3 align="center"  id="-hızlı-bakış"> HIZLI BAKIŞ </h3>

 <p  align="center">
<a  href="https://legalmate.vercel.app"  target="_blank">
<img  src="https://img.shields.io/badge/🎯_Canlı_Demo'yu_Deneyin-Try_Live_Demo-ff6b6b?style=for-the-badge&logo=rocket&logoColor=white"  alt="Try Live Demo">

</a>
</p>

  

## <h3 align="center"  id="️-teknoloji-stack"> Teknoloji Stack </h3>

  

<p  align="center">
<img  src="https://skillicons.dev/icons?i=nextjs,ts,nodejs,tailwind,supabase,postgres,vercel"  />
</p>

  

-  **Frontend**: Next.js 15 + TailwindCSS

-  **Backend**: Next.js API Routes (Node.js)

-  **Database**: Supabase PostgreSQL + pgvector

-  **AI**: Google Gemini 2.0 Flash + Embedding-001

-  **Auth & Security**: Supabase RLS + Token Based Access

  
  

## <h3 align="center"  id="-genel-bakış">Genel Bakış</h3>

  

LegalMate, **Türk mevzuatından** alınan yasaları **RAG pipeline** ile işleyip, kullanıcıya **AI destekli hukuki yanıtlar** sunar.

  

**Pipeline Özeti:**

1. Kullanıcı sorgusu alınır (TR/EN)

2. Otomatik dil algılama ve çeviri yapılır

3. Hibrit arama (Lexical + Semantic + Cross-encoder)

4. Cross-encoder ile re-ranking

5. Google Gemini AI ile bağlam tabanlı yanıt oluşturulur

  

---

  

## <h3 align="center"  id="-kullanılan-algoritmalar">Kullanılan Algoritmalar</h3>

  

### Ana Arama Algoritmaları

  

-  **Hibrit Arama (Hybrid Search)**: Lexical + Semantic + Cross-Encoder kombine arama

-  **BM25-like Lexical Search**: Anahtar kelime tabanlı exact matching

-  **Vector Semantic Search**: pgvector ile cosine similarity

-  **Cross-Encoder Re-ranking**: Query-document relevance skorlaması

  

### Yapay Zeka ve NLP

  

-  **Google Gemini 2.0 Flash**: Hukuki analiz ve yanıt üretimi

-  **Embedding-001**: 768-boyutlu vektör embeddings

-  **Language Detection**: Pattern-based + AI-powered dil algılama

-  **Legal Entity Recognition**: Hukuki entity tanıma sistemi

  

### Domain Classification

  

-  **Legal Domain Classifier**: Ceza, Medeni, İş, Gümrük hukuku sınıflandırması

-  **Legal Ontology System**: Hierarchical legal knowledge base

-  **Quality Metrics**: Precision@1, Domain Accuracy, False Positive Reduction

  

---

  

## <h3 align="center"  id="-dil-desteği">Dil Desteği</h3>

  

### Otomatik Dil Algılama

-  **Pattern-based Detection**: Regex patterns ile hızlı algılama

-  **AI-powered Detection**: Gemini AI ile karmaşık metinler

-  **Confidence Scoring**: Algılama güvenilirlik skoru

  

### Gerçek Zamanlı Çeviri

-  **İngilizce → Türkçe**: Hukuki terminoloji korunarak

-  **Bağlam Koruma**: Legal context preservation

-  **Translation Service**: Google Gemini destekli

  

### Desteklenen Diller

-  **🇹🇷 Türkçe**: Ana dil, tüm hukuki metinler

-  **🇬🇧 İngilizce**: Interface ve query desteği

  

---

## <h3 align="center"  id="️-güvenlik">Güvenlik</h3>

  

-  **RLS (Row Level Security)**: Public read + Admin write

-  **Rate Limiting**: IP başına 60 istek/dk


  

## <h3 align="center"  id="-kurulum">Kurulum</h3>

  

```bash

# 1. Repository'yi klonla

git  clone  https://github.com/elzemeth/legalmate.git

cd  legalmate


# 2. Bağımlılıkları yükle

npm  install


# 3. .env.local dosyasını oluştur

cp  .env.example  .env.local


# 4. Development server'ı başlat

npm  run  dev

```

  

`.env.local` örneği:

  

```env

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GEMINI_API_KEY=your-gemini-api-key

```

  

---

  

## <h3 align="center"  id="-kullanım">Kullanım</h3>

  

### <div align="start">Ana Uygulama</div>

  

1.  `http://localhost:3000` adresine gidin

2. Hukuki sorunuzu detaylı şekilde yazın

3.  **Analiz Et** butonuna tıklayın

4. AI yanıtını ve ilgili kanun maddelerini inceleyin

  

### <div align="start">Yönetim Paneli</div>

  

-  **Sistem İstatistikleri**: İndekslenmiş veri hakkında detaylı bilgi

-  **Veri Yönetimi**: Yeni veri ekleme ve mevcut verileri silme

-  **Sistem Testleri**: Veritabanı bağlantısı ve arama sistemi testleri

---

## <h3 align="center"  id="-teknik-mimari">Teknik Mimari</h3>

<h4  align="center">Architecture Diagram - System Overview</h4>

  

```mermaid

graph TB

subgraph "Frontend Layer"

UI[React Components]

I18N[Internationalization]

INPUT[InputBox Component]

OUTPUT[OutputBox Component]

end

  

subgraph "API Gateway Layer"

GEMINI_API["/api/gemini"]

SEARCH_API["/api/search"]

INDEX_API["/api/index"]

ADMIN_API["/api/system-stats"]

end

  

subgraph "Business Logic Layer"

PLS[ProfessionalLegalSearch]

HYBRID[HybridSearchService]

EMBEDDING[EmbeddingService]

TRANSLATION[TranslationService]

CROSS[CrossEncoderService]

LEXICAL[LexicalSearchService]

end

  

subgraph "Data Access Layer"

SEARCH_SVC[SearchService]

SUPABASE[Supabase Client]

ADMIN_CLIENT[Supabase Admin Client]

end

  

subgraph "Storage Layer"

POSTGRES[(PostgreSQL)]

PGVECTOR[pgvector Extension]

CHUNKS[law_chunks Table]

end

  

subgraph "External Services"

GEMINI[Google Gemini API]

EMBED_API[Embedding-001 API]

end

  

subgraph "Legal Documents"

JSON_FILES[JSON Law Files]

LAW_LOADER[Law Loader Service]

end

  

UI --> I18N

UI --> INPUT

UI --> OUTPUT

INPUT --> GEMINI_API

OUTPUT --> SEARCH_API

GEMINI_API --> PLS

GEMINI_API --> TRANSLATION

SEARCH_API --> HYBRID

INDEX_API --> EMBEDDING

PLS --> HYBRID

HYBRID --> EMBEDDING

HYBRID --> CROSS

HYBRID --> LEXICAL

EMBEDDING --> EMBED_API

TRANSLATION --> GEMINI

GEMINI_API --> GEMINI

SEARCH_SVC --> SUPABASE

ADMIN_CLIENT --> SUPABASE

SUPABASE --> POSTGRES

POSTGRES --> PGVECTOR

PGVECTOR --> CHUNKS

LAW_LOADER --> JSON_FILES

EMBEDDING --> LAW_LOADER

```

---

<h3  align="center">Sequence Diagram - Search Flow</h3>

  

```mermaid

sequenceDiagram

participant Client

participant API as Gemini API Route

participant Trans as TranslationService

participant PLS as ProfessionalLegalSearch

participant Hybrid as HybridSearchService

participant Vector as Supabase Vector DB

participant AI as Gemini AI

  

Client->>API: POST /api/gemini {prompt, lang}

API->>Trans: processQueryForSearch(prompt)

Trans->>Trans: detectLanguage(prompt)

  

alt İngilizce tespit edilirse

Trans->>AI: translateToTurkish(prompt)

AI-->>Trans: Türkçe çeviri

end

  

Trans-->>API: {searchQuery, wasTranslated}

API->>PLS: search(searchQuery, options)

PLS->>PLS: classifyDomain(query)

PLS->>PLS: extractEntities(query)

PLS->>Hybrid: hybridSearch(query, options)

  

par Lexical Search

Hybrid->>Hybrid: lexicalSearch(query)

and Semantic Search

Hybrid->>Vector: similaritySearch(embedding)

Vector-->>Hybrid: semantic results

end

  

Hybrid->>Hybrid: mergeResults()

Hybrid->>Hybrid: applyDomainFiltering()

Hybrid->>Hybrid: crossEncoderReRank()

Hybrid-->>PLS: ranked results

PLS-->>API: searchResults[]

API->>AI: generateContent(prompt + context)

AI-->>API: AI response

API-->>Client: {text, searchResults, context, wasTranslated}

```

---

<h3  align="center">RAG Pipeline Akışı</h3>

  

```mermaid

sequenceDiagram

participant U as User

participant T as Translation Service

participant P as Professional Search

participant V as Vector DB

participant C as Cross Encoder

participant G as Gemini AI

  

U->>T: Soru sorma (TR/EN)

T->>T: Dil algılama

T->>T: Türkçe çevirisi (gerekirse)

T->>P: İşlenmiş sorgu

P->>P: Domain sınıflandırması

P->>P: Entity çıkarımı

P->>V: Hibrit arama (Lexical + Semantic)

V-->>P: Aday sonuçlar (50 adet)

P->>C: Cross-encoder re-ranking

C-->>P: Kalite filtrelemesi

P->>G: Bağlam + İlgili maddeler

G-->>U: AI destekli hukuki analiz

```
  

---
  

### Bug Reports


Lütfen [GitHub Issues](https://github.com/elzemeth/LegalMate/issues) kullanarak bug rapor edin.


---

<div  align="center">
<p align="center"><strong>LegalMate - Türk Hukuku için Yapay Zeka Destekli Arama Sistemi</strong></p>
<p align="center"><i>Hukuki bilgiye erişimi kolaylaştırıyor, vatandaşları kendi hakları hakkında bilgilendiriyoruz</i></p>
</div>
