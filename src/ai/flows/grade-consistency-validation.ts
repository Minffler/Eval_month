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

// 대체 분석 함수 (AI 모델이 실패할 경우 사용)
function generateFallbackAnalysis(gradeData: string): ValidateGradeConsistencyOutput {
  // 간단한 통계 분석
  const gradeCounts: Record<string, number> = {};
  const evaluatorCounts: Record<string, Record<string, number>> = {};
  
  // 데이터 파싱
  const lines = gradeData.split('\n');
  let totalCount = 0;
  
  lines.forEach(line => {
    const [evaluator, gradesStr] = line.split(': ');
    if (evaluator && gradesStr) {
      const grades = gradesStr.split(', ').filter(g => g.trim());
      evaluatorCounts[evaluator] = {};
      
      grades.forEach(grade => {
        const cleanGrade = grade.trim();
        if (cleanGrade) {
          gradeCounts[cleanGrade] = (gradeCounts[cleanGrade] || 0) + 1;
          evaluatorCounts[evaluator][cleanGrade] = (evaluatorCounts[evaluator][cleanGrade] || 0) + 1;
          totalCount++;
        }
      });
    }
  });

  // 전체 분포 계산
  const overallDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({
    grade,
    count,
    percentage: totalCount > 0 ? Math.round((count / totalCount) * 100 * 10) / 10 : 0,
  }));

  // 편향 분석
  const findings: Array<{
    type: '편향' | '불일치' | '긍정적 발견';
    description: string;
    evidence: string;
  }> = [];

  // 평가자별 편향 검사
  Object.entries(evaluatorCounts).forEach(([evaluator, grades]) => {
    const evaluatorTotal = Object.values(grades).reduce((sum, count) => sum + count, 0);
    const highGrades = ['S', 'A+', 'A'].reduce((sum, grade) => sum + (grades[grade] || 0), 0);
    const lowGrades = ['C', 'C-', 'D'].reduce((sum, grade) => sum + (grades[grade] || 0), 0);
    
    const highGradeRatio = evaluatorTotal > 0 ? (highGrades / evaluatorTotal) * 100 : 0;
    const lowGradeRatio = evaluatorTotal > 0 ? (lowGrades / evaluatorTotal) * 100 : 0;
    
    if (highGradeRatio > 60) {
      findings.push({
        type: '편향',
        description: `${evaluator} 평가자가 높은 등급을 과도하게 부여하는 경향이 있습니다.`,
        evidence: `높은 등급(S, A+, A) 비율: ${highGradeRatio.toFixed(1)}% (평가 대상: ${evaluatorTotal}명)`
      });
    }
    
    if (lowGradeRatio > 30) {
      findings.push({
        type: '편향',
        description: `${evaluator} 평가자가 낮은 등급을 과도하게 부여하는 경향이 있습니다.`,
        evidence: `낮은 등급(C, C-, D) 비율: ${lowGradeRatio.toFixed(1)}% (평가 대상: ${evaluatorTotal}명)`
      });
    }
  });

  // 긍정적 발견 추가
  if (findings.length === 0) {
    findings.push({
      type: '긍정적 발견',
      description: '평가자 간 등급 부여가 비교적 균형잡혀 있습니다.',
      evidence: `전체 ${totalCount}명의 평가 데이터에서 특별한 편향이 발견되지 않았습니다.`
    });
  }

  return {
    summary: `총 ${totalCount}명의 평가 데이터를 분석한 결과, ${findings.length}개의 주요 발견사항이 있습니다.`,
    overallDistribution,
    findings,
  };
}

export async function validateGradeConsistency(
  input: ValidateGradeConsistencyInput
): Promise<ValidateGradeConsistencyOutput> {
  try {
    // AI 모델 시도
    const result = await validateGradeConsistencyFlow(input);
    return result;
  } catch (error) {
    console.error("AI 모델 분석 실패, 대체 분석 사용:", error);
    
    // AI 모델이 실패하면 대체 분석 사용
    try {
      const fallbackResult = generateFallbackAnalysis(input.gradeData);
      return fallbackResult;
    } catch (fallbackError) {
      console.error("대체 분석도 실패:", fallbackError);
      throw new Error("분석을 수행할 수 없습니다. 데이터를 확인하고 다시 시도해주세요.");
    }
  }
}

const prompt = ai.definePrompt({
  name: 'validateGradeConsistencyPrompt',
  input: {schema: ValidateGradeConsistencyInputSchema},
  output: {schema: ValidateGradeConsistencyOutputSchema},
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

const validateGradeConsistencyFlow = ai.defineFlow(
  {
    name: 'validateGradeConsistencyFlow',
    inputSchema: ValidateGradeConsistencyInputSchema,
    outputSchema: ValidateGradeConsistencyOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error("AI 모델이 응답을 생성하지 못했습니다.");
      }
      return output;
    } catch (error) {
      console.error("AI Flow 실행 중 오류:", error);
      throw error;
    }
  }
);
