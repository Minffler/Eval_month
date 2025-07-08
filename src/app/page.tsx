'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import type { Employee, EvaluationResult, Grade, GradeInfo, User } from '@/lib/types';
import { mockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockUsers, mockEvaluations } from '@/lib/data';

export default function Home() {
  const { user, role, setUser } = useAuth();
  
  const [employees, setEmployees] = React.useState<Employee[]>(mockEmployees);
  const [gradingScale, setGradingScale] = React.useState(initialGradingScale);
  const [results, setResults] = React.useState<EvaluationResult[]>([]);

  React.useEffect(() => {
    const getDetailedGroup1 = (workRate: number): string => {
        if (workRate >= 0.7) return 'A. 70% 이상';
        if (workRate < 0.25) return 'C. 25% 미만';
        const ratePercent = Math.floor(workRate * 100);
        const lowerBound = Math.floor(ratePercent / 5) * 5;
        const upperBound = lowerBound + 4;
        if (lowerBound === 65) return 'B. 69~65%';
        if (lowerBound < 65 && lowerBound >= 25) return `B. ${upperBound}~${lowerBound}%`;
        return `B. ${ratePercent}%`;
    }

    const getFullEvaluationResults = (
        currentEmployees: Employee[],
        currentGradingScale: Record<NonNullable<Grade>, GradeInfo>
    ): EvaluationResult[] => {
      return currentEmployees.map(employee => {
        const evaluation = mockEvaluations.find(e => e.employeeId === employee.id);
        const grade = evaluation?.grade || null;
        
        const gradeInfo = grade ? currentGradingScale[grade] : null;
        const score = gradeInfo ? gradeInfo.score : 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        
        const gradeAmount = employee.baseAmount * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
        const evaluator = mockUsers.find(u => u.id === employee.evaluatorId);

        const detailedGroup1 = getDetailedGroup1(employee.workRate);
        const detailedGroup2 = employee.title || employee.growthLevel;

        return {
          ...employee,
          grade,
          score,
          payoutRate,
          gradeAmount,
          finalAmount,
          evaluatorName: evaluator?.name || 'N/A',
          detailedGroup1,
          detailedGroup2,
        };
      });
    };

    setResults(getFullEvaluationResults(employees, gradingScale));
  }, [employees, gradingScale]);

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard 
                  results={results}
                  setEmployees={setEmployees}
                  gradingScale={gradingScale}
                  setGradingScale={setGradingScale}
                />;
      case 'evaluator':
        return <EvaluatorDashboard allResults={results} />;
      case 'employee':
        return <EmployeeDashboard allResults={results} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {user ? renderDashboard() : <p>로딩중...</p>}
      </main>
    </div>
  );
}
