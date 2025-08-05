// TR: TÜM JSON KANUN DOSYALARINI İŞLEMEK İÇİN KANUN DOSYA YÜKLEYİCİ
// EN: LAW FILE LOADER UTILITY FOR PROCESSING ALL JSON LAW FILES

import { LawArticle } from './embedding';
import fs from 'fs';
import path from 'path';

// TÜM KANUN DOSYALARINI DİNAMİK OLARAK İÇE AKTARMA
// IMPORT ALL LAW FILES DYNAMICALLY
import TurkCezaKanunu from '../laws/TurkCezaKanunu.json';
import BorclarKanunu_regex from '../laws/BorclarKanunu_regex.json';
import BorclarKanunu2_regex from '../laws/BorclarKanunu2_regex.json';
import BorclarKanunu3_regex from '../laws/BorclarKanunu3_regex.json';
import BorclarKanunu4_regex from '../laws/BorclarKanunu4_regex.json';
import BorclarKanunu5_regex from '../laws/BorclarKanunu5_regex.json';
import BorclarKanunu6_regex from '../laws/BorclarKanunu6_regex.json';
import IsKanunu_regex from '../laws/IsKanunu_regex.json';
import IsKanunu2_regex from '../laws/IsKanunu2_regex.json';
import IsKanunu3_regex from '../laws/IsKanunu3_regex.json';
import TuketiciKanunu_regex from '../laws/TuketiciKanunu_regex.json';
import TurkCezaKanunu_regex from '../laws/TurkCezaKanunu_regex.json';
import TurkCezaKanunu2_regex from '../laws/TurkCezaKanunu2_regex.json';
import TurkCezaKanunu3_regex from '../laws/TurkCezaKanunu3_regex.json';
import TurkCezaKanunu4_regex from '../laws/TurkCezaKanunu4_regex.json';
import TurkCezaKanunu5_regex from '../laws/TurkCezaKanunu5_regex.json';
import TurkCezaKanunu6_regex from '../laws/TurkCezaKanunu6_regex.json';
import TurkCezaKanunu7_regex from '../laws/TurkCezaKanunu7_regex.json';
import TurkCezaKanunu8_regex from '../laws/TurkCezaKanunu8_regex.json';
import TurkCezaKanunu9_regex from '../laws/TurkCezaKanunu9_regex.json';
import TurkCezaKanunu10_regex from '../laws/TurkCezaKanunu10_regex.json';
import TurkMedeniKanunu_regex from '../laws/TurkMedeniKanunu_regex.json';
import TurkMedeniKanunu2_regex from '../laws/TurkMedeniKanunu2_regex.json';

// TÜM KANUN DOSYALARINI VERİLERİYLE BIRLIKTE TANIMLAMA
// DEFINE ALL LAW FILES WITH THEIR DATA
const LAW_FILES = [
  { name: 'TurkCezaKanunu.json', data: TurkCezaKanunu },
  { name: 'BorclarKanunu_regex.json', data: BorclarKanunu_regex },
  { name: 'BorclarKanunu2_regex.json', data: BorclarKanunu2_regex },
  { name: 'BorclarKanunu3_regex.json', data: BorclarKanunu3_regex },
  { name: 'BorclarKanunu4_regex.json', data: BorclarKanunu4_regex },
  { name: 'BorclarKanunu5_regex.json', data: BorclarKanunu5_regex },
  { name: 'BorclarKanunu6_regex.json', data: BorclarKanunu6_regex },
  { name: 'IsKanunu_regex.json', data: IsKanunu_regex },
  { name: 'IsKanunu2_regex.json', data: IsKanunu2_regex },
  { name: 'IsKanunu3_regex.json', data: IsKanunu3_regex },
  { name: 'TuketiciKanunu_regex.json', data: TuketiciKanunu_regex },
  { name: 'TurkCezaKanunu_regex.json', data: TurkCezaKanunu_regex },
  { name: 'TurkCezaKanunu2_regex.json', data: TurkCezaKanunu2_regex },
  { name: 'TurkCezaKanunu3_regex.json', data: TurkCezaKanunu3_regex },
  { name: 'TurkCezaKanunu4_regex.json', data: TurkCezaKanunu4_regex },
  { name: 'TurkCezaKanunu5_regex.json', data: TurkCezaKanunu5_regex },
  { name: 'TurkCezaKanunu6_regex.json', data: TurkCezaKanunu6_regex },
  { name: 'TurkCezaKanunu7_regex.json', data: TurkCezaKanunu7_regex },
  { name: 'TurkCezaKanunu8_regex.json', data: TurkCezaKanunu8_regex },
  { name: 'TurkCezaKanunu9_regex.json', data: TurkCezaKanunu9_regex },
  { name: 'TurkCezaKanunu10_regex.json', data: TurkCezaKanunu10_regex },
  { name: 'TurkMedeniKanunu_regex.json', data: TurkMedeniKanunu_regex },
  { name: 'TurkMedeniKanunu2_regex.json', data: TurkMedeniKanunu2_regex },
] as const;

export interface LawFileInfo {
  name: string;
  articlesCount: number;
  validArticlesCount: number;
  lawName: string;
}

/**
* TR: TÜM JSON DOSYALARINDAN KANUN MADDELERİNİ YÜKLE
* EN: LOAD ALL LAW ARTICLES FROM ALL JSON FILES
*/
export function loadAllLawArticles(): LawArticle[] {
  const allArticles: LawArticle[] = [];
  
  for (const lawFile of LAW_FILES) {
    try {
      const articles = lawFile.data as LawArticle[];
      
      // TR: MADDELERİ DOĞRULA VE FİLTRELE
      // EN: VALIDATE AND FILTER ARTICLES
      const validArticles = articles.filter(article => 
        article.madde_no && 
        article.icerik && 
        article.icerik.trim().length > 10 &&
        article.kanun_adi &&
        article.paragraflar
      );
      
      console.log(`Loaded ${validArticles.length}/${articles.length} valid articles from ${lawFile.name}`);
      allArticles.push(...validArticles);
      
    } catch (error) {
      console.error(`Error loading ${lawFile.name}:`, error);
    }
  }
  
  console.log(`Total loaded articles: ${allArticles.length}`);
  return allArticles;
}

interface BasicLawFileInfo {
  name: string;
  articlesCount: number;
  validArticlesCount: number;
  lawName: string;
}

interface AdminLawFileInfo {
  fileName: string;
  displayName: string;
  totalArticles: number;
  hasSubLaws: boolean;
  structure: {
    kitap?: number;
    kisim?: number;
    bolum?: number;
    ayirim?: number;
  };
}

/**
 * TR: TÜM KANUN DOSYALARI HAKKINDA BİLGİ AL
 * EN: GET INFORMATION ABOUT ALL LAW FILES
 */
export function getLawFilesInfo(): AdminLawFileInfo[] {
  const fileInfos: AdminLawFileInfo[] = [];
  
  for (const lawFile of LAW_FILES) {
    try {
      const articles = lawFile.data as LawArticle[];
      
      const validArticles = articles.filter(article => 
        article.madde_no && 
        article.icerik && 
        article.icerik.trim().length > 10 &&
        article.kanun_adi
      );
      
      // TR: YAPIYA ANALİZ YAP
      // EN: ANALYZE STRUCTURE
      const structure: { kitap?: number; kisim?: number; bolum?: number; ayirim?: number } = {};
      validArticles.forEach(article => {
        if (article.kitap) structure.kitap = Math.max(structure.kitap || 0, parseInt(article.kitap) || 0);
        if (article.kisim) structure.kisim = Math.max(structure.kisim || 0, parseInt(article.kisim) || 0);
        if (article.bolum) structure.bolum = Math.max(structure.bolum || 0, parseInt(article.bolum) || 0);
        if (article.ayirim) structure.ayirim = Math.max(structure.ayirim || 0, parseInt(article.ayirim) || 0);
      });
      
      // TR: ALT KANUNLARI KONTROL ET
      // EN: CHECK FOR SUB LAWS
      const hasSubLaws = validArticles.some(article => 
        article.altKanunlar && Array.isArray(article.altKanunlar) && article.altKanunlar.length > 0
      );
      
      // TR: GÖRÜNTÜLENECEK İSMİ OLUŞTURMA
      // EN: CREATE DISPLAY NAME
      const displayName = lawFile.name
        .replace('.json', '')
        .replace(/_regex/g, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^\w/, c => c.toUpperCase());
      
      fileInfos.push({
        fileName: lawFile.name,
        displayName,
        totalArticles: validArticles.length,
        hasSubLaws,
        structure
      });
      
    } catch (error) {
      console.error(`Error analyzing ${lawFile.name}:`, error);
      const displayName = lawFile.name
        .replace('.json', '')
        .replace(/_regex/g, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^\w/, c => c.toUpperCase());
        
      fileInfos.push({
        fileName: lawFile.name,
        displayName,
        totalArticles: 0,
        hasSubLaws: false,
        structure: {}
      });
    }
  }
  
  return fileInfos;
}

/**
* TR: KANUN DOSYALARI HAKKINDA TEMEL İSTATİSTİKLERİ ALMA
* EN: GET BASIC STATISTICS ABOUT LAW FILES
*/
export function getBasicLawFilesInfo(): BasicLawFileInfo[] {
  const fileInfos: BasicLawFileInfo[] = [];
  
  for (const lawFile of LAW_FILES) {
    try {
      const articles = lawFile.data as LawArticle[];
      
      const validArticles = articles.filter(article => 
        article.madde_no && 
        article.icerik && 
        article.icerik.trim().length > 10 &&
        article.kanun_adi
      );
      
      const lawName = validArticles.length > 0 ? validArticles[0].kanun_adi : 'Unknown';
      
      fileInfos.push({
        name: lawFile.name,
        articlesCount: articles.length,
        validArticlesCount: validArticles.length,
        lawName
      });
      
    } catch (error) {
      console.error(`Error analyzing ${lawFile.name}:`, error);
      fileInfos.push({
        name: lawFile.name,
        articlesCount: 0,
        validArticlesCount: 0,
        lawName: 'Error loading'
      });
    }
  }
  
  return fileInfos;
}

/**
* TR: TÜM BENZERSİZ KANUN İSİMLERİNİ ALMA
* EN: GET ALL UNIQUE LAW NAMES
*/
export function getAllLawNames(): string[] {
  const lawNames = new Set<string>();
  
  for (const lawFile of LAW_FILES) {
    try {
      const articles = lawFile.data as LawArticle[];
      articles.forEach(article => {
        if (article.kanun_adi) {
          lawNames.add(article.kanun_adi);
        }
      });
    } catch (error) {
      console.error(`Error reading law names from ${lawFile.name}:`, error);
    }
  }
  
  return Array.from(lawNames).sort();
}
