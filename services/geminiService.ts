
import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const scanReceipt = async (base64Image: string): Promise<OCRResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "このレシートから情報を抽出してください。合計金額、店舗名、日付に注目してください。カテゴリは以下のいずれかに分類してください：食費, 日用品, 交通費, 交際費, 住居・光熱費, エンタメ, 美容・衣服, その他。JSON形式で返してください。",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "支出の合計金額" },
            storeName: { type: Type.STRING, description: "店舗名" },
            date: { type: Type.STRING, description: "取引日 (YYYY-MM-DD)" },
            category: { type: Type.STRING, description: "支出カテゴリ" },
            confidence: { type: Type.NUMBER, description: "OCRの信頼スコア 0-1" }
          },
          required: ["amount", "storeName", "category"]
        },
      },
    });

    const resultText = response.text;
    if (!resultText) return null;
    
    return JSON.parse(resultText) as OCRResult;
  } catch (error) {
    console.error("OCRエラー:", error);
    return null;
  }
};
