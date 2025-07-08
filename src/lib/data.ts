import type { User, Role, Employee, Grade, Evaluation, EvaluationGroup, GradeInfo, EvaluationResult, Company } from './types';

export const gradingScale: Record<NonNullable<Grade>, GradeInfo> = {
  'S': { score: 150, payoutRate: 1.5, description: '최고 성과' },
  'A+': { score: 130, payoutRate: 1.3, description: '우수 성과' },
  'A': { score: 115, payoutRate: 1.15, description: '좋은 성과' },
  'B+': { score: 105, payoutRate: 1.05, description: '기대 이상' },
  'B': { score: 100, payoutRate: 1.0, description: '기대치 충족 (기준)' },
  'B-': { score: 95, payoutRate: 0.95, description: '기대 이하' },
  'BC': { score: 85, payoutRate: 0.85, description: '개선 필요' },
  'C-': { score: 70, payoutRate: 0.7, description: '상당한 개선 필요' },
  'D': { score: 0, payoutRate: 0, description: '미흡' },
};

export const baseCompensationAmount = 5000000;
const businessDaysInMonth = 21;

export const mockUsers: User[] = [
  { id: 'user-1', employeeId: 'E001', name: '김관리', role: 'admin', avatar: 'https://placehold.co/100x100.png', title: '인사팀장', department: '인사팀' },
  { id: 'user-2', employeeId: 'E002', name: '박평가', role: 'evaluator', avatar: 'https://placehold.co/100x100.png', title: '개발팀장', department: '제품 개발' },
  { id: 'user-3', employeeId: 'E003', name: '이직원', role: 'employee', avatar: 'https://placehold.co/100x100.png', title: '소프트웨어 엔지니어', department: '제품 개발' },
];

export const mockEmployees: Employee[] = [
  { id: 'E003', uniqueId: '003', name: '이주임', company: 'OK', department: '제품 개발', title: '소프트웨어 엔지니어', growthLevel: 'Lv.2', deductionHours: { attendance: 8, shortened: 0, total: 8 }, workRate: 0.95, group: 'Lv.2~3', evaluatorId: 'user-2' },
  { id: 'E004', uniqueId: '004', name: '최사원', company: 'OC', department: '제품 개발', title: '소프트웨어 엔지니어', growthLevel: 'Lv.1', deductionHours: { attendance: 0, shortened: 0, total: 0 }, workRate: 1.0, group: 'Lv.1', evaluatorId: 'user-2' },
  { id: 'E005', uniqueId: '005', name: '정대리', company: 'OCI', department: '디자인', title: 'UX 디자이너', growthLevel: 'Lv.3', deductionHours: { attendance: 16, shortened: 8, total: 24 }, workRate: 0.86, group: 'Lv.2~3', evaluatorId: 'user-2' },
  { id: 'E006', uniqueId: '006', name: '윤과장', company: 'OFI', department: '마케팅', title: '마케팅 매니저', growthLevel: 'Lv.4', deductionHours: { attendance: 40, shortened: 0, total: 40 }, workRate: 0.76, group: '팀장/지점장', evaluatorId: 'user-1' },
  { id: 'E007', uniqueId: '007', name: '오차장', company: 'EX', department: 'QA', title: 'QA 스페셜리스트', growthLevel: 'Lv.3', deductionHours: { attendance: 80, shortened: 0, total: 80 }, workRate: 0.52, group: 'Lv.2~3', evaluatorId: 'user-2' },
  { id: 'E008', uniqueId: '008', name: '강부장', company: 'OKDS', department: '영업', title: '영업 이사', growthLevel: 'Lv.5', deductionHours: { attendance: 150, shortened: 0, total: 150 }, workRate: 0.11, group: '별도평가', evaluatorId: 'user-1' },
];

export const mockEvaluations: Evaluation[] = [
  { id: 'eval-1', employeeId: 'E003', year: 2025, month: 7, grade: 'A+' },
  { id: 'eval-2', employeeId: 'E004', year: 2025, month: 7, grade: 'B+' },
  { id: 'eval-3', employeeId: 'E005', year: 2025, month: 7, grade: 'B' },
  { id: 'eval-4', employeeId: 'E006', year: 2025, month: 7, grade: 'A' },
  { id: 'eval-5', employeeId: 'E007', year: 2025, month: 7, grade: 'B-' },
  { id: 'eval-6', employeeId: 'E008', year: 2025, month: 7, grade: 'C-' },
];

export const mockEvaluationGroups: EvaluationGroup[] = [
    { id: 'group-1', name: 'Lv.1 그룹', evaluatorId: 'user-2', memberIds: ['E004'], totalScore: 100 },
    { id: 'group-2', name: 'Lv.2-3 그룹', evaluatorId: 'user-2', memberIds: ['E003', 'E005', 'E007'], totalScore: 300 },
    { id: 'group-3', name: 'Lv.4+ 그룹', evaluatorId: 'user-1', memberIds: ['E006', 'E008'], totalScore: 200 },
];

export const calculateFinalAmount = (gradeAmount: number, workRate: number): number => {
  if (workRate >= 0.7) {
    return gradeAmount;
  }
  if (workRate >= 0.25) {
    return gradeAmount * workRate;
  }
  return 0;
};

const getDetailedGroup1 = (workRate: number): string => {
    if (workRate >= 0.7) return 'A. 70% 이상';
    if (workRate < 0.25) return 'C. 25% 미만';
    
    const ratePercent = Math.floor(workRate * 100);
    if (ratePercent >= 65) return 'B. 69~65%';
    if (ratePercent >= 60) return 'B. 64~60%';
    if (ratePercent >= 55) return 'B. 59~55%';
    if (ratePercent >= 50) return 'B. 54~50%';
    if (ratePercent >= 45) return 'B. 49~45%';
    if (ratePercent >= 40) return 'B. 44~40%';
    if (ratePercent >= 35) return 'B. 39~35%';
    if (ratePercent >= 30) return 'B. 34~30%';
    if (ratePercent >= 25) return 'B. 29~25%';
    return `B. ${ratePercent}%`;
}


export const getFullEvaluationResults = (): EvaluationResult[] => {
  return mockEmployees.map(employee => {
    const evaluation = mockEvaluations.find(e => e.employeeId === employee.id);
    const grade = evaluation?.grade || null;
    const score = grade ? gradingScale[grade].score : 0;
    const payoutRate = grade ? gradingScale[grade].payoutRate : 0;
    
    const gradeAmount = baseCompensationAmount * payoutRate;
    const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
    const evaluator = mockUsers.find(u => u.id === employee.evaluatorId);

    const detailedGroup1 = getDetailedGroup1(employee.workRate);
    const detailedGroup2 = `${employee.title} / ${employee.growthLevel}`;

    return {
      ...employee,
      grade,
      score,
      baseAmount: baseCompensationAmount,
      gradeAmount,
      finalAmount,
      evaluatorName: evaluator?.name || 'N/A',
      detailedGroup1,
      detailedGroup2,
    };
  });
};
