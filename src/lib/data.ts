import type { User, Role, Employee, Grade, Evaluation, EvaluationGroup, GradeInfo, EvaluationResult } from './types';

export const gradingScale: Record<NonNullable<Grade>, GradeInfo> = {
  'S': { score: 150, payoutRate: 1.5, description: 'Outstanding performance' },
  'A+': { score: 130, payoutRate: 1.3, description: 'Excellent performance' },
  'A': { score: 115, payoutRate: 1.15, description: 'Good performance' },
  'B+': { score: 105, payoutRate: 1.05, description: 'Above expectations' },
  'B': { score: 100, payoutRate: 1.0, description: 'Meets expectations (Base)' },
  'B-': { score: 95, payoutRate: 0.95, description: 'Below expectations' },
  'BC': { score: 85, payoutRate: 0.85, description: 'Needs improvement' },
  'C-': { score: 70, payoutRate: 0.7, description: 'Significant improvement needed' },
  'D': { score: 0, payoutRate: 0, description: 'Unsatisfactory performance' },
};

export const baseCompensationAmount = 5000000;
const businessDaysInMonth = 21;

export const mockUsers: User[] = [
  { id: 'user-1', employeeId: 'E001', name: '김인사', role: 'admin', avatar: 'https://placehold.co/100x100.png', title: 'HR Manager', department: 'Human Resources' },
  { id: 'user-2', employeeId: 'E002', name: '박팀장', role: 'evaluator', avatar: 'https://placehold.co/100x100.png', title: 'Team Lead', department: 'Product Development' },
  { id: 'user-3', employeeId: 'E003', name: '이주임', role: 'employee', avatar: 'https://placehold.co/100x100.png', title: 'Software Engineer', department: 'Product Development' },
];

export const mockEmployees: Employee[] = [
  { id: 'E003', uniqueId: 'U003', name: '이주임', company: 'EvalMax Corp', department: 'Product Development', title: 'Software Engineer', growthLevel: 'Lv.2', deductionHours: { attendance: 8, shortened: 0, total: 8 }, workRate: 0.95, group: 'Lv.2-3 Group', evaluatorId: 'user-2' },
  { id: 'E004', uniqueId: 'U004', name: '최사원', company: 'EvalMax Corp', department: 'Product Development', title: 'Software Engineer', growthLevel: 'Lv.1', deductionHours: { attendance: 0, shortened: 0, total: 0 }, workRate: 1.0, group: 'Lv.1 Group', evaluatorId: 'user-2' },
  { id: 'E005', uniqueId: 'U005', name: '정대리', company: 'EvalMax Corp', department: 'Design', title: 'UX Designer', growthLevel: 'Lv.3', deductionHours: { attendance: 16, shortened: 8, total: 24 }, workRate: 0.86, group: 'Lv.2-3 Group', evaluatorId: 'user-2' },
  { id: 'E006', uniqueId: 'U006', name: '윤과장', company: 'EvalMax Corp', department: 'Marketing', title: 'Marketing Manager', growthLevel: 'Lv.4', deductionHours: { attendance: 40, shortened: 0, total: 40 }, workRate: 0.76, group: 'Lv.4+ Group', evaluatorId: 'user-1' },
  { id: 'E007', uniqueId: 'U007', name: '오차장', company: 'EvalMax Corp', department: 'QA', title: 'QA Specialist', growthLevel: 'Lv.3', deductionHours: { attendance: 80, shortened: 0, total: 80 }, workRate: 0.52, group: 'Lv.2-3 Group', evaluatorId: 'user-2' },
  { id: 'E008', uniqueId: 'U008', name: '강부장', company: 'EvalMax Corp', department: 'Sales', title: 'Sales Director', growthLevel: 'Lv.5', deductionHours: { attendance: 150, shortened: 0, total: 150 }, workRate: 0.11, group: 'Lv.4+ Group', evaluatorId: 'user-1' },
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
  { id: 'group-1', name: 'Lv.1 Group', evaluatorId: 'user-2', memberIds: ['E004'], totalScore: 100 },
  { id: 'group-2', name: 'Lv.2-3 Group', evaluatorId: 'user-2', memberIds: ['E003', 'E005', 'E007'], totalScore: 300 },
  { id: 'group-3', name: 'Lv.4+ Group', evaluatorId: 'user-1', memberIds: ['E006', 'E008'], totalScore: 200 },
];

export const calculateWorkRate = (totalDeductionHours: number): number => {
  return Math.max(0, (1 - (totalDeductionHours / (businessDaysInMonth * 8))));
};

export const calculateFinalAmount = (gradeAmount: number, workRate: number): number => {
  if (workRate >= 0.7) {
    return gradeAmount;
  }
  if (workRate >= 0.25) {
    return gradeAmount * workRate;
  }
  return 0;
};

export const getFullEvaluationResults = (): EvaluationResult[] => {
  return mockEmployees.map(employee => {
    const evaluation = mockEvaluations.find(e => e.employeeId === employee.id);
    const grade = evaluation?.grade || null;
    const score = grade ? gradingScale[grade].score : 0;
    const payoutRate = grade ? gradingScale[grade].payoutRate : 0;
    
    const gradeAmount = baseCompensationAmount * payoutRate;
    const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
    const evaluator = mockUsers.find(u => u.id === employee.evaluatorId);

    return {
      ...employee,
      grade,
      score,
      baseAmount: baseCompensationAmount,
      gradeAmount,
      finalAmount,
      evaluatorName: evaluator?.name || 'N/A',
    };
  });
};
