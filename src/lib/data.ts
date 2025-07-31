import type { User, Employee, Grade, Evaluation, GradeInfo, AttendanceType, HeaderMapping, Holiday } from './types';

export const mockUsers: User[] = [
  {
    "id": "user-admin",
    "employeeId": "Eadmin",
    "uniqueId": "admin",
    "name": "관리자",
    "roles": [
      "admin",
      "evaluator",
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=A",
    "title": "팀원",
    "department": "인사부"
  }
];

export const defaultGradingScale: Record<NonNullable<Grade>, GradeInfo> = {
  'S': { score: 150, payoutRate: 150, amount: 0, description: '최우수' },
  'A+': { score: 130, payoutRate: 130, amount: 0, description: '우수+' },
  'A': { score: 115, payoutRate: 115, amount: 0, description: '우수' },
  'B+': { score: 105, payoutRate: 105, amount: 0, description: '양호+' },
  'B': { score: 100, payoutRate: 100, amount: 0, description: '양호' },
  'B-': { score: 95, payoutRate: 95, amount: 0, description: '양호-' },
  'C': { score: 85, payoutRate: 85, amount: 0, description: '보통' },
  'C-': { score: 70, payoutRate: 70, amount: 0, description: '보통-' },
  'D': { score: 0, payoutRate: 0, amount: 0, description: '미흡' },
};

export const initialAttendanceTypes: AttendanceType[] = [
  {
    "id": "att-1",
    "name": "연차",
    "deductionDays": 1
  },
  {
    "id": "att-2",
    "name": "오전반차",
    "deductionDays": 0.5
  },
  {
    "id": "att-3",
    "name": "오후반차",
    "deductionDays": 0.5
  },
  {
    "id": "att-4",
    "name": "오전반반차",
    "deductionDays": 0.25
  },
  {
    "id": "att-5",
    "name": "오후반반차",
    "deductionDays": 0.25
  },
  {
    "id": "att-6",
    "name": "병가",
    "deductionDays": 1
  },
  {
    "id": "att-7",
    "name": "공가",
    "deductionDays": 1
  }
];

export const mockEmployees: Record<string, Partial<Employee>[]> = {
  "2025-1": [
    {
      "id": "Eadmin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "OKH",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 0.92,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": ""
    }
  ],
  "2025-2": [
    {
      "id": "Eadmin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "OKH",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 0.90,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": ""
    }
  ],
  "2025-3": [
    {
      "id": "Eadmin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "OKH",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 0.89,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": ""
    }
  ],
  "2025-4": [
    {
      "id": "Eadmin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "OKH",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 0.91,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": ""
    }
  ],
  "2025-5": [
    {
      "id": "Eadmin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "OKH",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 0.93,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": ""
    }
  ],
  "2025-6": [
    {
      "id": "Eadmin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "OKH",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 0.95,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": ""
    }
  ]
};

export const mockEvaluations: Record<string, Evaluation[]> = {
  "2025-1": [
    {
      "id": "eval-1-1", 
      "employeeId": "Eadmin",
      "year": 2025,
      "month": 1,
      "grade": "B+",
      "memo": "양호한 성과를 보여주었습니다."
    }
  ],
  "2025-2": [
    {
      "id": "eval-2-1", 
      "employeeId": "Eadmin",
      "year": 2025,
      "month": 2,
      "grade": "A",
      "memo": "안정적인 성과를 보여주었습니다."
    }
  ],
  "2025-3": [
    {
      "id": "eval-3-1", 
      "employeeId": "Eadmin",
      "year": 2025,
      "month": 3,
      "grade": "A+",
      "memo": "우수한 성과를 보여주었습니다."
    }
  ],
  "2025-4": [
    {
      "id": "eval-4-1", 
      "employeeId": "Eadmin",
      "year": 2025,
      "month": 4,
      "grade": "A",
      "memo": "안정적인 성과를 보여주었습니다."
    }
  ],
  "2025-5": [
    {
      "id": "eval-5-1", 
      "employeeId": "Eadmin",
      "year": 2025,
      "month": 5,
      "grade": "A+",
      "memo": "우수한 성과를 보여주었습니다."
    }
  ],
  "2025-6": [
    {
      "id": "eval-6-1", 
      "employeeId": "Eadmin",
      "year": 2025,
      "month": 6,
      "grade": "A+",
      "memo": "우수한 성과를 보여주었습니다."
    }
  ]
};

export const initialHolidays: Holiday[] = [];

export const excelHeaderMapping: Record<string, string> = {
    // 공통 ID
    "고유사번": "uniqueId", "사번": "uniqueId", "ID": "uniqueId", "id": "uniqueId",
    
    // 공통 이름
    "성명": "name", "이름": "name",
    
    // 피평가자 정보
    "피평가자 ID": "uniqueId",
    "피평가자": "name",
    "회사": "company",
    "부서": "department", "소속부서": "department",
    "직책": "title",
    "성장레벨": "growthLevel",
    "기준금액": "baseAmount", "개인별 기준금액": "baseAmount",
    "등급": "grade",
    "비고": "memo",

    // 평가자 정보
    "평가자 ID": "evaluatorId", "평가자사번": "evaluatorId",
    "평가자": "evaluatorName", "평가자명": "evaluatorName",
    
    // 근무 데이터 (단축/일근태)
    "시작일": "startDate", "시작일자": "startDate",
    "종료일": "endDate", "종료일자": "endDate",
    "출근시각": "startTime",
    "퇴근시각": "endTime",
    "일자": "date", "근태사용일": "date",
    "근태": "type", "근태종류": "type",
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

export const formatCurrency = (value: number) => {
  if (isNaN(value) || value === null) return '0';
  return new Intl.NumberFormat('ko-KR').format(value);
};

export const getDetailedGroup1 = (workRate: number): string => {
  if (workRate >= 0.7) return '70% 이상';
  if (workRate < 0.25) return '25% 미만';
  
  const percentage = workRate * 100;
  const lowerBound = Math.floor(percentage / 5) * 5;
  const upperBound = lowerBound + 4;
  
  return `${upperBound}%~${lowerBound}%`;
};
