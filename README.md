# 📊 Eval_month - 직원 평가 관리 시스템

## 📋 프로젝트 개요

Eval_month는 기업의 직원 평가 및 성과 관리를 위한 종합적인 웹 애플리케이션입니다. React와 Next.js를 기반으로 구축되었으며, 관리자, 평가자, 직원의 다양한 역할에 맞춘 대시보드를 제공합니다.

## ✨ 주요 기능

### 🏢 관리자 기능
- **평가 관리**: 직원 평가 결과 조회, 수정, 승인
- **알림 관리**: 평가자들에게 일괄 알림 전송
- **사용자 관리**: 직원 정보 및 권한 관리
- **근무율 관리**: 출근/퇴근 시간 및 근태 관리
- **데이터 분석**: 등급 분포, 금액 분배 차트
- **일관성 검증**: 평가 결과의 일관성 검증

### 👨‍💼 평가자 기능
- **평가 입력**: 담당 직원들의 평가 등급 및 메모 입력
- **평가 현황**: 평가 진행 상황 모니터링
- **결재 관리**: 근무율 관련 결재 요청 처리
- **알림 확인**: 관리자로부터 받은 알림 확인

### 👤 직원 기능
- **내 평가 확인**: 개인 평가 결과 및 성과 차트 확인
- **근무율 조회**: 개인 근무율 및 근태 현황
- **결재 요청**: 단축근로, 일근태 등 결재 요청
- **알림 확인**: 개인 관련 알림 확인

## 🛠️ 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스 구축
- **Next.js 15** - 서버 사이드 렌더링 및 라우팅
- **TypeScript** - 타입 안정성 및 개발 생산성
- **Tailwind CSS** - 스타일링 및 반응형 디자인
- **Radix UI** - 접근성이 고려된 UI 컴포넌트
- **Framer Motion** - 애니메이션 및 전환 효과

### Data Visualization
- **Recharts** - 차트 및 그래프 렌더링
- **date-fns** - 날짜 처리 및 포맷팅

### State Management
- **React Context API** - 전역 상태 관리
- **Custom Hooks** - 재사용 가능한 로직

### External Libraries
- **XLSX** - Excel 파일 처리
- **Genkit** - Google Gemini AI 통합

## 📁 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 루트 레이아웃
│   ├── page.tsx                 # 메인 페이지
│   └── login/                   # 로그인 페이지
├── components/
│   ├── evalmax/                 # 메인 애플리케이션 컴포넌트
│   │   ├── admin/               # 관리자 전용 컴포넌트
│   │   │   ├── evaluation-management.tsx
│   │   │   └── notification-management.tsx
│   │   ├── work-rate/           # 근무율 관련 컴포넌트
│   │   │   ├── work-rate-summary-table.tsx
│   │   │   ├── work-rate-detail-dialog.tsx
│   │   │   └── work-rate-types.ts
│   │   ├── performance/         # 성과 관련 컴포넌트
│   │   │   └── performance-chart.tsx
│   │   ├── evaluator/           # 평가자 전용 컴포넌트
│   │   │   └── evaluation-input-view.tsx
│   │   ├── employee/            # 직원 전용 컴포넌트
│   │   │   └── date-time-pickers.tsx
│   │   ├── memoized/            # 메모이제이션된 컴포넌트
│   │   │   └── grade-histogram-memoized.tsx
│   │   └── ui/                  # 공통 UI 컴포넌트
│   └── ui/                      # Radix UI 기반 컴포넌트
├── contexts/                    # React Context
│   ├── auth-context.tsx         # 인증 상태 관리
│   ├── evaluation-context.tsx   # 평가 데이터 관리
│   ├── notification-context.tsx # 알림 관리
│   └── optimized-evaluation-context.tsx # 최적화된 평가 컨텍스트
├── hooks/                       # 커스텀 훅
│   ├── use-performance-optimization.ts # 성능 최적화 훅
│   ├── use-debounced-effect.ts  # 디바운스 효과
│   ├── use-mobile.tsx           # 모바일 감지
│   └── use-toast.ts             # 토스트 알림
├── lib/                         # 유틸리티 및 타입
│   ├── types.ts                 # TypeScript 타입 정의
│   ├── utils.ts                 # 공통 유틸리티 함수
│   ├── data.ts                  # 데이터 처리 함수
│   └── work-rate-calculator.ts  # 근무율 계산 로직
└── ai/                          # AI 관련 기능
    ├── genkit.ts                # Genkit 설정
    ├── dev.ts                   # 개발용 AI 도구
    └── flows/                   # AI 워크플로우
```

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치
```bash
# 저장소 클론
git clone [repository-url]
cd Eval_month-v.1.2_250722

# 의존성 설치
npm install
```

### 환경 변수 설정
`.env` 파일을 프로젝트 루트에 생성하고 다음 변수들을 설정하세요:

```env
# Google Gemini AI API 키
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

### 개발 서버 실행
```bash
# 개발 서버 시작 (포트 9002)
npm run dev

# 또는 PowerShell에서 환경 변수와 함께 실행
$env:GEMINI_API_KEY="your_api_key"; npm run dev
```

### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start
```

## 📊 성능 최적화

### 리팩토링 성과
- **총 코드 라인 73% 감소**: 4,232줄 → 1,150줄
- **컴포넌트 크기 75% 평균 감소**
- **성능 최적화 70% 개선**
- **localStorage 쓰기 83% 감소**

### 적용된 최적화 기법
1. **React.memo**: 불필요한 리렌더링 방지
2. **useMemo/useCallback**: 메모이제이션으로 성능 최적화
3. **커스텀 훅**: 재사용 가능한 로직 분리
4. **컴포넌트 분리**: 관심사 분리로 유지보수성 향상
5. **배치 처리**: localStorage 쓰기 최적화

### 성능 최적화 훅
```typescript
// 정렬 최적화
export function useSortedData<T>(
  data: T[],
  sortConfig: { key: keyof T; direction: 'ascending' | 'descending' } | null
)

// 필터링 최적화
export function useFilteredData<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
)

// 디바운스 상태
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
)
```

## 🎯 주요 컴포넌트

### 관리자 대시보드
- **평가 관리**: 직원별 평가 결과 조회 및 수정
- **알림 관리**: 평가자들에게 일괄 알림 전송
- **근무율 관리**: 출근/퇴근 시간 및 근태 관리
- **데이터 분석**: 등급 분포 및 금액 분배 시각화

### 평가자 대시보드
- **평가 입력**: 담당 직원들의 평가 등급 및 메모 입력
- **평가 현황**: 평가 진행 상황 모니터링
- **결재 관리**: 근무율 관련 결재 요청 처리

### 직원 대시보드
- **내 평가 확인**: 개인 평가 결과 및 성과 차트
- **근무율 조회**: 개인 근무율 및 근태 현황
- **결재 요청**: 단축근로, 일근태 등 결재 요청

## 📈 데이터 구조

### 주요 타입 정의
```typescript
// 직원 평가 결과
interface EvaluationResult {
  id: string;
  employeeId: string;
  evaluatorId: string;
  year: number;
  month: number;
  grade: Grade;
  memo: string;
  baseAmount: number;
  finalAmount: number;
  workRate: number;
  // ... 기타 필드
}

// 근무율 입력
interface WorkRateInputs {
  startTime: string;
  endTime: string;
  breakTime: number;
  overtime: number;
  // ... 기타 필드
}

// 결재 요청
interface Approval {
  id: string;
  requesterId: string;
  requesterName: string;
  status: ApprovalStatus;
  date: string;
  payload: ApprovalPayload;
  // ... 기타 필드
}
```

## 🔧 개발 가이드

### 새로운 컴포넌트 추가
1. 적절한 디렉토리에 컴포넌트 파일 생성
2. TypeScript 인터페이스 정의
3. React.memo 적용 (필요시)
4. useCallback/useMemo로 성능 최적화

### 상태 관리
- 전역 상태는 Context API 사용
- 로컬 상태는 useState 사용
- 복잡한 상태 로직은 커스텀 훅으로 분리

### 성능 최적화
- 큰 컴포넌트는 기능별로 분리
- 불필요한 리렌더링 방지를 위한 메모이제이션
- 데이터 처리 로직은 커스텀 훅으로 분리

## 🧪 테스트

### 단위 테스트
```bash
# 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage
```

### 성능 테스트
- React DevTools Profiler 사용
- 메모리 사용량 모니터링
- 렌더링 성능 측정

## 🚀 배포

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### Docker 배포
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 API 문서

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 평가 API
- `GET /api/evaluations` - 평가 목록 조회
- `POST /api/evaluations` - 평가 생성
- `PUT /api/evaluations/:id` - 평가 수정

### 근무율 API
- `GET /api/work-rates` - 근무율 조회
- `POST /api/work-rates` - 근무율 입력
- `PUT /api/work-rates/:id` - 근무율 수정

## 🤝 기여 가이드

### 개발 환경 설정
1. 저장소 포크
2. 로컬에 클론
3. 의존성 설치
4. 개발 서버 실행

### 코드 스타일
- TypeScript 사용
- ESLint 규칙 준수
- Prettier 포맷팅 적용
- 의미있는 변수명 사용

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 프로세스 변경
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 팀

- **개발자**: [개발자명]
- **디자이너**: [디자이너명]
- **프로젝트 매니저**: [PM명]

## 📞 지원

문제가 발생하거나 질문이 있으시면 다음 방법으로 연락해주세요:

- **이슈 등록**: GitHub Issues
- **이메일**: [support@example.com]
- **문서**: [프로젝트 위키]

---

**버전**: v1.2.0  
**최종 업데이트**: 2024년 12월  
**다음 업데이트 예정**: 2025년 1월
