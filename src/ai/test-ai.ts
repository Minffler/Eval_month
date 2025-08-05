'use server';

import { ai } from './genkit';

export async function testAI() {
  try {
    console.log("AI 테스트 시작");
    
    const result = await ai.generate({
      prompt: "안녕하세요. 간단한 테스트입니다.",
      model: 'googleai/gemini-2.5-pro',
    });
    
    console.log("AI 테스트 성공:", result);
    return { success: true, result };
  } catch (error) {
    console.error("AI 테스트 실패:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
} 