import type { User, Employee, Grade, Evaluation, GradeInfo } from './types';

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

export const mockUsers: User[] = [
  { id: 'user-1', employeeId: 'E001', name: '김관리', roles: ['admin'], avatar: 'https://placehold.co/100x100.png', title: '인사팀장', department: '인사팀' },
  { id: 'user-2', employeeId: 'E002', name: '박평가', roles: ['evaluator', 'employee'], avatar: 'https://placehold.co/100x100.png', title: '개발팀장', department: '제품 개발' },
  { id: 'user-3', employeeId: 'E003', name: '이주임', roles: ['employee'], avatar: 'https://placehold.co/100x100.png', title: '소프트웨어 엔지니어', department: '제품 개발' },
  { id: 'user-4', employeeId: 'E004', name: '최사원', roles: ['employee'], avatar: 'https://placehold.co/100x100.png', title: '소프트웨어 엔지니어', department: '제품 개발' },
  { id: 'user-5', employeeId: 'E005', name: '정대리', roles: ['employee'], avatar: 'https://placehold.co/100x100.png', title: 'UX 디자이너', department: '디자인' },
  { id: 'user-6', employeeId: 'E006', name: '윤과장', roles: ['evaluator', 'employee'], avatar: 'https://placehold.co/100x100.png', title: '마케팅 매니저', department: '마케팅' },
  { id: 'user-7', employeeId: 'E007', name: '오차장', roles: ['employee'], avatar: 'https://placehold.co/100x100.png', title: 'QA 스페셜리스트', department: 'QA' },
  { id: 'user-8', employeeId: 'E008', name: '강부장', roles: ['employee'], avatar: 'https://placehold.co/100x100.png', title: '영업 이사', department: '영업' },
  { id: 'user-9', employeeId: 'E009', name: '한센터', roles: ['evaluator', 'employee'], avatar: 'https://placehold.co/100x100.png', title: '센터장', department: '고객센터' },
];

export const mockEmployees: Employee[] = [
  { id: 'E001', uniqueId: '1911042', name: '김관리', company: 'OK', department: '인사팀', title: '인사팀장', position: '팀장', growthLevel: 'Lv.5', workRate: 1.0, group: '지점장/팀장', evaluatorId: 'user-1', baseAmount: 8000000 },
  { id: 'E002', uniqueId: '0000002', name: '박평가', company: 'OK', department: '제품 개발', title: '개발팀장', position: '팀장', growthLevel: 'Lv.4', workRate: 1.0, group: '지점장/팀장', evaluatorId: 'user-1', baseAmount: 7500000 },
  { id: 'E003', uniqueId: '0000003', name: '이주임', company: 'OK', department: '제품 개발', title: '소프트웨어 엔지니어', position: '주임', growthLevel: 'Lv.2', workRate: 0.95, group: 'Lv.2~3', evaluatorId: 'user-2', baseAmount: 5000000 },
  { id: 'E004', uniqueId: '0000004', name: '최사원', company: 'OC', department: '제품 개발', title: '소프트웨어 엔지니어', position: '사원', growthLevel: 'Lv.1', workRate: 1.0, group: 'Lv.1', evaluatorId: 'user-2', baseAmount: 4500000 },
  { id: 'E005', uniqueId: '0000005', name: '정대리', company: 'OCI', department: '디자인', title: 'UX 디자이너', position: '대리', growthLevel: 'Lv.3', workRate: 0.86, group: 'Lv.2~3', evaluatorId: 'user-2', baseAmount: 5500000 },
  { id: 'E006', uniqueId: '0000006', name: '윤과장', company: 'OFI', department: '마케팅', title: '마케팅 매니저', position: '과장', growthLevel: 'Lv.4', workRate: 0.76, group: 'Lv.2~3', evaluatorId: 'user-6', baseAmount: 6500000 },
  { id: 'E007', uniqueId: '0000007', name: '오차장', company: 'EX', department: 'QA', title: 'QA 스페셜리스트', position: '차장', growthLevel: 'Lv.3', workRate: 0.52, group: 'Lv.2~3', evaluatorId: 'user-2', baseAmount: 6000000 },
  { id: 'E008', uniqueId: '0000008', name: '강부장', company: 'OKDS', department: '영업', title: '영업 이사', position: '부장', growthLevel: 'Lv.5', workRate: 0.11, group: '별도평가', evaluatorId: 'user-1', baseAmount: 7000000 },
  { id: 'E009', uniqueId: '0000009', name: '한센터', company: 'OK', department: '고객센터', title: '센터장', position: '센터장', growthLevel: 'Lv.5', workRate: 1.0, group: '센터장/지부장', evaluatorId: 'user-9', baseAmount: 7800000 },
];

export const mockEvaluations: Evaluation[] = [
  { id: 'eval-1', employeeId: 'E003', year: 2025, month: 7, grade: 'A+', memo: '프로젝트 기여도 높음' },
  { id: 'eval-2', employeeId: 'E004', year: 2025, month: 7, grade: 'B+' },
  { id: 'eval-3', employeeId: 'E005', year: 2025, month: 7, grade: 'B', memo: '마감일 준수' },
  { id: 'eval-4', employeeId: 'E006', year: 2025, month: 7, grade: 'A' },
  { id: 'eval-5', employeeId: 'E007', year: 2025, month: 7, grade: 'B-' },
  { id: 'eval-6', employeeId: 'E008', year: 2025, month: 7, grade: 'C' },
  { id: 'eval-7', employeeId: 'E001', year: 2025, month: 7, grade: 'S' },
  { id: 'eval-8', employeeId: 'E002', year: 2025, month: 7, grade: 'A' },
  { id: 'eval-9', employeeId: 'E009', year: 2025, month: 7, grade: 'A' },
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
