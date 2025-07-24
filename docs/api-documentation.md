# 📖 API 문서

## 개요
평가 시스템의 REST API 문서입니다. 모든 API는 JSON 형식으로 요청/응답을 처리합니다.

## 기본 정보
- **Base URL**: `https://api.evaluation-system.com/v1`
- **Content-Type**: `application/json`
- **인증**: Bearer Token (JWT)

## 인증

### 로그인
```http
POST /auth/login
```

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_1",
      "name": "김철수",
      "email": "user@example.com",
      "role": "evaluator",
      "department": "개발팀"
    }
  }
}
```

### 토큰 갱신
```http
POST /auth/refresh
```

**요청 헤더:**
```
Authorization: Bearer <refresh_token>
```

## 평가 관리

### 평가 목록 조회
```http
GET /evaluations
```

**쿼리 파라미터:**
- `month` (string): YYYY-MM 형식의 월
- `status` (string): completed, pending, in_progress
- `department` (string): 부서명
- `page` (number): 페이지 번호 (기본값: 1)
- `limit` (number): 페이지당 항목 수 (기본값: 20)

**응답:**
```json
{
  "success": true,
  "data": {
    "evaluations": [
      {
        "id": "eval_1",
        "employeeId": "emp_1",
        "employeeName": "김철수",
        "department": "개발팀",
        "score": 4,
        "comment": "우수한 성과",
        "strengths": "문제 해결 능력이 뛰어남",
        "improvements": "의사소통 개선 필요",
        "date": "2024-01-15",
        "status": "completed",
        "evaluatorId": "eval_1"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 평가 생성
```http
POST /evaluations
```

**요청 본문:**
```json
{
  "employeeId": "emp_1",
  "score": 4,
  "comment": "우수한 성과를 보여줌",
  "strengths": "문제 해결 능력이 뛰어남",
  "improvements": "의사소통 개선 필요"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "eval_1",
    "employeeId": "emp_1",
    "employeeName": "김철수",
    "department": "개발팀",
    "score": 4,
    "comment": "우수한 성과를 보여줌",
    "strengths": "문제 해결 능력이 뛰어남",
    "improvements": "의사소통 개선 필요",
    "date": "2024-01-15",
    "status": "completed",
    "evaluatorId": "eval_1"
  }
}
```

### 평가 수정
```http
PUT /evaluations/{id}
```

**요청 본문:**
```json
{
  "score": 5,
  "comment": "매우 우수한 성과",
  "strengths": "창의적이고 혁신적",
  "improvements": "없음"
}
```

### 평가 삭제
```http
DELETE /evaluations/{id}
```

## 과제 관리

### 과제 목록 조회
```http
GET /assignments
```

**쿼리 파라미터:**
- `month` (string): YYYY-MM 형식의 월
- `status` (string): pending, in_progress, completed
- `priority` (string): low, medium, high
- `department` (string): 부서명

**응답:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "assign_1",
        "employeeId": "emp_1",
        "employeeName": "김철수",
        "department": "개발팀",
        "dueDate": "2024-01-31",
        "status": "pending",
        "priority": "high",
        "evaluatorId": "eval_1"
      }
    ]
  }
}
```

### 과제 상태 업데이트
```http
PATCH /assignments/{id}
```

**요청 본문:**
```json
{
  "status": "in_progress"
}
```

## 통계

### 월별 통계 조회
```http
GET /statistics/monthly
```

**쿼리 파라미터:**
- `month` (string): YYYY-MM 형식의 월

**응답:**
```json
{
  "success": true,
  "data": {
    "totalEvaluations": 50,
    "completedEvaluations": 45,
    "averageScore": 4.2,
    "completionRate": 90.0,
    "departmentStats": [
      {
        "department": "개발팀",
        "total": 20,
        "completed": 18,
        "averageScore": 4.3
      }
    ]
  }
}
```

## 알림

### 알림 목록 조회
```http
GET /notifications
```

**쿼리 파라미터:**
- `unread` (boolean): 읽지 않은 알림만 조회
- `type` (string): 알림 유형

**응답:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_1",
        "type": "evaluation_due",
        "title": "평가 마감일 임박",
        "message": "김철수님의 평가가 3일 후 마감됩니다.",
        "read": false,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

### 알림 읽음 처리
```http
PATCH /notifications/{id}/read
```

## 에러 응답

모든 API는 에러 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "필수 필드가 누락되었습니다.",
    "details": {
      "field": "score",
      "reason": "점수는 1-5 사이의 숫자여야 합니다."
    }
  }
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `UNAUTHORIZED` | 인증 실패 |
| `FORBIDDEN` | 권한 없음 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `VALIDATION_ERROR` | 입력값 검증 실패 |
| `INTERNAL_ERROR` | 서버 내부 오류 |

## 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성됨 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 찾을 수 없음 |
| 500 | 서버 오류 |

## Rate Limiting

API는 Rate Limiting을 적용합니다:
- 일반 사용자: 1000 requests/hour
- 관리자: 5000 requests/hour

Rate Limit 초과 시 429 상태 코드와 함께 응답합니다. 