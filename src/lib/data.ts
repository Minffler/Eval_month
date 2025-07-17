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
  "2025-6": [
    {
      "id": "eval-E0000002-2025-6",
      "employeeId": "E0000002",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000003-2025-6",
      "employeeId": "E0000003",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000004-2025-6",
      "employeeId": "E0000004",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000005-2025-6",
      "employeeId": "E0000005",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000006-2025-6",
      "employeeId": "E0000006",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000007-2025-6",
      "employeeId": "E0000007",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000008-2025-6",
      "employeeId": "E0000008",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000009-2025-6",
      "employeeId": "E0000009",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000010-2025-6",
      "employeeId": "E0000010",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000011-2025-6",
      "employeeId": "E0000011",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000012-2025-6",
      "employeeId": "E0000012",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000013-2025-6",
      "employeeId": "E0000013",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000014-2025-6",
      "employeeId": "E0000014",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000015-2025-6",
      "employeeId": "E0000015",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000016-2025-6",
      "employeeId": "E0000016",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000017-2025-6",
      "employeeId": "E0000017",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000018-2025-6",
      "employeeId": "E0000018",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000019-2025-6",
      "employeeId": "E0000019",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000020-2025-6",
      "employeeId": "E0000020",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000021-2025-6",
      "employeeId": "E0000021",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000022-2025-6",
      "employeeId": "E0000022",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000023-2025-6",
      "employeeId": "E0000023",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000024-2025-6",
      "employeeId": "E0000024",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000025-2025-6",
      "employeeId": "E0000025",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000026-2025-6",
      "employeeId": "E0000026",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000027-2025-6",
      "employeeId": "E0000027",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000028-2025-6",
      "employeeId": "E0000028",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000029-2025-6",
      "employeeId": "E0000029",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000030-2025-6",
      "employeeId": "E0000030",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000031-2025-6",
      "employeeId": "E0000031",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000032-2025-6",
      "employeeId": "E0000032",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000033-2025-6",
      "employeeId": "E0000033",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000034-2025-6",
      "employeeId": "E0000034",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000035-2025-6",
      "employeeId": "E0000035",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000036-2025-6",
      "employeeId": "E0000036",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000037-2025-6",
      "employeeId": "E0000037",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000038-2025-6",
      "employeeId": "E0000038",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000039-2025-6",
      "employeeId": "E0000039",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000040-2025-6",
      "employeeId": "E0000040",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000041-2025-6",
      "employeeId": "E0000041",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000042-2025-6",
      "employeeId": "E0000042",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000043-2025-6",
      "employeeId": "E0000043",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000044-2025-6",
      "employeeId": "E0000044",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000045-2025-6",
      "employeeId": "E0000045",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000046-2025-6",
      "employeeId": "E0000046",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000047-2025-6",
      "employeeId": "E0000047",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000048-2025-6",
      "employeeId": "E0000048",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000049-2025-6",
      "employeeId": "E0000049",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000050-2025-6",
      "employeeId": "E0000050",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000051-2025-6",
      "employeeId": "E0000051",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000052-2025-6",
      "employeeId": "E0000052",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000053-2025-6",
      "employeeId": "E0000053",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000054-2025-6",
      "employeeId": "E0000054",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000055-2025-6",
      "employeeId": "E0000055",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000056-2025-6",
      "employeeId": "E0000056",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000057-2025-6",
      "employeeId": "E0000057",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000058-2025-6",
      "employeeId": "E0000058",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000059-2025-6",
      "employeeId": "E0000059",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000060-2025-6",
      "employeeId": "E0000060",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000061-2025-6",
      "employeeId": "E0000061",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000062-2025-6",
      "employeeId": "E0000062",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000063-2025-6",
      "employeeId": "E0000063",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000064-2025-6",
      "employeeId": "E0000064",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000065-2025-6",
      "employeeId": "E0000065",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000066-2025-6",
      "employeeId": "E0000066",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000067-2025-6",
      "employeeId": "E0000067",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000068-2025-6",
      "employeeId": "E0000068",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000069-2025-6",
      "employeeId": "E0000069",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000070-2025-6",
      "employeeId": "E0000070",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000071-2025-6",
      "employeeId": "E0000071",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000072-2025-6",
      "employeeId": "E0000072",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000073-2025-6",
      "employeeId": "E0000073",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000074-2025-6",
      "employeeId": "E0000074",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000075-2025-6",
      "employeeId": "E0000075",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000076-2025-6",
      "employeeId": "E0000076",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000077-2025-6",
      "employeeId": "E0000077",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000078-2025-6",
      "employeeId": "E0000078",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000079-2025-6",
      "employeeId": "E0000079",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000080-2025-6",
      "employeeId": "E0000080",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000081-2025-6",
      "employeeId": "E0000081",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000082-2025-6",
      "employeeId": "E0000082",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000083-2025-6",
      "employeeId": "E0000083",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000084-2025-6",
      "employeeId": "E0000084",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000085-2025-6",
      "employeeId": "E0000085",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000086-2025-6",
      "employeeId": "E0000086",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000087-2025-6",
      "employeeId": "E0000087",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000088-2025-6",
      "employeeId": "E0000088",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000089-2025-6",
      "employeeId": "E0000089",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000090-2025-6",
      "employeeId": "E0000090",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000091-2025-6",
      "employeeId": "E0000091",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000092-2025-6",
      "employeeId": "E0000092",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000093-2025-6",
      "employeeId": "E0000093",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000094-2025-6",
      "employeeId": "E0000094",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000095-2025-6",
      "employeeId": "E0000095",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000096-2025-6",
      "employeeId": "E0000096",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000097-2025-6",
      "employeeId": "E0000097",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000098-2025-6",
      "employeeId": "E0000098",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000099-2025-6",
      "employeeId": "E0000099",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000100-2025-6",
      "employeeId": "E0000100",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000101-2025-6",
      "employeeId": "E0000101",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000102-2025-6",
      "employeeId": "E0000102",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000103-2025-6",
      "employeeId": "E0000103",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000104-2025-6",
      "employeeId": "E0000104",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000105-2025-6",
      "employeeId": "E0000105",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000106-2025-6",
      "employeeId": "E0000106",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000107-2025-6",
      "employeeId": "E0000107",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000108-2025-6",
      "employeeId": "E0000108",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000109-2025-6",
      "employeeId": "E0000109",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000110-2025-6",
      "employeeId": "E0000110",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000111-2025-6",
      "employeeId": "E0000111",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000112-2025-6",
      "employeeId": "E0000112",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000113-2025-6",
      "employeeId": "E0000113",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000114-2025-6",
      "employeeId": "E0000114",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000115-2025-6",
      "employeeId": "E0000115",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000116-2025-6",
      "employeeId": "E0000116",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000117-2025-6",
      "employeeId": "E0000117",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000118-2025-6",
      "employeeId": "E0000118",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000119-2025-6",
      "employeeId": "E0000119",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000120-2025-6",
      "employeeId": "E0000120",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000121-2025-6",
      "employeeId": "E0000121",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000122-2025-6",
      "employeeId": "E0000122",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000123-2025-6",
      "employeeId": "E0000123",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000124-2025-6",
      "employeeId": "E0000124",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000125-2025-6",
      "employeeId": "E0000125",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000126-2025-6",
      "employeeId": "E0000126",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000127-2025-6",
      "employeeId": "E0000127",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000128-2025-6",
      "employeeId": "E0000128",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000129-2025-6",
      "employeeId": "E0000129",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000130-2025-6",
      "employeeId": "E0000130",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000131-2025-6",
      "employeeId": "E0000131",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000132-2025-6",
      "employeeId": "E0000132",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000133-2025-6",
      "employeeId": "E0000133",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000134-2025-6",
      "employeeId": "E0000134",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000135-2025-6",
      "employeeId": "E0000135",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000136-2025-6",
      "employeeId": "E0000136",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000137-2025-6",
      "employeeId": "E0000137",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000138-2025-6",
      "employeeId": "E0000138",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000139-2025-6",
      "employeeId": "E0000139",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000140-2025-6",
      "employeeId": "E0000140",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000141-2025-6",
      "employeeId": "E0000141",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000142-2025-6",
      "employeeId": "E0000142",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000143-2025-6",
      "employeeId": "E0000143",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000144-2025-6",
      "employeeId": "E0000144",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000145-2025-6",
      "employeeId": "E0000145",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000146-2025-6",
      "employeeId": "E0000146",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000147-2025-6",
      "employeeId": "E0000147",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000148-2025-6",
      "employeeId": "E0000148",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000149-2025-6",
      "employeeId": "E0000149",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000150-2025-6",
      "employeeId": "E0000150",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000151-2025-6",
      "employeeId": "E0000151",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000152-2025-6",
      "employeeId": "E0000152",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000153-2025-6",
      "employeeId": "E0000153",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000154-2025-6",
      "employeeId": "E0000154",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000155-2025-6",
      "employeeId": "E0000155",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000156-2025-6",
      "employeeId": "E0000156",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000157-2025-6",
      "employeeId": "E0000157",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000158-2025-6",
      "employeeId": "E0000158",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000159-2025-6",
      "employeeId": "E0000159",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000160-2025-6",
      "employeeId": "E0000160",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000161-2025-6",
      "employeeId": "E0000161",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000162-2025-6",
      "employeeId": "E0000162",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000163-2025-6",
      "employeeId": "E0000163",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000164-2025-6",
      "employeeId": "E0000164",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000165-2025-6",
      "employeeId": "E0000165",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000166-2025-6",
      "employeeId": "E0000166",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000167-2025-6",
      "employeeId": "E0000167",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000168-2025-6",
      "employeeId": "E0000168",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000169-2025-6",
      "employeeId": "E0000169",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000170-2025-6",
      "employeeId": "E0000170",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000171-2025-6",
      "employeeId": "E0000171",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000172-2025-6",
      "employeeId": "E0000172",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000173-2025-6",
      "employeeId": "E0000173",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000174-2025-6",
      "employeeId": "E0000174",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000175-2025-6",
      "employeeId": "E0000175",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000176-2025-6",
      "employeeId": "E0000176",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000177-2025-6",
      "employeeId": "E0000177",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000178-2025-6",
      "employeeId": "E0000178",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000179-2025-6",
      "employeeId": "E0000179",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000180-2025-6",
      "employeeId": "E0000180",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000181-2025-6",
      "employeeId": "E0000181",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000182-2025-6",
      "employeeId": "E0000182",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000183-2025-6",
      "employeeId": "E0000183",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000184-2025-6",
      "employeeId": "E0000184",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000185-2025-6",
      "employeeId": "E0000185",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000186-2025-6",
      "employeeId": "E0000186",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000187-2025-6",
      "employeeId": "E0000187",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000188-2025-6",
      "employeeId": "E0000188",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000189-2025-6",
      "employeeId": "E0000189",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000190-2025-6",
      "employeeId": "E0000190",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000191-2025-6",
      "employeeId": "E0000191",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000192-2025-6",
      "employeeId": "E0000192",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000193-2025-6",
      "employeeId": "E0000193",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000194-2025-6",
      "employeeId": "E0000194",
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
      "id": "eval-E0000196-2025-6",
      "employeeId": "E0000196",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000197-2025-6",
      "employeeId": "E0000197",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000198-2025-6",
      "employeeId": "E0000198",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000199-2025-6",
      "employeeId": "E0000199",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000200-2025-6",
      "employeeId": "E0000200",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000201-2025-6",
      "employeeId": "E0000201",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000202-2025-6",
      "employeeId": "E0000202",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000203-2025-6",
      "employeeId": "E0000203",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000204-2025-6",
      "employeeId": "E0000204",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000205-2025-6",
      "employeeId": "E0000205",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000206-2025-6",
      "employeeId": "E0000206",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000207-2025-6",
      "employeeId": "E0000207",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000208-2025-6",
      "employeeId": "E0000208",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000209-2025-6",
      "employeeId": "E0000209",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000210-2025-6",
      "employeeId": "E0000210",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000211-2025-6",
      "employeeId": "E0000211",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000212-2025-6",
      "employeeId": "E0000212",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000213-2025-6",
      "employeeId": "E0000213",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000214-2025-6",
      "employeeId": "E0000214",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000215-2025-6",
      "employeeId": "E0000215",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000216-2025-6",
      "employeeId": "E0000216",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000217-2025-6",
      "employeeId": "E0000217",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000218-2025-6",
      "employeeId": "E0000218",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000219-2025-6",
      "employeeId": "E0000219",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000220-2025-6",
      "employeeId": "E0000220",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000221-2025-6",
      "employeeId": "E0000221",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000222-2025-6",
      "employeeId": "E0000222",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000223-2025-6",
      "employeeId": "E0000223",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000224-2025-6",
      "employeeId": "E0000224",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000225-2025-6",
      "employeeId": "E0000225",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000226-2025-6",
      "employeeId": "E0000226",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000227-2025-6",
      "employeeId": "E0000227",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000228-2025-6",
      "employeeId": "E0000228",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000229-2025-6",
      "employeeId": "E0000229",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000230-2025-6",
      "employeeId": "E0000230",
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
      "id": "eval-E0000233-2025-6",
      "employeeId": "E0000233",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000234-2025-6",
      "employeeId": "E0000234",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000235-2025-6",
      "employeeId": "E0000235",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000236-2025-6",
      "employeeId": "E0000236",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000237-2025-6",
      "employeeId": "E0000237",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000238-2025-6",
      "employeeId": "E0000238",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000239-2025-6",
      "employeeId": "E0000239",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000240-2025-6",
      "employeeId": "E0000240",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000241-2025-6",
      "employeeId": "E0000241",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000242-2025-6",
      "employeeId": "E0000242",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000243-2025-6",
      "employeeId": "E0000243",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000244-2025-6",
      "employeeId": "E0000244",
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
      "id": "eval-E0000248-2025-6",
      "employeeId": "E0000248",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000249-2025-6",
      "employeeId": "E0000249",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000250-2025-6",
      "employeeId": "E0000250",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000251-2025-6",
      "employeeId": "E0000251",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000252-2025-6",
      "employeeId": "E0000252",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000253-2025-6",
      "employeeId": "E0000253",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000254-2025-6",
      "employeeId": "E0000254",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000255-2025-6",
      "employeeId": "E0000255",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000256-2025-6",
      "employeeId": "E0000256",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000257-2025-6",
      "employeeId": "E0000257",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000258-2025-6",
      "employeeId": "E0000258",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000259-2025-6",
      "employeeId": "E0000259",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000260-2025-6",
      "employeeId": "E0000260",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000261-2025-6",
      "employeeId": "E0000261",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000262-2025-6",
      "employeeId": "E0000262",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000263-2025-6",
      "employeeId": "E0000263",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000264-2025-6",
      "employeeId": "E0000264",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000265-2025-6",
      "employeeId": "E0000265",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000266-2025-6",
      "employeeId": "E0000266",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000267-2025-6",
      "employeeId": "E0000267",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000268-2025-6",
      "employeeId": "E0000268",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000269-2025-6",
      "employeeId": "E0000269",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000270-2025-6",
      "employeeId": "E0000270",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000271-2025-6",
      "employeeId": "E0000271",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000272-2025-6",
      "employeeId": "E0000272",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000273-2025-6",
      "employeeId": "E0000273",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000274-2025-6",
      "employeeId": "E0000274",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000275-2025-6",
      "employeeId": "E0000275",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000276-2025-6",
      "employeeId": "E0000276",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000277-2025-6",
      "employeeId": "E0000277",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000278-2025-6",
      "employeeId": "E0000278",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000279-2025-6",
      "employeeId": "E0000279",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000280-2025-6",
      "employeeId": "E0000280",
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
      "id": "eval-E0000283-2025-6",
      "employeeId": "E0000283",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000284-2025-6",
      "employeeId": "E0000284",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000285-2025-6",
      "employeeId": "E0000285",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000286-2025-6",
      "employeeId": "E0000286",
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
      "id": "eval-E0000288-2025-6",
      "employeeId": "E0000288",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000289-2025-6",
      "employeeId": "E0000289",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000290-2025-6",
      "employeeId": "E0000290",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000291-2025-6",
      "employeeId": "E0000291",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000292-2025-6",
      "employeeId": "E0000292",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000293-2025-6",
      "employeeId": "E0000293",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000294-2025-6",
      "employeeId": "E0000294",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000295-2025-6",
      "employeeId": "E0000295",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000296-2025-6",
      "employeeId": "E0000296",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000297-2025-6",
      "employeeId": "E0000297",
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
      "id": "eval-E0000301-2025-6",
      "employeeId": "E0000301",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000302-2025-6",
      "employeeId": "E0000302",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000303-2025-6",
      "employeeId": "E0000303",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000304-2025-6",
      "employeeId": "E0000304",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000305-2025-6",
      "employeeId": "E0000305",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000306-2025-6",
      "employeeId": "E0000306",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000307-2025-6",
      "employeeId": "E0000307",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000308-2025-6",
      "employeeId": "E0000308",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000309-2025-6",
      "employeeId": "E0000309",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000310-2025-6",
      "employeeId": "E0000310",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000311-2025-6",
      "employeeId": "E0000311",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000312-2025-6",
      "employeeId": "E0000312",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000313-2025-6",
      "employeeId": "E0000313",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000314-2025-6",
      "employeeId": "E0000314",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000315-2025-6",
      "employeeId": "E0000315",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000316-2025-6",
      "employeeId": "E0000316",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000317-2025-6",
      "employeeId": "E0000317",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000318-2025-6",
      "employeeId": "E0000318",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000319-2025-6",
      "employeeId": "E0000319",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000320-2025-6",
      "employeeId": "E0000320",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000321-2025-6",
      "employeeId": "E0000321",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000322-2025-6",
      "employeeId": "E0000322",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000323-2025-6",
      "employeeId": "E0000323",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000324-2025-6",
      "employeeId": "E0000324",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000325-2025-6",
      "employeeId": "E0000325",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000326-2025-6",
      "employeeId": "E0000326",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000327-2025-6",
      "employeeId": "E0000327",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000328-2025-6",
      "employeeId": "E0000328",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000329-2025-6",
      "employeeId": "E0000329",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000330-2025-6",
      "employeeId": "E0000330",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000331-2025-6",
      "employeeId": "E0000331",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000332-2025-6",
      "employeeId": "E0000332",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000333-2025-6",
      "employeeId": "E0000333",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000334-2025-6",
      "employeeId": "E0000334",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000335-2025-6",
      "employeeId": "E0000335",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000336-2025-6",
      "employeeId": "E0000336",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000337-2025-6",
      "employeeId": "E0000337",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000338-2025-6",
      "employeeId": "E0000338",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000339-2025-6",
      "employeeId": "E0000339",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000340-2025-6",
      "employeeId": "E0000340",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000341-2025-6",
      "employeeId": "E0000341",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000342-2025-6",
      "employeeId": "E0000342",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000343-2025-6",
      "employeeId": "E0000343",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000344-2025-6",
      "employeeId": "E0000344",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000345-2025-6",
      "employeeId": "E0000345",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000346-2025-6",
      "employeeId": "E0000346",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000347-2025-6",
      "employeeId": "E0000347",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000348-2025-6",
      "employeeId": "E0000348",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000349-2025-6",
      "employeeId": "E0000349",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000350-2025-6",
      "employeeId": "E0000350",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000351-2025-6",
      "employeeId": "E0000351",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000352-2025-6",
      "employeeId": "E0000352",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000353-2025-6",
      "employeeId": "E0000353",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000354-2025-6",
      "employeeId": "E0000354",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000355-2025-6",
      "employeeId": "E0000355",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000356-2025-6",
      "employeeId": "E0000356",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000357-2025-6",
      "employeeId": "E0000357",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000358-2025-6",
      "employeeId": "E0000358",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000359-2025-6",
      "employeeId": "E0000359",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000360-2025-6",
      "employeeId": "E0000360",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000361-2025-6",
      "employeeId": "E0000361",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000362-2025-6",
      "employeeId": "E0000362",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000363-2025-6",
      "employeeId": "E0000363",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000364-2025-6",
      "employeeId": "E0000364",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000365-2025-6",
      "employeeId": "E0000365",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000366-2025-6",
      "employeeId": "E0000366",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000367-2025-6",
      "employeeId": "E0000367",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000368-2025-6",
      "employeeId": "E0000368",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000369-2025-6",
      "employeeId": "E0000369",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000370-2025-6",
      "employeeId": "E0000370",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000371-2025-6",
      "employeeId": "E0000371",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000372-2025-6",
      "employeeId": "E0000372",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000373-2025-6",
      "employeeId": "E0000373",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000374-2025-6",
      "employeeId": "E0000374",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000375-2025-6",
      "employeeId": "E0000375",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000376-2025-6",
      "employeeId": "E0000376",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000377-2025-6",
      "employeeId": "E0000377",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000378-2025-6",
      "employeeId": "E0000378",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000379-2025-6",
      "employeeId": "E0000379",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000380-2025-6",
      "employeeId": "E0000380",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000381-2025-6",
      "employeeId": "E0000381",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000382-2025-6",
      "employeeId": "E0000382",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000383-2025-6",
      "employeeId": "E0000383",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000384-2025-6",
      "employeeId": "E0000384",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000385-2025-6",
      "employeeId": "E0000385",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000386-2025-6",
      "employeeId": "E0000386",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000387-2025-6",
      "employeeId": "E0000387",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000388-2025-6",
      "employeeId": "E0000388",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000389-2025-6",
      "employeeId": "E0000389",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000390-2025-6",
      "employeeId": "E0000390",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000391-2025-6",
      "employeeId": "E0000391",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000392-2025-6",
      "employeeId": "E0000392",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000393-2025-6",
      "employeeId": "E0000393",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000394-2025-6",
      "employeeId": "E0000394",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000395-2025-6",
      "employeeId": "E0000395",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000396-2025-6",
      "employeeId": "E0000396",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000397-2025-6",
      "employeeId": "E0000397",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000398-2025-6",
      "employeeId": "E0000398",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000399-2025-6",
      "employeeId": "E0000399",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000400-2025-6",
      "employeeId": "E0000400",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000401-2025-6",
      "employeeId": "E0000401",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000402-2025-6",
      "employeeId": "E0000402",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000403-2025-6",
      "employeeId": "E0000403",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000404-2025-6",
      "employeeId": "E0000404",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000405-2025-6",
      "employeeId": "E0000405",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000406-2025-6",
      "employeeId": "E0000406",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000407-2025-6",
      "employeeId": "E0000407",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000408-2025-6",
      "employeeId": "E0000408",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000409-2025-6",
      "employeeId": "E0000409",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000410-2025-6",
      "employeeId": "E0000410",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000411-2025-6",
      "employeeId": "E0000411",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000412-2025-6",
      "employeeId": "E0000412",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000413-2025-6",
      "employeeId": "E0000413",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000414-2025-6",
      "employeeId": "E0000414",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000415-2025-6",
      "employeeId": "E0000415",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000416-2025-6",
      "employeeId": "E0000416",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000417-2025-6",
      "employeeId": "E0000417",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000418-2025-6",
      "employeeId": "E0000418",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000419-2025-6",
      "employeeId": "E0000419",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000420-2025-6",
      "employeeId": "E0000420",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000421-2025-6",
      "employeeId": "E0000421",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000422-2025-6",
      "employeeId": "E0000422",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000423-2025-6",
      "employeeId": "E0000423",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000424-2025-6",
      "employeeId": "E0000424",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000425-2025-6",
      "employeeId": "E0000425",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000426-2025-6",
      "employeeId": "E0000426",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000427-2025-6",
      "employeeId": "E0000427",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000428-2025-6",
      "employeeId": "E0000428",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000429-2025-6",
      "employeeId": "E0000429",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000430-2025-6",
      "employeeId": "E0000430",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000431-2025-6",
      "employeeId": "E0000431",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000432-2025-6",
      "employeeId": "E0000432",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000433-2025-6",
      "employeeId": "E0000433",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000434-2025-6",
      "employeeId": "E0000434",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000435-2025-6",
      "employeeId": "E0000435",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000436-2025-6",
      "employeeId": "E0000436",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000437-2025-6",
      "employeeId": "E0000437",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000438-2025-6",
      "employeeId": "E0000438",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000439-2025-6",
      "employeeId": "E0000439",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000440-2025-6",
      "employeeId": "E0000440",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000441-2025-6",
      "employeeId": "E0000441",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000442-2025-6",
      "employeeId": "E0000442",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000443-2025-6",
      "employeeId": "E0000443",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000444-2025-6",
      "employeeId": "E0000444",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000445-2025-6",
      "employeeId": "E0000445",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000446-2025-6",
      "employeeId": "E0000446",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000447-2025-6",
      "employeeId": "E0000447",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000448-2025-6",
      "employeeId": "E0000448",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000449-2025-6",
      "employeeId": "E0000449",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000450-2025-6",
      "employeeId": "E0000450",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000451-2025-6",
      "employeeId": "E0000451",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000452-2025-6",
      "employeeId": "E0000452",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000453-2025-6",
      "employeeId": "E0000453",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000454-2025-6",
      "employeeId": "E0000454",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000455-2025-6",
      "employeeId": "E0000455",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000456-2025-6",
      "employeeId": "E0000456",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000457-2025-6",
      "employeeId": "E0000457",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000458-2025-6",
      "employeeId": "E0000458",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000459-2025-6",
      "employeeId": "E0000459",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000460-2025-6",
      "employeeId": "E0000460",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000461-2025-6",
      "employeeId": "E0000461",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000462-2025-6",
      "employeeId": "E0000462",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000463-2025-6",
      "employeeId": "E0000463",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000464-2025-6",
      "employeeId": "E0000464",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000465-2025-6",
      "employeeId": "E0000465",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000466-2025-6",
      "employeeId": "E0000466",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000467-2025-6",
      "employeeId": "E0000467",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000468-2025-6",
      "employeeId": "E0000468",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000469-2025-6",
      "employeeId": "E0000469",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000470-2025-6",
      "employeeId": "E0000470",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000471-2025-6",
      "employeeId": "E0000471",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000472-2025-6",
      "employeeId": "E0000472",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000473-2025-6",
      "employeeId": "E0000473",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000474-2025-6",
      "employeeId": "E0000474",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000475-2025-6",
      "employeeId": "E0000475",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000476-2025-6",
      "employeeId": "E0000476",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000477-2025-6",
      "employeeId": "E0000477",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000478-2025-6",
      "employeeId": "E0000478",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000479-2025-6",
      "employeeId": "E0000479",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000480-2025-6",
      "employeeId": "E0000480",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000481-2025-6",
      "employeeId": "E0000481",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000482-2025-6",
      "employeeId": "E0000482",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000483-2025-6",
      "employeeId": "E0000483",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000484-2025-6",
      "employeeId": "E0000484",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000485-2025-6",
      "employeeId": "E0000485",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000486-2025-6",
      "employeeId": "E0000486",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000487-2025-6",
      "employeeId": "E0000487",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000488-2025-6",
      "employeeId": "E0000488",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000489-2025-6",
      "employeeId": "E0000489",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000490-2025-6",
      "employeeId": "E0000490",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000491-2025-6",
      "employeeId": "E0000491",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000492-2025-6",
      "employeeId": "E0000492",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000493-2025-6",
      "employeeId": "E0000493",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000494-2025-6",
      "employeeId": "E0000494",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000495-2025-6",
      "employeeId": "E0000495",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000496-2025-6",
      "employeeId": "E0000496",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000497-2025-6",
      "employeeId": "E0000497",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000498-2025-6",
      "employeeId": "E0000498",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000499-2025-6",
      "employeeId": "E0000499",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000500-2025-6",
      "employeeId": "E0000500",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000501-2025-6",
      "employeeId": "E0000501",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000502-2025-6",
      "employeeId": "E0000502",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000503-2025-6",
      "employeeId": "E0000503",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000504-2025-6",
      "employeeId": "E0000504",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000505-2025-6",
      "employeeId": "E0000505",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000506-2025-6",
      "employeeId": "E0000506",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000507-2025-6",
      "employeeId": "E0000507",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000508-2025-6",
      "employeeId": "E0000508",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000509-2025-6",
      "employeeId": "E0000509",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000510-2025-6",
      "employeeId": "E0000510",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000511-2025-6",
      "employeeId": "E0000511",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000512-2025-6",
      "employeeId": "E0000512",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000513-2025-6",
      "employeeId": "E0000513",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000514-2025-6",
      "employeeId": "E0000514",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000515-2025-6",
      "employeeId": "E0000515",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000516-2025-6",
      "employeeId": "E0000516",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000517-2025-6",
      "employeeId": "E0000517",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000518-2025-6",
      "employeeId": "E0000518",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000519-2025-6",
      "employeeId": "E0000519",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000520-2025-6",
      "employeeId": "E0000520",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000521-2025-6",
      "employeeId": "E0000521",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000522-2025-6",
      "employeeId": "E0000522",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000523-2025-6",
      "employeeId": "E0000523",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000524-2025-6",
      "employeeId": "E0000524",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000525-2025-6",
      "employeeId": "E0000525",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000526-2025-6",
      "employeeId": "E0000526",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000527-2025-6",
      "employeeId": "E0000527",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000528-2025-6",
      "employeeId": "E0000528",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000529-2025-6",
      "employeeId": "E0000529",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000530-2025-6",
      "employeeId": "E0000530",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000531-2025-6",
      "employeeId": "E0000531",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000532-2025-6",
      "employeeId": "E0000532",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000533-2025-6",
      "employeeId": "E0000533",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000534-2025-6",
      "employeeId": "E0000534",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000535-2025-6",
      "employeeId": "E0000535",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000536-2025-6",
      "employeeId": "E0000536",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000537-2025-6",
      "employeeId": "E0000537",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000538-2025-6",
      "employeeId": "E0000538",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000539-2025-6",
      "employeeId": "E0000539",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000540-2025-6",
      "employeeId": "E0000540",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000541-2025-6",
      "employeeId": "E0000541",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000542-2025-6",
      "employeeId": "E0000542",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000543-2025-6",
      "employeeId": "E0000543",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000544-2025-6",
      "employeeId": "E0000544",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000545-2025-6",
      "employeeId": "E0000545",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000546-2025-6",
      "employeeId": "E0000546",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000547-2025-6",
      "employeeId": "E0000547",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000548-2025-6",
      "employeeId": "E0000548",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000549-2025-6",
      "employeeId": "E0000549",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000550-2025-6",
      "employeeId": "E0000550",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000551-2025-6",
      "employeeId": "E0000551",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000552-2025-6",
      "employeeId": "E0000552",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000553-2025-6",
      "employeeId": "E0000553",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000554-2025-6",
      "employeeId": "E0000554",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000555-2025-6",
      "employeeId": "E0000555",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000556-2025-6",
      "employeeId": "E0000556",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": ""
    },
    {
      "id": "eval-E0000557-2025-6",
      "employeeId": "E0000557",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B(한시적)"
    },
    {
      "id": "eval-E0000558-2025-6",
      "employeeId": "E0000558",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000559-2025-6",
      "employeeId": "E0000559",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000560-2025-6",
      "employeeId": "E0000560",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000561-2025-6",
      "employeeId": "E0000561",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000562-2025-6",
      "employeeId": "E0000562",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000563-2025-6",
      "employeeId": "E0000563",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000564-2025-6",
      "employeeId": "E0000564",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000565-2025-6",
      "employeeId": "E0000565",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000566-2025-6",
      "employeeId": "E0000566",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000567-2025-6",
      "employeeId": "E0000567",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000568-2025-6",
      "employeeId": "E0000568",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000569-2025-6",
      "employeeId": "E0000569",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000570-2025-6",
      "employeeId": "E0000570",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000571-2025-6",
      "employeeId": "E0000571",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000572-2025-6",
      "employeeId": "E0000572",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000573-2025-6",
      "employeeId": "E0000573",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000574-2025-6",
      "employeeId": "E0000574",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000575-2025-6",
      "employeeId": "E0000575",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000576-2025-6",
      "employeeId": "E0000576",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000577-2025-6",
      "employeeId": "E0000577",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000578-2025-6",
      "employeeId": "E0000578",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000579-2025-6",
      "employeeId": "E0000579",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000580-2025-6",
      "employeeId": "E0000580",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000581-2025-6",
      "employeeId": "E0000581",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000582-2025-6",
      "employeeId": "E0000582",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000583-2025-6",
      "employeeId": "E0000583",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
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
      "id": "eval-E0000585-2025-6",
      "employeeId": "E0000585",
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
      "id": "eval-E0000587-2025-6",
      "employeeId": "E0000587",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000588-2025-6",
      "employeeId": "E0000588",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000589-2025-6",
      "employeeId": "E0000589",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000590-2025-6",
      "employeeId": "E0000590",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000591-2025-6",
      "employeeId": "E0000591",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000592-2025-6",
      "employeeId": "E0000592",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000593-2025-6",
      "employeeId": "E0000593",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000594-2025-6",
      "employeeId": "E0000594",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000595-2025-6",
      "employeeId": "E0000595",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000596-2025-6",
      "employeeId": "E0000596",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000597-2025-6",
      "employeeId": "E0000597",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000598-2025-6",
      "employeeId": "E0000598",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000599-2025-6",
      "employeeId": "E0000599",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000600-2025-6",
      "employeeId": "E0000600",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000601-2025-6",
      "employeeId": "E0000601",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000602-2025-6",
      "employeeId": "E0000602",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000603-2025-6",
      "employeeId": "E0000603",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000604-2025-6",
      "employeeId": "E0000604",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000605-2025-6",
      "employeeId": "E0000605",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000606-2025-6",
      "employeeId": "E0000606",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000607-2025-6",
      "employeeId": "E0000607",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000608-2025-6",
      "employeeId": "E0000608",
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
    },
    {
      "id": "eval-E0000611-2025-6",
      "employeeId": "E0000611",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000612-2025-6",
      "employeeId": "E0000612",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000613-2025-6",
      "employeeId": "E0000613",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000614-2025-6",
      "employeeId": "E0000614",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000615-2025-6",
      "employeeId": "E0000615",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "B"
    },
    {
      "id": "eval-E0000616-2025-6",
      "employeeId": "E0000616",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "A+"
    },
    {
      "id": "eval-E0000617-2025-6",
      "employeeId": "E0000617",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "A"
    },
    {
      "id": "eval-E0000618-2025-6",
      "employeeId": "E0000618",
      "year": 2025,
      "month": 6,
      "grade": null,
      "memo": "A"
    }
  ]
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


export const excelHeaderMapping: HeaderMapping = {
    // 키: 엑셀에서 사용될 수 있는 헤더 이름
    // 값: 시스템 내부에서 사용하는 필드 이름
    "고유사번": "uniqueId",
    "사번": "uniqueId",
    "ID": "uniqueId",
    "id": "uniqueId",
    "성명": "name",
    "이름": "name",
    "피평가자": "name",
    "회사": "company",
    "부서": "department",
    "소속부서": "department",
    "직책": "title",
    "성장레벨": "growthLevel",
    "근무율": "workRate",
    "실근무율": "workRate",
    "기준금액": "baseAmount",
    "개인별 기준금액": "baseAmount",
    "평가자 ID": "evaluatorId",
    "평가자 id": "evaluatorId",
    "평가자사번": "evaluatorId",
    "평가자": "evaluatorName",
    "등급": "grade",
    "비고": "memo",
    "시작일": "startDate",
    "시작일자": "startDate",
    "종료일": "endDate",
    "종료일자": "endDate",
    "출근시각": "startTime",
    "퇴근시각": "endTime",
    "일자": "date",
    "근태사용일": "date",
    "근태": "type",
    "근태종류": "type"
};

export const excelHeaderTargetScreens: Record<string, string> = {
    uniqueId: '공통', name: '공통',
    company: '대상자 관리', department: '대상자 관리',
    title: '대상자 관리', growthLevel: '대상자 관리',
    workRate: '대상자 관리', baseAmount: '대상자 관리',
    evaluatorId: '대상자/평가 결과', evaluatorName: '평가 결과',
    grade: '평가 결과', memo: '평가 결과',
    startDate: '근무 데이터', endDate: '근무 데이터',
    startTime: '근무 데이터', endTime: '근무 데이터',
    date: '근무 데이터', type: '근무 데이터',
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
