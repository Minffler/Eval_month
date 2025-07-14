import type { User, Employee, Grade, Evaluation, GradeInfo, AttendanceType } from './types';

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
  { id: 'E1911042', uniqueId: '1911042', name: '김관리', company: 'OK', department: '인사기획팀', title: '팀원', position: '팀원', growthLevel: 'Lv.5', workRate: 1.0, evaluatorId: '1911042', baseAmount: 8000000, memo: '' },
  { id: 'E0000002', uniqueId: '0000002', name: '박평가', company: 'OK', department: '제품 개발', title: '팀장', position: '팀장', growthLevel: 'Lv.4', workRate: 1.0, evaluatorId: '1911042', baseAmount: 7500000, memo: '' },
  { id: 'E0000003', uniqueId: '0000003', name: '이주임', company: 'OK', department: '제품 개발', title: '팀원', position: '팀원', growthLevel: 'Lv.2', workRate: 1.0, evaluatorId: '0000002', baseAmount: 5000000, memo: '프로젝트 기여도 높음' },
  { id: 'E0000004', uniqueId: '0000004', name: '최사원', company: 'OC', department: '제품 개발', title: '팀원', position: '팀원', growthLevel: 'Lv.1', workRate: 1.0, evaluatorId: '0000002', baseAmount: 4500000, memo: '' },
  { id: 'E0000005', uniqueId: '0000005', name: '정대리', company: 'OCI', department: '디자인', title: '팀원', position: '팀원', growthLevel: 'Lv.3', workRate: 1.0, evaluatorId: '0000002', baseAmount: 5500000, memo: '마감일 준수' },
  { id: 'E0000006', uniqueId: '0000006', name: '윤과장', company: 'OFI', department: '마케팅', title: '팀원', position: '팀원', growthLevel: 'Lv.4', workRate: 1.0, evaluatorId: '0000006', baseAmount: 6500000, memo: '' },
];

export const mockEvaluations: Evaluation[] = [
  { id: 'eval-E0000003', employeeId: 'E0000003', year: 2025, month: 7, grade: 'A', memo: '프로젝트 기여도 높음' },
  { id: 'eval-E0000004', employeeId: 'E0000004', year: 2025, month: 7, grade: 'B+', memo: '' },
  { id: 'eval-E0000005', employeeId: 'E0000005', year: 2025, month: 7, grade: 'B', memo: '마감일 준수' },
  { id: 'eval-E0000006', employeeId: 'E0000006', year: 2025, month: 7, grade: null, memo: '' },
  { id: 'eval-E1911042', employeeId: 'E1911042', year: 2025, month: 7, grade: null, memo: '' },
  { id: 'eval-E0000002', employeeId: 'E0000002', year: 2025, month: 7, grade: null, memo: '' },
];


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
