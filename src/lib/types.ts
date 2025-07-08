export type Role = 'admin' | 'evaluator' | 'employee';

export type User = {
  id: string;
  employeeId: string;
  name: string;
  role: Role;
  avatar: string;
  title: string;
  department: string;
};

export type Company = 'OK' | 'OC' | 'OCI' | 'OFI' | 'EX' | 'OKDS' | 'OKH' | 'OKIP' | 'OKV' | 'OT';

export type Employee = {
  id: string; // 사번
  uniqueId: string; // 고유사번
  name: string; // 이름
  company: Company; // 회사
  department: string; // 소속부서
  title: string; // 직책
  position: string; // 호칭
  growthLevel: string; // 성장레벨
  deductionHours: {
    attendance: number; // 차감시간(근태)
    shortened: number; // 차감시간(단축)
    total: number; // 차감시간(근태+단축)
  };
  workRate: number; // 근무율
  group: string; // 그룹구분
  evaluatorId: string;
  baseAmount: number; // 개인별 기준금액
};

export type Grade = 'S' | 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'BC' | 'C-' | 'D' | null;

export type GradeInfo = {
  score: number;
  payoutRate: number;
  description: string;
};

export type Evaluation = {
  id:string;
  employeeId: string;
  year: number;
  month: number;
  grade: Grade;
};

export type EvaluationGroup = {
  id: string;
  name: string;
  evaluatorId: string;
  memberIds: string[];
  totalScore: number;
};

export type EvaluationResult = Employee & {
  grade: Grade;
  score: number;
  payoutRate: number;
  gradeAmount: number; // 등급금액
  finalAmount: number; // 최종금액
  evaluatorName: string;
  detailedGroup1: string; // 세부구분1(근무율)
  detailedGroup2: string; // 세부구분2(직책/성장레벨별 구분)
};
