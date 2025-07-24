# 🏢 평가 시스템 (Evaluation System)

> 현대적이고 효율적인 직원 평가 관리 시스템

[![Build Status](https://github.com/your-org/evaluation-system/workflows/Deploy%20to%20Production/badge.svg)](https://github.com/your-org/evaluation-system/actions)
[![Test Coverage](https://codecov.io/gh/your-org/evaluation-system/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/evaluation-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [테스트](#테스트)
- [배포](#배포)
- [모니터링](#모니터링)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

## 🎯 개요

평가 시스템은 기업의 직원 성과 평가를 디지털화하여 효율적이고 공정한 평가 프로세스를 제공하는 웹 애플리케이션입니다.

### ✨ 주요 특징

- **역할 기반 접근**: 평가자, 관리자, 직원별 맞춤 인터페이스
- **실시간 통계**: 월별 평가 현황 및 성과 분석
- **성능 최적화**: React.memo, 가상화, 지연 로딩 적용
- **완전한 테스트**: 단위, 통합, E2E 테스트 커버리지 90%+
- **자동화된 배포**: CI/CD 파이프라인으로 안정적인 배포
- **실시간 모니터링**: 성능, 에러, 사용자 행동 추적

## 🚀 주요 기능

### 👨‍💼 평가자 기능
- 월별 평가 과제 관리
- 직원별 평가 입력 및 수정
- 평가 결과 조회 및 통계
- 실시간 알림 및 마감일 관리

### 👨‍💻 관리자 기능
- 사용자 및 권한 관리
- 평가 기간 및 기준 설정
- 전체 통계 및 리포트 생성
- 시스템 설정 및 모니터링

### 👤 직원 기능
- 본인 평가 결과 확인
- 평가자 피드백 조회
- 개인 성과 추이 분석
- 개인 설정 관리

## 🛠 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스
- **TypeScript** - 타입 안정성
- **Next.js 14** - 서버 사이드 렌더링
- **Tailwind CSS** - 스타일링
- **Shadcn/ui** - UI 컴포넌트

### Backend
- **Next.js API Routes** - 서버 API
- **Prisma** - 데이터베이스 ORM
- **PostgreSQL** - 메인 데이터베이스
- **Redis** - 캐싱 및 세션

### 테스트
- **Jest** - 단위 테스트
- **React Testing Library** - 컴포넌트 테스트
- **Playwright** - E2E 테스트
- **Codecov** - 테스트 커버리지

### 배포 & 모니터링
- **Vercel** - 호스팅 및 배포
- **GitHub Actions** - CI/CD
- **Sentry** - 에러 추적
- **Vercel Analytics** - 성능 모니터링

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 9.0.0 이상
- PostgreSQL 14.0 이상
- Redis 6.0 이상

### 설치

1. **저장소 클론**
```bash
git clone https://github.com/your-org/evaluation-system.git
cd evaluation-system
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 필요한 환경 변수를 설정하세요:

```env
# 데이터베이스
DATABASE_URL="postgresql://username:password@localhost:5432/evaluation_system"

# Redis
REDIS_URL="redis://localhost:6379"

# 인증
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 외부 서비스
SENTRY_DSN="your-sentry-dsn"
VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
```

4. **데이터베이스 설정**
```bash
# 데이터베이스 마이그레이션
npx prisma migrate dev

# 시드 데이터 생성
npx prisma db seed
```

5. **개발 서버 실행**
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 📁 프로젝트 구조

```
evaluation-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 라우트
│   │   ├── dashboard/         # 대시보드 페이지
│   │   ├── login/             # 로그인 페이지
│   │   └── layout.tsx         # 루트 레이아웃
│   ├── components/            # React 컴포넌트
│   │   ├── dashboard/         # 대시보드 컴포넌트
│   │   │   ├── common/        # 공통 컴포넌트
│   │   │   ├── evaluator/     # 평가자 컴포넌트
│   │   │   ├── admin/         # 관리자 컴포넌트
│   │   │   └── employee/      # 직원 컴포넌트
│   │   └── ui/                # UI 컴포넌트
│   ├── contexts/              # React Context
│   ├── hooks/                 # 커스텀 훅
│   ├── lib/                   # 유틸리티 함수
│   └── types/                 # TypeScript 타입 정의
├── prisma/                    # 데이터베이스 스키마
├── e2e/                       # E2E 테스트
├── docs/                      # 문서
└── public/                    # 정적 파일
```

## 👨‍💻 개발 가이드

### 코드 스타일

- **TypeScript**: 엄격한 타입 체크 사용
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **Husky**: Git 훅으로 코드 품질 보장

### 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린팅
npm run lint

# 타입 체크
npm run type-check

# 코드 포맷팅
npm run format
```

### 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 🧪 테스트

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 단위 테스트만 실행
npm run test:unit

# 통합 테스트만 실행
npm run test:integration

# E2E 테스트만 실행
npm run test:e2e

# 테스트 커버리지 생성
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

### 테스트 커버리지

- **단위 테스트**: 85% 커버리지
- **통합 테스트**: 90% 커버리지
- **E2E 테스트**: 95% 커버리지

## 🚀 배포

### 자동 배포

GitHub Actions를 통해 자동으로 배포됩니다:

1. **Pull Request**: 스테이징 환경에 배포
2. **Main 브랜치 푸시**: 프로덕션 환경에 배포

### 수동 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### 환경별 설정

- **개발**: `http://localhost:3000`
- **스테이징**: `https://evaluation-system-staging.vercel.app`
- **프로덕션**: `https://evaluation-system.vercel.app`

## 📊 모니터링

### 성능 모니터링

- **Core Web Vitals**: LCP, FID, CLS 추적
- **페이지 로딩 시간**: 실시간 측정
- **사용자 행동**: 클릭, 페이지 뷰 추적

### 에러 추적

- **JavaScript 에러**: 자동 캐치 및 보고
- **API 에러**: 서버 에러 추적
- **사용자 피드백**: 에러 발생 시 컨텍스트 수집

### 알림

- **Slack**: 중요 에러 및 성능 이슈 알림
- **이메일**: 일일/주간 리포트
- **대시보드**: 실시간 모니터링 대시보드

## 🤝 기여하기

### 기여 프로세스

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성 (`feature/issue-number`)
3. 코드 작성 및 테스트
4. Pull Request 생성
5. 코드 리뷰 및 승인
6. 메인 브랜치 병합

### 개발 환경 설정

```bash
# 포크된 저장소 클론
git clone https://github.com/your-username/evaluation-system.git

# 원본 저장소 추가
git remote add upstream https://github.com/your-org/evaluation-system.git

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 코드 리뷰 체크리스트

- [ ] 코드가 프로젝트 스타일 가이드를 따르는가?
- [ ] 새로운 기능에 대한 테스트가 포함되어 있는가?
- [ ] 문서가 업데이트되었는가?
- [ ] 성능에 영향을 주지 않는가?
- [ ] 보안 취약점이 없는가?

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

### 문서

- [API 문서](docs/api-documentation.md)
- [사용자 가이드](docs/user-guide.md)
- [개발자 가이드](docs/developer-guide.md)

### 연락처

- **이메일**: support@evaluation-system.com
- **이슈**: [GitHub Issues](https://github.com/your-org/evaluation-system/issues)
- **토론**: [GitHub Discussions](https://github.com/your-org/evaluation-system/discussions)

---

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**
