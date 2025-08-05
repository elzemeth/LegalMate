// TR: HUKUKİ SORGU GÖNDERİMİ İÇİN GİRİŞ COMPONENTİ
// EN: INPUT COMPONENT FOR LEGAL QUERY SUBMISSION
"use client";

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

interface InputBoxProps {
  onSend: (msg: string) => void;
  disabled?: boolean;
}

export default function InputBox({ onSend, disabled = false }: InputBoxProps) {
  const [text, setText] = useState("");
  const { t } = useLanguage();

  const handleSubmit = () => {
    // TR: MESAJ DOĞRULAMA VE GÖNDERME İŞLEMİ
    // EN: MESSAGE VALIDATION AND SENDING PROCESS
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // TR: ENTER TUŞU İLE FORM GÖNDERİMİ
    // EN: FORM SUBMISSION WITH ENTER KEY
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-black">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-black mb-2">
          {t('inputTitle')}
        </h3>
      </div>
      
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('placeholder')}
            disabled={disabled}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[100px]"
        >
          {disabled ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('processingButton')}</span>
            </div>
          ) : (
            t('analyzeButton')
          )}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        {t('enterHint')}
      </div>
    </div>
  );
}
