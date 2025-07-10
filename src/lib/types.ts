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

export type EvaluationGroupCategory = '전체' | 'A. 정규평가' | 'B. 별도평가' | 'C. 미평가';


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
  evaluationGroup: string; // 평가그룹(근무율 기준)
  detailedGroup1: string; // 세부구분1(근무율별 상세구분)
  detailedGroup2: string; // 세부구분2(직책/성장레벨별 구분)
  memo?: string;
};

export type EvaluatorView = 'evaluation-input' | 'all-results' | 'assignment-management' | 'notifications';

export type EvaluationUploadData = {
  employeeId: string;
  grade: Grade;
  memo?: string;
  evaluatorName?: string;
} & Partial<Omit<Employee, 'id' | 'uniqueId'>>;

export type AppNotification = {
  id: string;
  date: string; // ISO date string
  message: string;
  isRead: boolean;
  recipientId: string; // uniqueId of the user who should see this
};

export type AttendanceType = {
  id: string;
  name: string;
  deductionDays: number;
};

// 근무율 산출을 위한 데이터 타입
export type ShortenedWorkHourRecord = {
    uniqueId: string;
    name: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
}

export type DailyAttendanceRecord = {
    uniqueId: string;
    name: string;
    date: string;
    type: string;
}

export type WorkRateInputs = {
    shortenedWorkHours: ShortenedWorkHourRecord[];
    dailyAttendance: DailyAttendanceRecord[];
}

export type Holiday = {
    id: string;
    date: string; // YYYY-MM-DD
    name: string;
}
