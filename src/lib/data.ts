import type { User, Employee, Grade, Evaluation, GradeInfo, AttendanceType } from './types';

export const mockUsers: User[] = [
  { id: 'user-1', employeeId: 'E1911042', uniqueId: '1911042', name: '김민선', roles: ['admin', 'evaluator', 'employee'], avatar: 'https://placehold.co/100x100.png?text=A', title: '팀원', department: '인사부' },
  { id: 'user-admin', employeeId: 'Eadmin', uniqueId: 'admin', name: '김관리', roles: ['admin', 'evaluator', 'employee'], avatar: 'https://placehold.co/100x100.png?text=A', title: '팀원', department: '인사부' },
];

export const gradingScale: Record<NonNullable<Grade>, GradeInfo> = {
  S: { score: 150, payoutRate: 150, description: '최고 성과' },
  'A+': { score: 130, payoutRate: 130, description: '우수 성과' },
  A: { score: 115, payoutRate: 115, description: '좋은 성과' },
  'B+': { score: 105, payoutRate: 105, description: '기대 이상' },
  B: { score: 100, payoutRate: 100, description: '기대치 충족 (기준)' },
  'B-': { score: 95, payoutRate: 95, description: '기대 이하' },
  C: { score: 85, payoutRate: 85, description: '개선 필요' },
  'C-': { score: 70, payoutRate: 70, description: '상당한 개선 필요' },
  D: { score: 0, payoutRate: 0, description: '미흡' },
};

export const initialAttendanceTypes: AttendanceType[] = [
    { id: 'att-1', name: '연차', deductionDays: 1.00 },
    { id: 'att-2', name: '오전반차', deductionDays: 0.50 },
    { id: 'att-3', name: '오후반차', deductionDays: 0.50 },
    { id: 'att-4', name: '오전반반차', deductionDays: 0.25 },
    { id: 'att-5', name: '오후반반차', deductionDays: 0.25 },
    { id: 'att-6', name: '병가', deductionDays: 1.00 },
    { id: 'att-7', name: '공가', deductionDays: 1.00 },
];

export const mockEmployees: Employee[] = [
  { id: '1911042', uniqueId: '1911042', name: '김민선', company: 'OKH', department: '인사부', title: '팀원', position: '팀원', growthLevel: 'Lv.2', workRate: 1.0, evaluatorId: '1911042', baseAmount: 8000000, memo: '' },
  { id: 'admin', uniqueId: 'admin', name: '김관리', company: 'OKH', department: '인사부', title: '팀원', position: '팀원', growthLevel: 'Lv.3', workRate: 1.0, evaluatorId: 'admin', baseAmount: 8000000, memo: '' },
];

export const mockEvaluations: Evaluation[] = [
];

export const excelHeaderMapping: Record<string, string> = {
    '고유사번': 'uniqueId', '사번': 'uniqueId', 'ID': 'uniqueId',
    '성명': 'name', '이름': 'name', '피평가자': 'name',
    '회사': 'company',
    '부서': 'department', '소속부서': 'department',
    '직책': 'title',
    '성장레벨': 'growthLevel',
    '근무율': 'workRate', '실근무율': 'workRate',
    '기준금액': 'baseAmount', '개인별 기준금액': 'baseAmount',
    '평가자 ID': 'evaluatorId', '평가자사번': 'evaluatorId',
    '평가자': 'evaluatorName',
    '등급': 'grade',
    '비고': 'memo',
    '시작일': 'startDate', '시작일자': 'startDate',
    '종료일': 'endDate', '종료일자': 'endDate',
    '출근시각': 'startTime',
    '퇴근시각': 'endTime',
    '일자': 'date', '근태사용일': 'date',
    '근태': 'type', '근태종류': 'type',
};

export const calculateFinalAmount = (gradeAmount: number, workRate: number): number => {
  let calculatedAmount = 0;
  if (workRate >= 0.7) {
    calculatedAmount = gradeAmount;
  } else if (workRate >= 0.25) {
    calculatedAmount = gradeAmount * workRate;
  }
  return Math.ceil(calculatedAmount / 10) * 10;
};

export const positionSortOrder: Record<string, number> = {
  '지부장': 1,
  '센터장': 2,
  '팀장': 3,
  '지점장': 4,
  '팀원': 99,
};

export function getPositionSortValue(title: string): number {
    return positionSortOrder[title] || 98; // other titles
}

export const getDetailedGroup1 = (workRate: number): string => {
  if (workRate >= 0.7) return '70% 이상';
  if (workRate < 0.25) return '25% 미만';
  
  const percentage = workRate * 100;
  const lowerBound = Math.floor(percentage / 5) * 5;
  const upperBound = lowerBound + 4;
  
  return `${upperBound}%~${lowerBound}%`;
};
