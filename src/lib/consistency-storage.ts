import type { ValidateGradeConsistencyOutput } from '@/ai/flows/grade-consistency-validation';

const STORAGE_KEY_PREFIX = 'consistency_analysis_';

export interface ConsistencyAnalysisRecord {
  year: number;
  month: number;
  result: ValidateGradeConsistencyOutput;
  timestamp: number;
  gradeData: string;
  expectedDistribution: string;
}

export function saveConsistencyAnalysis(
  year: number,
  month: number,
  result: ValidateGradeConsistencyOutput,
  gradeData: string,
  expectedDistribution: string
): void {
  try {
    const record: ConsistencyAnalysisRecord = {
      year,
      month,
      result,
      timestamp: Date.now(),
      gradeData,
      expectedDistribution
    };

    const key = `${STORAGE_KEY_PREFIX}${year}-${month.toString().padStart(2, '0')}`;
    localStorage.setItem(key, JSON.stringify(record));
    
    console.log(`일관성 분석 결과 저장됨: ${year}-${month}`);
  } catch (error) {
    console.error('일관성 분석 결과 저장 실패:', error);
  }
}

export function loadConsistencyAnalysis(
  year: number,
  month: number
): ConsistencyAnalysisRecord | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${year}-${month.toString().padStart(2, '0')}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const record: ConsistencyAnalysisRecord = JSON.parse(stored);
    console.log(`일관성 분석 결과 불러옴: ${year}-${month}`);
    return record;
  } catch (error) {
    console.error('일관성 분석 결과 불러오기 실패:', error);
    return null;
  }
}

export function hasConsistencyAnalysis(year: number, month: number): boolean {
  const key = `${STORAGE_KEY_PREFIX}${year}-${month.toString().padStart(2, '0')}`;
  return localStorage.getItem(key) !== null;
}

export function clearConsistencyAnalysis(year: number, month: number): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${year}-${month.toString().padStart(2, '0')}`;
    localStorage.removeItem(key);
    console.log(`일관성 분석 결과 삭제됨: ${year}-${month}`);
  } catch (error) {
    console.error('일관성 분석 결과 삭제 실패:', error);
  }
} 