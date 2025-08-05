'use server';

/**
 * @fileOverview 이 파일은 여러 팀과 부서에 걸친 등급 일관성을 검증하기 위한 Genkit 플로우를 정의합니다.
 *
 * - validateGradeConsistency - 등급 일관성을 검증하는 함수.
 * - ValidateGradeConsistencyInput - validateGradeConsistency 함수의 입력 타입.
 * - ValidateGradeConsistencyOutput - validateGradeConsistency 함수의 반환 타입.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateGradeConsistencyInputSchema = z.object({
  gradeData: z
    .string()
    .describe(
      '조직 내 여러 팀과 부서의 등급 분포를 담고 있는 문자열.'
    ),
  expectedDistribution: z
    .string()
    .describe(
      '조직 전체의 예상 등급 분포를 설명하는 문자열. 예: 대부분의 직원은 B 또는 B+ 등급을 받아야 하며, S 또는 D 등급을 받는 직원은 소수여야 합니다.'
    ),
});

export type ValidateGradeConsistencyInput = z.infer<
  typeof ValidateGradeConsistencyInputSchema
>;

const ValidateGradeConsistencyOutputSchema = z.object({
  summary: z.string().describe('분석 결과에 대한 한두 문장의 요약.'),
  overallDistribution: z.array(z.object({
    grade: z.string().describe('평가 등급'),
    count: z.number().describe('해당 등급을 받은 직원 수'),
    percentage: z.number().describe('전체에서 해당 등급이 차지하는 비율 (%)'),
  })).describe('전체 등급 분포에 대한 통계'),
  findings: z.array(z.object({
    type: z.enum(['편향', '불일치', '긍정적 발견']).describe('발견된 사항의 유형'),
    description: z.string().describe('발견된 사항에 대한 구체적인 설명'),
    evidence: z.string().describe('해당 발견을 뒷받침하는 데이터 또는 근거'),
  })).describe('예상 분포와 비교하여 발견된 주요 사항 목록'),
});

export type ValidateGradeConsistencyOutput = z.infer<
  typeof ValidateGradeConsistencyOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'validateGradeConsistencyPrompt',
  input: {schema: ValidateGradeConsistencyInputSchema},
  output: {schema: ValidateGradeConsistencyOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `당신은 HR 분석 전문가입니다. 평가자별 등급 데이터를 분석하여 편향을 찾아주세요.

분석 요구사항:
1. 각 평가자의 등급 분포를 비교하세요
2. 특정 평가자가 너무 후하거나 엄격한지 확인하세요
3. 결과는 반드시 지정된 JSON 형식으로 반환하세요

응답 형식:
{
  "summary": "분석 요약 (한 문장)",
  "overallDistribution": [
    {"grade": "S", "count": 5, "percentage": 10.0},
    {"grade": "A+", "count": 15, "percentage": 30.0}
  ],
  "findings": [
    {
      "type": "편향",
      "description": "발견 내용",
      "evidence": "근거"
    }
  ]
}

입력 데이터:
평가자별 등급: {{{gradeData}}}
예상 분포: {{{expectedDistribution}}}

모든 텍스트는 한국어로 작성하세요.`,
});

export async function validateGradeConsistency(
  input: ValidateGradeConsistencyInput
): Promise<ValidateGradeConsistencyOutput> {
  try {
    console.log("validateGradeConsistency 시작");
    console.log("입력:", input);
    console.log("AI 프롬프트:", prompt.toString());
    console.log("AI에 전달되는 gradeDataString:", input.gradeData);
    console.log("AI에 전달되는 expectedDistribution:", input.expectedDistribution);

    // AI 호출 및 raw 응답 확인
    const raw = await prompt(input);
    console.log("AI raw 응답:", raw);
    const {output} = raw;
    console.log("AI output:", output);

    if (!output) {
      console.error("AI output이 없음! raw 전체:", raw);
      throw new Error("AI 모델이 유효한 분석 결과를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
    return output;
  } catch (error) {
    console.error("validateGradeConsistency 에러:", error);
    throw error;
  }
}
