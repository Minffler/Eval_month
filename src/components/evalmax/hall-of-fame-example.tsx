'use client';
import * as React from 'react';
import MyHallOfFame from './my-hall-of-fame';
import type { EvaluationResult } from '@/lib/types';

function generateSampleData(year: number) {
  const data: EvaluationResult[] = [];
  for (let month = 1; month <= 12; month++) {
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
      uniqueId: '0000001',
      name: '홍길동',
      company: 'OK',
      department: '개발팀',
      title: '사원',
      position: '사원',
      growthLevel: '초급',
      workRate: 100,
                      baseAmount: 570000,
      year,
      month,
      grade,
      score,
      payoutRate: 1.0,
      gradeAmount: 3000000,
      finalAmount: 3000000,
      evaluatorId: '0000002',
      evaluatorName: '김평가',
      evaluationGroup: 'A. 정규평가',
      detailedGroup1: '정규평가',
      detailedGroup2: '개발팀'
    });
  }
  return data;
}

export default function HallOfFameExample() {
  const [selectedDate, setSelectedDate] = React.useState({ year: 2024, month: 6 });
  const [sampleData, setSampleData] = React.useState(() => generateSampleData(2024));

  const handleYearChange = (year: number) => {
    setSelectedDate(prev => ({ ...prev, year }));
    setSampleData(generateSampleData(year));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">명예의 전당 예시</h1>
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
        <MyHallOfFame 
          allResultsForYear={sampleData}
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 bg-muted/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">사용법</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• 연도 선택 버튼으로 다른 연도의 데이터를 확인할 수 있습니다.</li>
          <li>• S, A+, A, B+ 등급을 달성하면 해당하는 뱃지가 표시됩니다.</li>
          <li>• 뱃지는 최신순으로 정렬되어 표시됩니다.</li>
          <li>• 연간 트로피는 향후 기능 확장을 위해 준비되어 있습니다.</li>
        </ul>
      </div>
    </div>
  );
} 