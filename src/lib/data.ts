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
    "department": "인사부",
    "company": "-",
    "evaluatorId": "admin"
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
      "evaluator",
      "employee"
    ],
    "avatar": "https://placehold.co/100x100.png?text=평",
    "password": "1",
    "company": "N/A",
    "evaluatorId": ""
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
    "id": "1",
    "name": "가족돌봄휴가",
    "deductionDays": 1
  },
  {
    "id": "2",
    "name": "결근",
    "deductionDays": 1
  },
  {
    "id": "3",
    "name": "공가",
    "deductionDays": 1
  },
  {
    "id": "4",
    "name": "연차(1년미만)",
    "deductionDays": 1
  },
  {
    "id": "5",
    "name": "연차휴가",
    "deductionDays": 1
  },
  {
    "id": "6",
    "name": "육아휴직",
    "deductionDays": 1
  },
  {
    "id": "7",
    "name": "반반차(오후)",
    "deductionDays": 0.5
  },
  {
    "id": "8",
    "name": "반차(오전)",
    "deductionDays": 0.5
  },
  {
    "id": "9",
    "name": "반차(오전)(1년미만)",
    "deductionDays": 0.5
  },
  {
    "id": "10",
    "name": "반차(오후)",
    "deductionDays": 0.5
  },
  {
    "id": "11",
    "name": "반차(오후)(1년미만)",
    "deductionDays": 0.5
  },
  {
    "id": "12",
    "name": "반반차(오전)",
    "deductionDays": 0.25
  },
  {
    "id": "13",
    "name": "반반차(오후)(1년미만)",
    "deductionDays": 0.25
  },
  {
    "id": "14",
    "name": "대체휴무(종일)",
    "deductionDays": 0
  },
  {
    "id": "15",
    "name": "외부교육",
    "deductionDays": 0
  }
];

export const mockEmployees: Record<string, Partial<Employee>[]> = {
  "2025-7": [
    {
      "id": "user-admin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "N/A",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "",
      "baseAmount": 8000000,
      "memo": ""
    }
  ],
  "2025-1": [
    {
      "id": "user-admin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "N/A",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "",
      "baseAmount": 8000000,
      "memo": ""
    }
  ],
  "2025-2": [
    {
      "id": "user-admin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "N/A",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "",
      "baseAmount": 8000000,
      "memo": ""
    }
  ],
  "2025-3": [
    {
      "id": "user-admin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "N/A",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "",
      "baseAmount": 8000000,
      "memo": ""
    }
  ],
  "2025-4": [
    {
      "id": "user-admin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "N/A",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "",
      "baseAmount": 8000000,
      "memo": ""
    }
  ],
  "2025-5": [
    {
      "id": "user-admin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "N/A",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "",
      "baseAmount": 8000000,
      "memo": ""
    }
  ],
  "2025-0": [
    {
      "id": "E0000198",
      "uniqueId": "0000198",
      "name": "김O섭",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀장",
      "position": "팀장",
      "growthLevel": "Lv.3",
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 730000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 480000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 570000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 570000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 730000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 570000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 480000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000
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
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000
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
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 620000
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
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 570000
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
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 390000
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
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 390000
    }
  ],
  "2025-6": [
    {
      "id": "E1911042",
      "uniqueId": "1911042",
      "name": "김민선",
      "company": "OKH",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "1911042",
      "baseAmount": 8000000,
      "memo": ""
    },
    {
      "id": "user-admin",
      "uniqueId": "admin",
      "name": "관리자",
      "company": "N/A",
      "department": "인사부",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.5",
      "workRate": 1,
      "evaluatorId": "",
      "baseAmount": 8000000,
      "memo": ""
    },
    {
      "id": "user-0000198",
      "uniqueId": "0000198",
      "name": "김O섭",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀장",
      "position": "팀장",
      "growthLevel": "Lv.3",
      "workRate": 0.9,
      "evaluatorId": "0000011",
      "baseAmount": 730000,
      "memo": ""
    },
    {
      "id": "user-0000245",
      "uniqueId": "0000245",
      "name": "신O원",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.6875,
      "evaluatorId": "0000011",
      "baseAmount": 480000,
      "memo": ""
    },
    {
      "id": "user-0000246",
      "uniqueId": "0000246",
      "name": "김O정",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 570000,
      "memo": ""
    },
    {
      "id": "user-0000247",
      "uniqueId": "0000247",
      "name": "강O화",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.15,
      "evaluatorId": "0000011",
      "baseAmount": 570000,
      "memo": ""
    },
    {
      "id": "user-0000298",
      "uniqueId": "0000298",
      "name": "김O철c",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.95,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "user-0000299",
      "uniqueId": "0000299",
      "name": "엄O호",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 0.95,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "user-0000300",
      "uniqueId": "0000300",
      "name": "홍O환",
      "company": "OK",
      "department": "일산PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "user-0000195",
      "uniqueId": "0000195",
      "name": "김O균",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀장",
      "position": "팀장",
      "growthLevel": "Lv.3",
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 730000,
      "memo": ""
    },
    {
      "id": "user-0000231",
      "uniqueId": "0000231",
      "name": "노O호",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.3",
      "workRate": 0.875,
      "evaluatorId": "0000011",
      "baseAmount": 570000,
      "memo": ""
    },
    {
      "id": "user-0000232",
      "uniqueId": "0000232",
      "name": "김O주b",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 0.975,
      "evaluatorId": "0000011",
      "baseAmount": 480000,
      "memo": ""
    },
    {
      "id": "user-0000281",
      "uniqueId": "0000281",
      "name": "김O진b",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "user-0000282",
      "uniqueId": "0000282",
      "name": "신O섭",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "user-0000287",
      "uniqueId": "0000287",
      "name": "송O훈",
      "company": "OK",
      "department": "대전PL팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 1,
      "evaluatorId": "0000011",
      "baseAmount": 390000,
      "memo": ""
    },
    {
      "id": "user-0000584",
      "uniqueId": "0000584",
      "name": "김O미",
      "company": "OCI",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 620000,
      "memo": "B"
    },
    {
      "id": "user-0000586",
      "uniqueId": "0000586",
      "name": "조O진",
      "company": "OFI",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.2",
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 570000,
      "memo": "B"
    },
    {
      "id": "user-0000609",
      "uniqueId": "0000609",
      "name": "정O석b",
      "company": "OC",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 390000,
      "memo": "B"
    },
    {
      "id": "user-0000610",
      "uniqueId": "0000610",
      "name": "김O희",
      "company": "OC",
      "department": "경영관리팀",
      "title": "팀원",
      "position": "팀원",
      "growthLevel": "Lv.1",
      "workRate": 1,
      "evaluatorId": "admin",
      "baseAmount": 390000,
      "memo": "B"
    }
  ]
};

export const mockEvaluations: Record<string, Evaluation[]> = {
  "2025-7": [],
  "2025-1": [
    {
      "id": "eval-E0000198-2025-1",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000245-2025-1",
      "employeeId": "E0000245",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000246-2025-1",
      "employeeId": "E0000246",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000247-2025-1",
      "employeeId": "E0000247",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000298-2025-1",
      "employeeId": "E0000298",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000299-2025-1",
      "employeeId": "E0000299",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000300-2025-1",
      "employeeId": "E0000300",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000195-2025-1",
      "employeeId": "E0000195",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000231-2025-1",
      "employeeId": "E0000231",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000232-2025-1",
      "employeeId": "E0000232",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000281-2025-1",
      "employeeId": "E0000281",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000282-2025-1",
      "employeeId": "E0000282",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000287-2025-1",
      "employeeId": "E0000287",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000584-2025-1",
      "employeeId": "E0000584",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000586-2025-1",
      "employeeId": "E0000586",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000609-2025-1",
      "employeeId": "E0000609",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000610-2025-1",
      "employeeId": "E0000610",
      "year": 2025,
      "month": 1,
      "grade": null,
      "memo": "B"
    }
  ],
  "2025-2": [
    {
      "id": "eval-E0000198-2025-2",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000245-2025-2",
      "employeeId": "E0000245",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000246-2025-2",
      "employeeId": "E0000246",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000247-2025-2",
      "employeeId": "E0000247",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000298-2025-2",
      "employeeId": "E0000298",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000299-2025-2",
      "employeeId": "E0000299",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000300-2025-2",
      "employeeId": "E0000300",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000195-2025-2",
      "employeeId": "E0000195",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000231-2025-2",
      "employeeId": "E0000231",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000232-2025-2",
      "employeeId": "E0000232",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000281-2025-2",
      "employeeId": "E0000281",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000282-2025-2",
      "employeeId": "E0000282",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000287-2025-2",
      "employeeId": "E0000287",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000584-2025-2",
      "employeeId": "E0000584",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000586-2025-2",
      "employeeId": "E0000586",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000609-2025-2",
      "employeeId": "E0000609",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000610-2025-2",
      "employeeId": "E0000610",
      "year": 2025,
      "month": 2,
      "grade": null,
      "memo": "B"
    }
  ],
  "2025-3": [
    {
      "id": "eval-E0000198-2025-3",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000245-2025-3",
      "employeeId": "E0000245",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000246-2025-3",
      "employeeId": "E0000246",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000247-2025-3",
      "employeeId": "E0000247",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000298-2025-3",
      "employeeId": "E0000298",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000299-2025-3",
      "employeeId": "E0000299",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000300-2025-3",
      "employeeId": "E0000300",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000195-2025-3",
      "employeeId": "E0000195",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000231-2025-3",
      "employeeId": "E0000231",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000232-2025-3",
      "employeeId": "E0000232",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000281-2025-3",
      "employeeId": "E0000281",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000282-2025-3",
      "employeeId": "E0000282",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000287-2025-3",
      "employeeId": "E0000287",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000584-2025-3",
      "employeeId": "E0000584",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000586-2025-3",
      "employeeId": "E0000586",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000609-2025-3",
      "employeeId": "E0000609",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000610-2025-3",
      "employeeId": "E0000610",
      "year": 2025,
      "month": 3,
      "grade": null,
      "memo": "B"
    }
  ],
  "2025-4": [
    {
      "id": "eval-E0000198-2025-4",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000245-2025-4",
      "employeeId": "E0000245",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000246-2025-4",
      "employeeId": "E0000246",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000247-2025-4",
      "employeeId": "E0000247",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000298-2025-4",
      "employeeId": "E0000298",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000299-2025-4",
      "employeeId": "E0000299",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000300-2025-4",
      "employeeId": "E0000300",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000195-2025-4",
      "employeeId": "E0000195",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000231-2025-4",
      "employeeId": "E0000231",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000232-2025-4",
      "employeeId": "E0000232",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000281-2025-4",
      "employeeId": "E0000281",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000282-2025-4",
      "employeeId": "E0000282",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000287-2025-4",
      "employeeId": "E0000287",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000584-2025-4",
      "employeeId": "E0000584",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000586-2025-4",
      "employeeId": "E0000586",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000609-2025-4",
      "employeeId": "E0000609",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000610-2025-4",
      "employeeId": "E0000610",
      "year": 2025,
      "month": 4,
      "grade": null,
      "memo": "B"
    }
  ],
  "2025-5": [
    {
      "id": "eval-E0000198-2025-5",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000245-2025-5",
      "employeeId": "E0000245",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000246-2025-5",
      "employeeId": "E0000246",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000247-2025-5",
      "employeeId": "E0000247",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000298-2025-5",
      "employeeId": "E0000298",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000299-2025-5",
      "employeeId": "E0000299",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000300-2025-5",
      "employeeId": "E0000300",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000195-2025-5",
      "employeeId": "E0000195",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000231-2025-5",
      "employeeId": "E0000231",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000232-2025-5",
      "employeeId": "E0000232",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000281-2025-5",
      "employeeId": "E0000281",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000282-2025-5",
      "employeeId": "E0000282",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000287-2025-5",
      "employeeId": "E0000287",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000584-2025-5",
      "employeeId": "E0000584",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000586-2025-5",
      "employeeId": "E0000586",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000609-2025-5",
      "employeeId": "E0000609",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000610-2025-5",
      "employeeId": "E0000610",
      "year": 2025,
      "month": 5,
      "grade": null,
      "memo": "B"
    }
  ],
  "2025-0": [
    {
      "id": "eval-E0000198-2025-0",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 0,
      "grade": "C",
      "memo": ""
    },
    {
      "id": "eval-E0000245-2025-0",
      "employeeId": "E0000245",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": ""
    },
    {
      "id": "eval-E0000246-2025-0",
      "employeeId": "E0000246",
      "year": 2025,
      "month": 0,
      "grade": "A",
      "memo": ""
    },
    {
      "id": "eval-E0000247-2025-0",
      "employeeId": "E0000247",
      "year": 2025,
      "month": 0,
      "grade": "C",
      "memo": ""
    },
    {
      "id": "eval-E0000298-2025-0",
      "employeeId": "E0000298",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": ""
    },
    {
      "id": "eval-E0000299-2025-0",
      "employeeId": "E0000299",
      "year": 2025,
      "month": 0,
      "grade": "C",
      "memo": ""
    },
    {
      "id": "eval-E0000300-2025-0",
      "employeeId": "E0000300",
      "year": 2025,
      "month": 0,
      "grade": "A",
      "memo": ""
    },
    {
      "id": "eval-E0000195-2025-0",
      "employeeId": "E0000195",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": ""
    },
    {
      "id": "eval-E0000231-2025-0",
      "employeeId": "E0000231",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": ""
    },
    {
      "id": "eval-E0000232-2025-0",
      "employeeId": "E0000232",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": ""
    },
    {
      "id": "eval-E0000281-2025-0",
      "employeeId": "E0000281",
      "year": 2025,
      "month": 0,
      "grade": "A",
      "memo": ""
    },
    {
      "id": "eval-E0000282-2025-0",
      "employeeId": "E0000282",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": ""
    },
    {
      "id": "eval-E0000287-2025-0",
      "employeeId": "E0000287",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": ""
    },
    {
      "id": "eval-E0000584-2025-0",
      "employeeId": "E0000584",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": "B"
    },
    {
      "id": "eval-E0000586-2025-0",
      "employeeId": "E0000586",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": "B"
    },
    {
      "id": "eval-E0000609-2025-0",
      "employeeId": "E0000609",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": "B"
    },
    {
      "id": "eval-E0000610-2025-0",
      "employeeId": "E0000610",
      "year": 2025,
      "month": 0,
      "grade": "B",
      "memo": "B"
    }
  ],
  "2025-6": [
    {
      "id": "eval-E1911042-2025-6",
      "employeeId": "E1911042",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-user-admin-2025-6",
      "employeeId": "user-admin",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "memo": "admin",
      "detailedGroup2": "기타",
      "score": 150
    },
    {
      "id": "eval-user-0000198-2025-6",
      "employeeId": "user-0000198",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "detailedGroup2": "팀장/지점장",
      "score": 0
    },
    {
      "id": "eval-user-0000245-2025-6",
      "employeeId": "user-0000245",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.2~3"
    },
    {
      "id": "eval-user-0000246-2025-6",
      "employeeId": "user-0000246",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.2~3"
    },
    {
      "id": "eval-user-0000247-2025-6",
      "employeeId": "user-0000247",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.2~3"
    },
    {
      "id": "eval-user-0000298-2025-6",
      "employeeId": "user-0000298",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.1"
    },
    {
      "id": "eval-user-0000299-2025-6",
      "employeeId": "user-0000299",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.1"
    },
    {
      "id": "eval-user-0000300-2025-6",
      "employeeId": "user-0000300",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.1"
    },
    {
      "id": "eval-user-0000195-2025-6",
      "employeeId": "user-0000195",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "팀장/지점장"
    },
    {
      "id": "eval-user-0000231-2025-6",
      "employeeId": "user-0000231",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.2~3"
    },
    {
      "id": "eval-user-0000232-2025-6",
      "employeeId": "user-0000232",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.2~3"
    },
    {
      "id": "eval-user-0000281-2025-6",
      "employeeId": "user-0000281",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.1"
    },
    {
      "id": "eval-user-0000282-2025-6",
      "employeeId": "user-0000282",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.1"
    },
    {
      "id": "eval-user-0000287-2025-6",
      "employeeId": "user-0000287",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "score": 0,
      "detailedGroup2": "Lv.1"
    },
    {
      "id": "eval-user-0000584-2025-6",
      "employeeId": "user-0000584",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "memo": "B",
      "detailedGroup2": "Lv.2~3",
      "score": 150
    },
    {
      "id": "eval-user-0000586-2025-6",
      "employeeId": "user-0000586",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "memo": "B",
      "detailedGroup2": "Lv.2~3",
      "score": 150
    },
    {
      "id": "eval-user-0000609-2025-6",
      "employeeId": "user-0000609",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "memo": "B",
      "detailedGroup2": "Lv.1",
      "score": 0
    },
    {
      "id": "eval-user-0000610-2025-6",
      "employeeId": "user-0000610",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "memo": "0000610",
      "detailedGroup2": "Lv.1",
      "score": 0
    },
    {
      "id": "eval-ㅇ-2025-6",
      "employeeId": "ㅇ",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000584-2025-6",
      "employeeId": "0000584",
      "year": 2025,
      "month": 6,
      "grade": "B",
      "score": 100,
      "memo": "주어진 바를 성실히 이행함.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000586-2025-6",
      "employeeId": "0000586",
      "year": 2025,
      "month": 6,
      "grade": "B-",
      "score": 95,
      "memo": "주어진 바를 성실히 이행함.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000609-2025-6",
      "employeeId": "0000609",
      "year": 2025,
      "month": 6,
      "grade": "B",
      "score": 100,
      "memo": "주어진 바를 성실히 이행함.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000610-2025-6",
      "employeeId": "0000610",
      "year": 2025,
      "month": 6,
      "grade": "B+",
      "score": 105,
      "memo": "주어진 바를 성실히 이행함.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-admin-2025-6",
      "employeeId": "admin",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "memo": "admin",
      "detailedGroup2": "",
      "score": 150
    },
    {
      "id": "eval-0000198-2025-6",
      "employeeId": "0000198",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "score": 150,
      "memo": "완벽합니다.",
      "detailedGroup2": "Lv.2~3"
    },
    {
      "id": "eval-0000195-2025-6",
      "employeeId": "0000195",
      "year": 2025,
      "month": 6,
      "grade": "C-",
      "score": 70,
      "memo": "노력하세요.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000246-2025-6",
      "employeeId": "0000246",
      "year": 2025,
      "month": 6,
      "grade": "S",
      "score": 150,
      "memo": "아주좋습니다.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000231-2025-6",
      "employeeId": "0000231",
      "year": 2025,
      "month": 6,
      "grade": "C",
      "score": 85,
      "memo": "노력이 필요합니다.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000232-2025-6",
      "employeeId": "0000232",
      "year": 2025,
      "month": 6,
      "grade": "C-",
      "score": 70,
      "memo": "노력이 필요합니다.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000298-2025-6",
      "employeeId": "0000298",
      "year": 2025,
      "month": 6,
      "grade": "A+",
      "score": 130,
      "memo": "성과가 우수합니다",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000299-2025-6",
      "employeeId": "0000299",
      "year": 2025,
      "month": 6,
      "grade": "A",
      "score": 115,
      "memo": "성과가 우수합니다.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000300-2025-6",
      "employeeId": "0000300",
      "year": 2025,
      "month": 6,
      "grade": "B+",
      "score": 105,
      "memo": "성과를 달성하였습니다.",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000281-2025-6",
      "employeeId": "0000281",
      "year": 2025,
      "month": 6,
      "grade": "C",
      "score": 85,
      "memo": "미달성. 노력하세요",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000282-2025-6",
      "employeeId": "0000282",
      "year": 2025,
      "month": 6,
      "grade": "C",
      "score": 85,
      "memo": "미달성. 노력하세요",
      "detailedGroup2": ""
    },
    {
      "id": "eval-0000287-2025-6",
      "employeeId": "0000287",
      "year": 2025,
      "month": 6,
      "grade": "B-",
      "score": 95,
      "memo": "다소 아쉽습니다.",
      "detailedGroup2": ""
    }
  ]
};

export const initialHolidays: Holiday[] = [
  {
    "id": "h1",
    "date": "2025-01-01",
    "name": "신정",
    "type": "공휴일"
  },
  {
    "id": "h2",
    "date": "2025-06-03",
    "name": "대통령선거",
    "type": "공휴일"
  },
  {
    "id": "h3",
    "date": "2025-06-06",
    "name": "현충일",
    "type": "공휴일"
  }
];

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
