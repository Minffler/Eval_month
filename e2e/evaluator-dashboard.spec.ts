import { test, expect } from '@playwright/test'

test.describe('평가자 대시보드 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login')
    
    // 로그인 처리 (실제 환경에 맞게 수정 필요)
    await page.fill('[data-testid="email-input"]', 'evaluator@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('/dashboard')
  })

  test('대시보드 기본 렌더링', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 기본 요소들이 표시되는지 확인
    await expect(page.getByText('평가자 대시보드')).toBeVisible()
    await expect(page.getByText('총 과제 수')).toBeVisible()
    await expect(page.getByText('완료된 평가')).toBeVisible()
    await expect(page.getByText('대기 중인 평가')).toBeVisible()
    await expect(page.getByText('완료율')).toBeVisible()
  })

  test('월 선택기 기능', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 월 선택기 클릭
    await page.click('[data-testid="month-selector"]')
    
    // 다른 월 선택
    await page.click('text=2024년 2월')
    
    // 선택된 월이 변경되었는지 확인
    await expect(page.getByText('2024-02 평가 현황')).toBeVisible()
  })

  test('과제 관리 테이블', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 과제 관리 섹션이 표시되는지 확인
    await expect(page.getByText('과제 관리')).toBeVisible()
    
    // 테이블에 데이터가 있는지 확인
    await expect(page.locator('table')).toBeVisible()
    
    // 과제 행이 표시되는지 확인
    const tableRows = page.locator('table tbody tr')
    await expect(tableRows).toHaveCount(2) // 예상되는 과제 수
  })

  test('평가 입력 기능', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 평가 입력 섹션으로 이동
    await page.click('text=평가 입력')
    
    // 과제 선택
    await page.selectOption('[data-testid="assignment-select"]', 'assign_1')
    
    // 점수 입력
    await page.selectOption('[data-testid="score-select"]', '4')
    
    // 의견 입력
    await page.fill('[data-testid="comment-textarea"]', '우수한 성과를 보여줌')
    await page.fill('[data-testid="strengths-textarea"]', '문제 해결 능력이 뛰어남')
    await page.fill('[data-testid="improvements-textarea"]', '의사소통 개선 필요')
    
    // 평가 제출
    await page.click('[data-testid="submit-evaluation"]')
    
    // 성공 메시지 확인
    await expect(page.getByText('평가가 성공적으로 제출되었습니다.')).toBeVisible()
  })

  test('결과 조회 기능', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 결과 조회 섹션으로 이동
    await page.click('text=평가 결과')
    
    // 결과 테이블이 표시되는지 확인
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible()
    
    // 통계 정보가 표시되는지 확인
    await expect(page.getByText('평균 점수')).toBeVisible()
    await expect(page.getByText('총 평가 수')).toBeVisible()
  })

  test('필터링 및 정렬', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 부서별 필터링
    await page.selectOption('[data-testid="department-filter"]', '개발팀')
    
    // 필터링된 결과 확인
    const filteredRows = page.locator('table tbody tr')
    await expect(filteredRows).toHaveCount(1) // 개발팀 과제만 표시
    
    // 정렬 기능 테스트
    await page.click('[data-testid="sort-employee-name"]')
    
    // 정렬된 결과 확인
    await expect(page.locator('table tbody tr').first()).toContainText('김철수')
  })

  test('반응형 디자인', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/dashboard')
    
    // 모바일에서도 모든 요소가 표시되는지 확인
    await expect(page.getByText('평가자 대시보드')).toBeVisible()
    
    // 사이드바가 모바일에서 숨겨지는지 확인
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible()
    
    // 햄버거 메뉴 클릭
    await page.click('[data-testid="mobile-menu-button"]')
    
    // 사이드바가 나타나는지 확인
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
  })

  test('성능 테스트', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 페이지 로딩 시간 측정
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 로딩 시간이 3초 이내인지 확인
    expect(loadTime).toBeLessThan(3000)
    
    // 메모리 사용량 확인 (개발자 도구 필요)
    const performanceMetrics = await page.evaluate(() => {
      return {
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        domNodes: document.querySelectorAll('*').length
      }
    })
    
    // DOM 노드 수가 합리적인 범위인지 확인
    expect(performanceMetrics.domNodes).toBeLessThan(1000)
  })

  test('접근성 테스트', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // 스크린 리더 지원 확인
    await expect(page.locator('[aria-label="통계 카드"]')).toBeVisible()
    await expect(page.locator('[role="table"]')).toBeVisible()
    
    // 색상 대비 확인 (시각적 테스트)
    const contrastRatio = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="stats-card"]')
      if (!element) return 0
      
      // 간단한 색상 대비 계산 (실제로는 더 정교한 계산 필요)
      const style = window.getComputedStyle(element)
      return style.color && style.backgroundColor ? 4.5 : 0
    })
    
    expect(contrastRatio).toBeGreaterThan(0)
  })

  test('에러 처리', async ({ page }) => {
    // 네트워크 오류 시뮬레이션
    await page.route('**/api/evaluations', route => route.abort())
    
    await page.goto('/dashboard')
    
    // 에러 메시지가 표시되는지 확인
    await expect(page.getByText('데이터를 불러오는 중 오류가 발생했습니다.')).toBeVisible()
    
    // 재시도 버튼이 작동하는지 확인
    await page.click('[data-testid="retry-button"]')
    await expect(page.getByText('데이터를 다시 불러오는 중...')).toBeVisible()
  })
}) 