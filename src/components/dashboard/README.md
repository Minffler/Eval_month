# Dashboard Components

## 구조 개선 목적
- 단일 책임 원칙 적용
- 코드 재사용성 향상
- 유지보수성 개선
- 성능 최적화

## 폴더 구조
```
dashboard/
├── evaluator/           # 평가자 대시보드 관련
│   ├── EvaluatorDashboard.tsx
│   ├── AssignmentManagement.tsx
│   ├── EvaluationInput.tsx
│   └── ResultsView.tsx
├── admin/              # 관리자 대시보드 관련
│   ├── AdminDashboard.tsx
│   ├── EvaluationManagement.tsx
│   ├── NotificationManagement.tsx
│   └── UserManagement.tsx
├── employee/           # 직원 대시보드 관련
│   ├── EmployeeDashboard.tsx
│   ├── PerformanceReview.tsx
│   └── WorkRateView.tsx
└── common/             # 공통 대시보드 컴포넌트
    ├── DashboardLayout.tsx
    ├── StatsCard.tsx
    ├── NotificationPanel.tsx
    └── MonthSelector.tsx
```

## 리팩토링 규칙
1. 각 컴포넌트는 단일 책임을 가져야 함
2. 100줄 이하로 유지
3. 재사용 가능한 로직은 hooks로 분리
4. 타입 안정성 보장
5. 성능 최적화 적용 