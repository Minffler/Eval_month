export type Role = 'admin' | 'evaluator' | 'employee' | null;

export type User = {
  id: string; // 내부 시스템용 ID (페이지 키 등으로 사용)
  employeeId: string; // Employee.id와 연결
  uniqueId: string; // 사용자 ID (고유사번)
  name: string;
  roles: Role[];
  avatar: string;
  title: string;
  department: string;
};

export type Company = 'OK' | 'OC' | 'OCI' | 'OFI' | 'EX' | 'OKDS' | 'OKH' | 'OKIP' | 'OKV' | 'OT';

export type Employee = {
  id: string; // 내부 시스템용 ID (E + uniqueId)
  uniqueId: string; // 사용자 ID (고유사번)
  name: string; // 이름
  company: string; // 회사
  department: string; // 소속부서
  title: string; // 직책
  position: string; // 호칭
  growthLevel: string; // 성장레벨
  workRate: number; // 근무율
  evaluatorId: string; // 평가자 ID (고유사번)
  baseAmount: number; // 개인별 기준금액
  group: string; // 평가그룹
  memo?: string;
};

export type Grade = 'S' | 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'C' | 'C-' | 'D' | null;

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
  memo?: string;
};

export type EvaluationGroupCategory = '전체' | '70% 이상' | '별도평가' | '미평가';


export type EvaluationGroup = {
  id: string;
  name: string;
  evaluatorId: string;
  memberIds: string[];
  totalScore: number;
};

export type EvaluationResult = Employee & {
  year: number;
  month: number;
  grade: Grade;
  score: number;
  payoutRate: number;
  gradeAmount: number; // 등급금액
  finalAmount: number; // 최종금액
  evaluatorName: string; // 평가자 이름
  detailedGroup1: string; // 세부구분1(근무율)
  detailedGroup2: string; // 세부구분2(직책/성장레벨별 구분)
  memo?: string;
};

export type EvaluatorView = 'evaluation-input' | 'all-results' | 'assignment-management';

export type EvaluationUploadData = {
  employeeId: string;
  grade: Grade;
  memo?: string;
} & Partial<Omit<Employee, 'id' | 'uniqueId'>>;
