import type { User, Employee, Grade, Evaluation, GradeInfo, AttendanceType, HeaderMapping, Holiday } from './types';

export const mockUsers: User[] = [
  {
    "id": "user-admin",
    "employeeId": "Eadmin",
    "uniqueId": "admin",
    "name": "평가자(admin)",
    "roles": [
      "evaluator",
      "admin",
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=A",
    "title": "평가자",
    "department": "N/A",
    "company": "N/A",
    "evaluatorId": ""
  },
  {
    "id": "user-0000198",
    "employeeId": "E0000198",
    "uniqueId": "0000198",
    "name": "김O섭",
    "department": "일산PL팀",
    "title": "팀장",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000245",
    "employeeId": "E0000245",
    "uniqueId": "0000245",
    "name": "신O원",
    "department": "일산PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=신",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000246",
    "employeeId": "E0000246",
    "uniqueId": "0000246",
    "name": "김O정",
    "department": "일산PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000247",
    "employeeId": "E0000247",
    "uniqueId": "0000247",
    "name": "강O화",
    "department": "일산PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=강",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000298",
    "employeeId": "E0000298",
    "uniqueId": "0000298",
    "name": "김O철c",
    "department": "일산PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000299",
    "employeeId": "E0000299",
    "uniqueId": "0000299",
    "name": "엄O호",
    "department": "일산PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=엄",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000300",
    "employeeId": "E0000300",
    "uniqueId": "0000300",
    "name": "홍O환",
    "department": "일산PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=홍",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000195",
    "employeeId": "E0000195",
    "uniqueId": "0000195",
    "name": "김O균",
    "department": "대전PL팀",
    "title": "팀장",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000231",
    "employeeId": "E0000231",
    "uniqueId": "0000231",
    "name": "노O호",
    "department": "대전PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=노",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000232",
    "employeeId": "E0000232",
    "uniqueId": "0000232",
    "name": "김O주b",
    "department": "대전PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000281",
    "employeeId": "E0000281",
    "uniqueId": "0000281",
    "name": "김O진b",
    "department": "대전PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000282",
    "employeeId": "E0000282",
    "uniqueId": "0000282",
    "name": "신O섭",
    "department": "대전PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=신",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000287",
    "employeeId": "E0000287",
    "uniqueId": "0000287",
    "name": "송O훈",
    "department": "대전PL팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=송",
    "password": "1",
    "company": "OK",
    "evaluatorId": "0000011"
  },
  {
    "id": "user-0000584",
    "employeeId": "E0000584",
    "uniqueId": "0000584",
    "name": "김O미",
    "department": "경영관리팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OCI",
    "evaluatorId": "admin"
  },
  {
    "id": "user-0000586",
    "employeeId": "E0000586",
    "uniqueId": "0000586",
    "name": "조O진",
    "department": "경영관리팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=조",
    "password": "1",
    "company": "OFI",
    "evaluatorId": "admin"
  },
  {
    "id": "user-0000609",
    "employeeId": "E0000609",
    "uniqueId": "0000609",
    "name": "정O석b",
    "department": "경영관리팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=정",
    "password": "1",
    "company": "OC",
    "evaluatorId": "admin"
  },
  {
    "id": "user-0000610",
    "employeeId": "E0000610",
    "uniqueId": "0000610",
    "name": "김O희",
    "department": "경영관리팀",
    "title": "팀원",
    "roles": [
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=김",
    "password": "1",
    "company": "OC",
    "evaluatorId": "admin"
  },
  {
    "id": "user-0000011",
    "employeeId": "E0000011",
    "uniqueId": "0000011",
    "name": "이O권",
    "department": "콜렉션센터",
    "title": "센터장",
    "roles": [
      "evaluator"
    ],
    "avatar": "https://placehold.co/100x100.png?text=평",
    "password": "1",
    "company": "N/A",
    "evaluatorId": ""
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
  "2025-6": [
    {
      "id": "E0000198",
      "uniqueId": "0000198",
      "name": "김O섭",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀장",
      "position": "팀장",
      "growthLevel": "Lv.3",
      "workRate": 0.8947368421052632,
      "evaluatorId": "0000011",
      "baseAmount": 730000,
      "memo": ""
    },
    {
      "id": "E0000245",
      "uniqueId": "0000245",
      "name": "신O원",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.8947368421052632,
      "evaluatorId": "0000011",
      "baseAmount": 480000,
      "memo": ""
    },
    {
      "id": "E0000246",
      "uniqueId": "0000246",
      "name": "김O정",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.8947368421052632,
      "evaluatorId": "0000011",
      "baseAmount": 570000,
      "memo": ""
    },
    {
      "id": "E0000247",
      "uniqueId": "0000247",
      "name": "강O화",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.868421052631579,
      "evaluatorId": "0000011",
      "baseAmount": 570000,
      "memo": ""
    },
    {
      "id": "E0000298",
      "uniqueId": "0000298",
      "name": "김O철c",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.8421052631578947,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "E0000299",
      "uniqueId": "0000299",
      "name": "엄O호",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.9473684210526316,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "E0000300",
      "uniqueId": "0000300",
      "name": "홍O환",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.9473684210526316,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "E0000195",
      "uniqueId": "0000195",
      "name": "김O균",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀장",
      "position": "팀장",
      "growthLevel": "Lv.3",
      "workRate": 0.9473684210526316,
      "evaluatorId": "0000011",
      "baseAmount": 730000,
      "memo": ""
    },
    {
      "id": "E0000231",
      "uniqueId": "0000231",
      "name": "노O호",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.3",
      "workRate": 0.8421052631578947,
      "evaluatorId": "0000011",
      "baseAmount": 570000,
      "memo": ""
    },
    {
      "id": "E0000232",
      "uniqueId": "0000232",
      "name": "김O주b",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.9473684210526316,
      "evaluatorId": "0000011",
      "baseAmount": 480000,
      "memo": ""
    },
    {
      "id": "E0000281",
      "uniqueId": "0000281",
      "name": "김O진b",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.9473684210526316,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "E0000282",
      "uniqueId": "0000282",
      "name": "신O섭",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.9473684210526316,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "E0000287",
      "uniqueId": "0000287",
      "name": "송O훈",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.9736842105263158,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "E0000584",
      "uniqueId": "0000584",
      "name": "김O미",
      "company": "OCI",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.9210526315789473,
      "evaluatorId": "admin",
      "baseAmount": 620000,
      "memo": "B"
    },
    {
      "id": "E0000586",
      "uniqueId": "0000586",
      "name": "조O진",
      "company": "OFI",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.9473684210526316,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": "B"
    },
    {
      "id": "E0000609",
      "uniqueId": "0000609",
      "name": "정O석b",
      "company": "OC",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.9473684210526316,
      "evaluatorId": "admin",
      "baseAmount": 390000,
      "memo": "B"
    },
    {
      "id": "E0000610",
      "uniqueId": "0000610",
      "name": "김O희",
      "company": "OC",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.8947368421052632,
      "evaluatorId": "admin",
      "baseAmount": 390000,
      "memo": "B"
    }
  ]
};

export const mockEvaluations: Record<string, Evaluation[]> = {
  "2025-6": [
    {
      "id": "eval-E0000198-2025-6",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000245-2025-6",
      "employeeId": "E0000245",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000246-2025-6",
      "employeeId": "E0000246",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000247-2025-6",
      "employeeId": "E0000247",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000298-2025-6",
      "employeeId": "E0000298",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000299-2025-6",
      "employeeId": "E0000299",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000300-2025-6",
      "employeeId": "E0000300",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000195-2025-6",
      "employeeId": "E0000195",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000231-2025-6",
      "employeeId": "E0000231",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000232-2025-6",
      "employeeId": "E0000232",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000281-2025-6",
      "employeeId": "E0000281",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000282-2025-6",
      "employeeId": "E0000282",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000287-2025-6",
      "employeeId": "E0000287",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000584-2025-6",
      "employeeId": "E0000584",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000586-2025-6",
      "employeeId": "E0000586",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000609-2025-6",
      "employeeId": "E0000609",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000610-2025-6",
      "employeeId": "E0000610",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
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
    "근무율": "workRate", "실근무율": "workRate",
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

export const getDetailedGroup1 = (workRate: number): string => {
  if (workRate >= 0.7) return '70% 이상';
  if (workRate < 0.25) return '25% 미만';
  
  const percentage = workRate * 100;
  const lowerBound = Math.floor(percentage / 5) * 5;
  const upperBound = lowerBound + 4;
  
  return `${upperBound}%~${lowerBound}%`;
};
