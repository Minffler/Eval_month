# 연간 성과 히스토리 카드 & 콘페티 효과 구현 가이드

## 개요

이 문서는 '연간 성과 히스토리' 카드와 화려한 '콘페티 효과'를 포함한 동적인 UI 컴포넌트 구현 방법을 설명합니다.

## 핵심 기능

1. **부드러운 라인 차트**: 1년 치 성과 데이터 시각화
2. **등급별 콘페티 효과**: S, A+, A 등급 달성 시 축하 효과
3. **반응형 애니메이션**: framer-motion을 활용한 부드러운 전환
4. **인터랙티브 UI**: 클릭으로 콘페티 재실행 가능

## 설치된 라이브러리

```json
{
  "recharts": "^2.15.1",
  "framer-motion": "^11.2.10", 
  "canvas-confetti": "^1.9.3",
  "@types/canvas-confetti": "^1.6.4"
}
```

## 컴포넌트 구조

### 1. MyPerformanceReview 컴포넌트

**위치**: `src/components/evalmax/my-performance-review.tsx`

**주요 Props**:
```typescript
interface MyPerformanceReviewProps {
  allResultsForYear: PerformanceHistoryData[];
  selectedDate: { year: number; month: number };
}

interface PerformanceHistoryData {
  month: number;
  grade: 'S' | 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'C' | 'C-' | 'D' | null;
  score: number;
  year: number;
}
```

### 2. 핵심 기능별 구현

#### A. 등급별 색상 시스템
```typescript
const gradeToColor: Record<string, string> = {
  'S': 'text-purple-500', 
  'A+': 'text-yellow-500', 
  'A': 'text-yellow-500',
  'B+': 'text-orange-700', 
  'B': 'text-lime-500', 
  'B-': 'text-yellow-600',
  'C': 'text-orange-500', 
  'C-': 'text-red-500', 
  'D': 'text-gray-500'
};
```

#### B. 콘페티 효과 로직
```typescript
const triggerConfetti = React.useCallback(() => {
  if (!latestResult?.grade) return;

  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  // S 등급: 화려한 다색 콘페티
  if (latestResult.grade === 'S') {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      
      const particleCount = 200 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }
  
  // A+, A 등급: 노랑/주황 계열 콘페티
  else if (latestResult.grade === 'A+' || latestResult.grade === 'A') {
    const end = Date.now() + (2 * 1000);
    const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FF7F50', '#FF6347'];
    
    (function frame() {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
}, [latestResult]);
```

#### C. 차트 데이터 가공
```typescript
const chartData = React.useMemo(() => 
  Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const result = allResultsForYear.find(r => r.month === month);
    return {
      month: `${month}월`,
      score: result?.score ?? null,
      grade: result?.grade ?? null
    };
  })
, [allResultsForYear]);
```

#### D. 애니메이션 효과
```typescript
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.5 }}
  className={cn(
    "relative p-6 rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:scale-105",
    gradeToBgColor[latestResult.grade!] || 'bg-muted/50 border-border'
  )}
  onClick={triggerConfetti}
>
```

## 사용 방법

### 1. 기본 사용법
```tsx
import MyPerformanceReview from '@/components/evalmax/my-performance-review';

function MyComponent() {
  const performanceData = [
    { month: 1, grade: 'A', score: 120, year: 2024 },
    { month: 2, grade: 'B+', score: 115, year: 2024 },
    // ... 12개월 데이터
  ];

  return (
    <MyPerformanceReview 
      allResultsForYear={performanceData}
      selectedDate={{ year: 2024, month: 6 }}
    />
  );
}
```

### 2. 예시 컴포넌트
**위치**: `src/components/evalmax/performance-review-example.tsx`

이 컴포넌트는 MyPerformanceReview의 사용 예시를 보여주며, 랜덤 데이터 생성과 연도 변경 기능을 포함합니다.

## 성능 최적화

1. **useMemo**: 차트 데이터 가공 시 불필요한 재계산 방지
2. **useCallback**: 콘페티 함수 재생성 방지
3. **AnimatePresence**: 컴포넌트 마운트/언마운트 시 부드러운 전환

## 브라우저 호환성

- **Canvas API**: 콘페티 효과를 위해 필요
- **CSS Grid/Flexbox**: 레이아웃 구성
- **CSS Variables**: 테마 색상 적용

## 커스터마이징

### 등급별 색상 변경
```typescript
const gradeToColor: Record<string, string> = {
  'S': 'text-purple-500',  // 원하는 색상으로 변경
  'A+': 'text-yellow-500',
  // ...
};
```

### 콘페티 효과 커스터마이징
```typescript
// S 등급 효과 수정
if (latestResult.grade === 'S') {
  const duration = 3 * 1000; // 지속 시간 변경
  const particleCount = 300;  // 파티클 수 변경
  // ...
}
```

### 차트 스타일 변경
```typescript
<Line 
  type="monotone" 
  dataKey="score" 
  stroke="hsl(var(--primary))"  // 선 색상
  strokeWidth={3}                // 선 두께
  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}  // 점 스타일
/>
```

## 트러블슈팅

### 1. 콘페티가 실행되지 않는 경우
- `canvas-confetti` 라이브러리가 올바르게 설치되었는지 확인
- 브라우저에서 Canvas API를 지원하는지 확인

### 2. 차트가 표시되지 않는 경우
- `recharts` 라이브러리가 올바르게 설치되었는지 확인
- 데이터 형식이 올바른지 확인

### 3. 애니메이션이 부드럽지 않은 경우
- `framer-motion` 라이브러리가 올바르게 설치되었는지 확인
- 브라우저 성능 설정 확인

## 추가 개선 사항

1. **접근성**: 스크린 리더 지원 추가
2. **다국어**: i18n 지원
3. **테마**: 다크모드 지원
4. **애니메이션**: 더 다양한 전환 효과
5. **데이터**: 실시간 데이터 연동

## 라이센스

이 구현은 MIT 라이센스 하에 제공됩니다. 