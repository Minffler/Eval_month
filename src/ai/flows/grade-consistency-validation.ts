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

export async function validateGradeConsistency(
  input: ValidateGradeConsistencyInput
): Promise<ValidateGradeConsistencyOutput> {
  return validateGradeConsistencyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateGradeConsistencyPrompt',
  input: {schema: ValidateGradeConsistencyInputSchema},
  output: {schema: ValidateGradeConsistencyOutputSchema},
  prompt: `당신은 여러 팀과 부서에 걸쳐 등급의 일관성을 검증하는 임무를 맡은 HR 분석가입니다.

  주어진 등급 데이터와 예상 분포를 바탕으로, 등급 일관성을 분석하고 결과를 구조화된 JSON 형식으로 제공해 주십시오.

  분석 결과에는 다음이 포함되어야 합니다:
  1.  **summary**: 전체 분석 결과에 대한 한두 문장의 명확하고 간결한 요약.
  2.  **overallDistribution**: 각 등급별 직원 수와 전체에서 차지하는 비율(%)을 포함한 전체 등급 분포 통계.
  3.  **findings**: 예상 분포와 비교했을 때 발견된 주요 사항들. 각 발견 사항은 '편향', '불일치', '긍정적 발견' 중 하나의 유형으로 분류하고, 구체적인 설명과 데이터 근거를 포함해야 합니다.
  
  모든 설명과 텍스트는 반드시 한국어로 작성해주십시오.

  등급 데이터: {{{gradeData}}}
  예상 분포: {{{expectedDistribution}}}
  `,
});

const validateGradeConsistencyFlow = ai.defineFlow(
  {
    name: 'validateGradeConsistencyFlow',
    inputSchema: ValidateGradeConsistencyInputSchema,
    outputSchema: ValidateGradeConsistencyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
