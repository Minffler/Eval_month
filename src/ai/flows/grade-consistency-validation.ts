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
  consistencyReport: z
    .string()
    .describe(
      '등급 분포가 예상 분포와 일치하는지 여부를 나타내고, 잠재적인 불일치나 편향을 강조하는 보고서.'
    ),
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

  제공된 등급 데이터를 분석하여 분포가 예상 분포와 일치하는지 확인하십시오.
  보고서에 잠재적인 불일치나 편향이 있다면 강조해서 표시해주세요.

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
