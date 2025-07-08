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

export type Employee = {
  id: string;
  uniqueId: string;
  name: string;
  company: string;
  department: string;
  title: string;
  growthLevel: string;
  deductionHours: {
    attendance: number;
    shortened: number;
    total: number;
  };
  workRate: number;
  group: string;
  evaluatorId: string;
};

export type Grade = 'S' | 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'BC' | 'C-' | 'D' | null;

export type GradeInfo = {
  score: number;
  payoutRate: number;
  description: string;
};

export type Evaluation = {
  id: string;
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
  baseAmount: number;
  gradeAmount: number;
  finalAmount: number;
  evaluatorName: string;
};
