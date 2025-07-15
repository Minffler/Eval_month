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

export type EvaluatorView = 'evaluation-input' | 'all-results' | 'assignment-management' | 'notifications' | 'approvals' | 'work-rate-view' | 'shortened-work-details' | 'daily-attendance-details';
export type EmployeeView = 'my-review' | 'my-work-rate' | 'my-shortened-work' | 'my-daily-attendance' | 'notifications' | 'approvals';

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
  isImportant?: boolean;
};

export type ApprovalStatus = '결재중' | '현업승인' | '최종승인' | '반려';

export type Approval<T = any> = {
  id: string;
  date: string; // ISO date string
  requesterId: string; // 요청자
  requesterName: string;
  approverTeamId: string; // 현업 결재자
  approverHRId: string; // 인사부 결재자 (admin)
  status: ApprovalStatus;
  statusHR: ApprovalStatus;
  approvedAtTeam: string | null;
  approvedAtHR: string | null;
  rejectionReason: string;
  isRead: boolean;
  type: 'workDataChange'; // 결재 종류 (향후 확장 가능)
  payload: {
    dataType: 'shortenedWorkHours' | 'dailyAttendance';
    action: 'add' | 'edit' | 'delete';
    data: T;
  };
};

export type AttendanceType = {
  id: string;
  name: string;
  deductionDays: number;
};

// 근무율 산출을 위한 데이터 타입
export type ShortenedWorkType = '임신' | '육아/돌봄';

export type ShortenedWorkHourRecord = {
    uniqueId: string;
    name: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    type: ShortenedWorkType;
    lastModified?: string;
    rowId?: string; // 클라이언트에서 생성된 고유 식별자
}

export type DailyAttendanceRecord = {
    uniqueId: string;
    name: string;
    date: string;
    type: string;
    lastModified?: string;
    rowId?: string; // 클라이언트에서 생성된 고유 식별자
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
