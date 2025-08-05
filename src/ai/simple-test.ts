'use server';

export async function testGoogleAI() {
  try {
    console.log("Google AI 직접 테스트 시작");
    
    // Node.js 환경에서 SSL 인증서 검증 우회
    const https = require('https');
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAVBSAu4xYSoPeirrMkgPb6HsVcFD8xmg4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "안녕하세요. 간단한 테스트입니다."
          }]
        }]
      }),
      // @ts-ignore
      agent: agent
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 호출 실패:", response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const result = await response.json();
    console.log("Google AI 직접 테스트 성공:", result);
    return { success: true, result };
  } catch (error) {
    console.error("Google AI 직접 테스트 실패:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
} 