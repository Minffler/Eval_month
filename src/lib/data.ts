import type { User, Employee, Grade, Evaluation, GradeInfo, AttendanceType, HeaderMapping, Holiday } from './types';

export const mockUsers: User[] = [
  {
    "id": "user-admin",
    "employeeId": "Eadmin",
    "uniqueId": "admin",
    "name": "김관리",
    "roles": [
      "admin",
      "evaluator"
    ],
    "avatar": "https://placehold.co/100x100.png?text=A",
    "title": "팀원",
    "department": "인사부"
  }
];

export const gradingScale: Record<NonNullable<Grade>, GradeInfo> = {
  "S": {
    "score": 150,
    "payoutRate": 150,
    "description": "최고 성과"
  },
  "A+": {
    "score": 130,
    "payoutRate": 130,
    "description": "우수 성과"
  },
  "A": {
    "score": 115,
    "payoutRate": 115,
    "description": "좋은 성과"
  },
  "B+": {
    "score": 105,
    "payoutRate": 105,
    "description": "기대 이상"
  },
  "B": {
    "score": 100,
    "payoutRate": 100,
    "description": "기대치 충족 (기준)"
  },
  "B-": {
    "score": 95,
    "payoutRate": 95,
    "description": "기대 이하"
  },
  "C": {
    "score": 85,
    "payoutRate": 85,
    "description": "개선 필요"
  },
  "C-": {
    "score": 70,
    "payoutRate": 70,
    "description": "상당한 개선 필요"
  },
  "D": {
    "score": 0,
    "payoutRate": 0,
    "description": "미흡"
  }
};

export const initialAttendanceTypes: AttendanceType[] = [
  {
    "id": "att-1752539390040-0.43708339740241187",
    "name": "가족돌봄휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.8600289269946465",
    "name": "가족돌봄휴직",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.2834111161336621",
    "name": "결근",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.8453210432552445",
    "name": "경조휴가",
    "deductionDays": 1
  },
  {
    "id": "att-7",
    "name": "공가",
    "deductionDays": 1
  },
  {
    "id": "att-1752709882586",
    "name": "난임치료휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752709920135",
    "name": "대기발령",
    "deductionDays": 1
  },
  {
    "id": "att-1752709914658",
    "name": "명령휴직",
    "deductionDays": 1
  },
  {
    "id": "att-1752709944969",
    "name": "무급휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752709943678",
    "name": "무단결근",
    "deductionDays": 1
  },
  {
    "id": "att-6",
    "name": "병가",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.8971776875145197",
    "name": "보건휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.7344014112808761",
    "name": "연차(1년미만)",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.5333859035780778",
    "name": "연차휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.8800839231440238",
    "name": "유산휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.5862032989597719",
    "name": "육아휴직",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.62526242425624",
    "name": "인병휴직(무급)",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.30246647655655434",
    "name": "자유휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752710116199",
    "name": "정직",
    "deductionDays": 1
  },
  {
    "id": "att-1752710132178",
    "name": "청원휴직",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.8391113114108122",
    "name": "출산휴가",
    "deductionDays": 1
  },
  {
    "id": "att-1752539390040-0.4808296766365241",
    "name": "건강검진(오전)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752539390040-0.8646152617567209",
    "name": "건강검진(오후)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752539390040-0.7657984067337607",
    "name": "공가(오전)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752539390040-0.4148133647409026",
    "name": "공가(오후)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752709942122",
    "name": "무단결근(반일)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752539390040-0.8347733198598951",
    "name": "반차(오전)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752709982098",
    "name": "반차(오전)(1년미만)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752539390040-0.693813999181229",
    "name": "반차(오후)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752539390040-0.9127865276213667",
    "name": "반차(오후)(1년미만)",
    "deductionDays": 0.5
  },
  {
    "id": "att-1752539390040-0.5727526466475253",
    "name": "반반차(오전)",
    "deductionDays": 0.25
  },
  {
    "id": "att-1752709982787",
    "name": "반반차(오전)(1년미만)",
    "deductionDays": 0.25
  },
  {
    "id": "att-1752539390040-0.42005587751365636",
    "name": "반반차(오후)",
    "deductionDays": 0.25
  },
  {
    "id": "att-1752539390040-0.9397542463038702",
    "name": "반반차(오후)(1년미만)",
    "deductionDays": 0.25
  },
  {
    "id": "att-1752709892381",
    "name": "교육",
    "deductionDays": 0
  },
  {
    "id": "att-1752539390040-0.1604328370700735",
    "name": "대체반차(오전)",
    "deductionDays": 0
  },
  {
    "id": "att-1752539390040-0.2303215011705021",
    "name": "대체반차(오후)",
    "deductionDays": 0
  },
  {
    "id": "att-1752539390040-0.21665336905984234",
    "name": "대체휴무(종일)",
    "deductionDays": 0
  },
  {
    "id": "att-1752539390040-0.819947120862848",
    "name": "지각",
    "deductionDays": 0
  }
];

export const mockEmployees: Record<string, Partial<Employee>[]> = {
  "2025-6": []
};

export const mockEvaluations: Record<string, Evaluation[]> = {
  "2025-6": []
};

export const initialHolidays: Holiday[] = [
  {
    "id": "hol-1752710200434",
    "date": "2025-01-01",
    "name": "신정"
  },
  {
    "id": "hol-1752710231684",
    "date": "2025-01-27",
    "name": "설날_임시공휴일"
  },
  {
    "id": "hol-1752710258354",
    "date": "2025-01-28",
    "name": "설날(-1)"
  },
  {
    "id": "hol-1752710304704",
    "date": "2025-01-29",
    "name": "설날"
  },
  {
    "id": "hol-1752710328536",
    "date": "2025-01-30",
    "name": "설날(+1)"
  },
  {
    "id": "hol-1752710346350",
    "date": "2025-03-03",
    "name": "삼일절_대체휴일"
  },
  {
    "id": "hol-1752710361676",
    "date": "2025-05-01",
    "name": "근로자의날"
  },
  {
    "id": "hol-1752710373320",
    "date": "2025-05-05",
    "name": "석가탄신일, 어린이날"
  },
  {
    "id": "hol-1752710405927",
    "date": "2025-05-06",
    "name": "석가탄신일_대체휴일"
  },
  {
    "id": "hol-1752558168913",
    "date": "2025-06-03",
    "name": "대통령선거"
  },
  {
    "id": "hol-1752710434726",
    "date": "2025-06-06",
    "name": "현충일"
  },
  {
    "id": "hol-1752710453500",
    "date": "2025-08-15",
    "name": "광복절"
  },
  {
    "id": "hol-1752710478647",
    "date": "2025-10-03",
    "name": "개천절"
  },
  {
    "id": "hol-1752710478349",
    "date": "2025-10-05",
    "name": "추석(-1)"
  },
  {
    "id": "hol-1752710478210",
    "date": "2025-10-06",
    "name": "추석"
  },
  {
    "id": "hol-1752710477961",
    "date": "2025-10-07",
    "name": "추석(+1)"
  },
  {
    "id": "hol-1752710477382",
    "date": "2025-10-08",
    "name": "추석_대체휴일"
  },
  {
    "id": "hol-1752710587423",
    "date": "2025-10-09",
    "name": "한글날"
  },
  {
    "id": "hol-1752710583783",
    "date": "2025-12-25",
    "name": "성탄절"
  }
];


export const excelHeaderMapping: Record<string, string> = {
    // 키: 엑셀에서 사용될 수 있는 헤더 이름
    // 값: 시스템 내부에서 사용하는 필드 이름
    "고유사번": "uniqueId", "사번": "uniqueId", "ID": "uniqueId", "id": "uniqueId", "피평가자 ID": "uniqueId", "평가자 ID": "uniqueId",
    "성명": "name", "이름": "name", "피평가자": "name", "평가자": "name",
    "회사": "company",
    "부서": "department", "소속부서": "department",
    "직책": "title",
    "성장레벨": "growthLevel",
    "근무율": "workRate", "실근무율": "workRate",
    "기준금액": "baseAmount", "개인별 기준금액": "baseAmount",
    "등급": "grade",
    "비고": "memo",
    "시작일": "startDate", "시작일자": "startDate",
    "종료일": "endDate", "종료일자": "endDate",
    "출근시각": "startTime",
    "퇴근시각": "endTime",
    "일자": "date", "근태사용일": "date",
    "근태": "type", "근태종류": "type"
};

export const excelHeaderTargetScreens: Record<string, string> = {
    // 공통
    uniqueId: '공통',
    name: '공통',

    // 월별 대상자
    company: '월별 대상자',
    department: '월별 대상자',
    title: '월별 대상자',
    growthLevel: '월별 대상자',
    baseAmount: '월별 대상자',
    workRate: '월별 대상자',
    evaluatorId: '월별 대상자',
    
    // 평가 결과
    grade: '평가 결과',
    memo: '평가 결과',
    
    // 근무 데이터
    startDate: '근무 데이터',
    endDate: '근무 데이터',
    startTime: '근무 데이터',
    endTime: '근무 데이터',
    date: '근무 데이터',
    type: '근무 데이터',
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

export const getDetailedGroup1 = (workRate: number): string => {
  if (workRate >= 0.7) return '70% 이상';
  if (workRate < 0.25) return '25% 미만';
  
  const percentage = workRate * 100;
  const lowerBound = Math.floor(percentage / 5) * 5;
  const upperBound = lowerBound + 4;
  
  return `${upperBound}%~${lowerBound}%`;
};

