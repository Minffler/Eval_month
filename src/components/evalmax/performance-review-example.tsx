'use client';

import * as React from 'react';
import MyPerformanceReview from './my-performance-review';

// 예시 데이터 생성 함수
function generateSampleData(year: number) {
  const data = [];
  for (let month = 1; month <= 12; month++) {
    // 랜덤한 성과 데이터 생성
    const score = Math.floor(Math.random() * 100) + 50; // 50-150점
    let grade: 'S' | 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'C' | 'C-' | 'D' | null = null;
    
    if (score >= 140) grade = 'S';
    else if (score >= 130) grade = 'A+';
    else if (score >= 120) grade = 'A';
    else if (score >= 110) grade = 'B+';
    else if (score >= 100) grade = 'B';
    else if (score >= 90) grade = 'B-';
    else if (score >= 80) grade = 'C';
    else if (score >= 70) grade = 'C-';
    else grade = 'D';
    
    data.push({
      month,
      grade,
      score,
      year
    });
  }
  return data;
}

export default function PerformanceReviewExample() {
  const [selectedDate, setSelectedDate] = React.useState({ year: 2024, month: 6 });
  const [sampleData, setSampleData] = React.useState(() => generateSampleData(2024));

  const handleYearChange = (year: number) => {
    setSelectedDate(prev => ({ ...prev, year }));
    setSampleData(generateSampleData(year));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">성과 리뷰 예시</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">연도 선택:</label>
          <select 
            value={selectedDate.year} 
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            <option value={2023}>2023년</option>
            <option value={2024}>2024년</option>
            <option value={2025}>2025년</option>
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <MyPerformanceReview 
          allResultsForYear={sampleData}
          selectedDate={selectedDate}
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 bg-muted/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">사용법</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• 연도 선택 버튼으로 다른 연도의 데이터를 확인할 수 있습니다.</li>
          <li>• S, A+, A 등급 달성 시 자동으로 콘페티 효과가 실행됩니다.</li>
          <li>• 최신 등급 카드를 클릭하면 콘페티 효과를 다시 실행할 수 있습니다.</li>
          <li>• 라인 차트에서 월별 성과 변화를 확인할 수 있습니다.</li>
          <li>• 하단의 월별 등급 표에서 각 월의 상세 정보를 확인할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
} 