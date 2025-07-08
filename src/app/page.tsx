'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import type { Employee, Evaluation, EvaluationResult, Grade, GradeInfo, User } from '@/lib/types';
import { mockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockUsers, mockEvaluations as initialMockEvaluations } from '@/lib/data';

export default function Home() {
  const { user, role } = useAuth();
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>({ '2025-7': mockEmployees });
  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>({ '2025-7': initialMockEvaluations });
  const [gradingScale, setGradingScale] = React.useState(initialGradingScale);
  const [results, setResults] = React.useState<EvaluationResult[]>([]);
  const [selectedDate, setSelectedDate] = React.useState({ year: 2025, month: 7 });

  const dateKey = `${selectedDate.year}-${selectedDate.month}`;
  const currentMonthEmployees = employees[dateKey] || [];
  const currentMonthEvaluations = evaluations[dateKey] || [];

  const handleEmployeeUpload = (year: number, month: number, newEmployees: Employee[]) => {
    const key = `${year}-${month}`;
    setEmployees(prev => ({ ...prev, [key]: newEmployees }));
    // Also create blank evaluations for the new employees
    const newEvals = newEmployees.map(emp => ({
        id: `eval-${emp.id}-${year}-${month}`,
        employeeId: emp.id,
        year,
        month,
        grade: null,
        memo: ''
    }));
    setEvaluations(prev => ({...prev, [key]: newEvals}));
  };

  const handleResultsUpdate = (updatedResultsForMonth: EvaluationResult[]) => {
      const key = `${selectedDate.year}-${selectedDate.month}`;
      
      const updatedEmployees = currentMonthEmployees.map(emp => {
          const updatedResult = updatedResultsForMonth.find(r => r.id === emp.id);
          if (updatedResult) {
              return { ...emp, baseAmount: updatedResult.baseAmount };
          }
          return emp;
      });
      setEmployees(prev => ({...prev, [key]: updatedEmployees}));

      const updatedMonthEvaluations = updatedResultsForMonth
        .map(r => {
            const existingEval = currentMonthEvaluations.find(e => e.employeeId === r.id);
            return {
                id: existingEval?.id || `eval-${r.id}-${r.year}-${r.month}`,
                employeeId: r.id,
                year: r.year,
                month: r.month,
                grade: r.grade,
                memo: r.memo
            };
        });
      setEvaluations(prev => ({...prev, [key]: updatedMonthEvaluations}));
  };

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
        currentEvaluations: Evaluation[],
        currentGradingScale: Record<NonNullable<Grade>, GradeInfo>
    ): EvaluationResult[] => {
      if (!currentEmployees) return [];
      return currentEmployees.map(employee => {
        const evaluation = currentEvaluations.find(e => e.employeeId === employee.id);
        
        const grade = evaluation?.grade || null;
        
        const gradeInfo = grade ? currentGradingScale[grade] : null;
        const score = gradeInfo ? gradeInfo.score : 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        
        const gradeAmount = (employee.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
        const evaluator = mockUsers.find(u => u.id === employee.evaluatorId);

        const detailedGroup1 = getDetailedGroup1(employee.workRate);
        const detailedGroup2 = employee.title || employee.growthLevel;

        return {
          ...employee,
          year: selectedDate.year,
          month: selectedDate.month,
          grade,
          score,
          payoutRate,
          gradeAmount,
          finalAmount,
          evaluatorName: evaluator?.name || 'N/A',
          detailedGroup1,
          detailedGroup2,
          memo: evaluation?.memo || ''
        };
      });
    };
    
    setResults(getFullEvaluationResults(currentMonthEmployees, currentMonthEvaluations, gradingScale));
  }, [employees, evaluations, gradingScale, selectedDate, dateKey, currentMonthEmployees, currentMonthEvaluations]);

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard 
                  results={results}
                  onEmployeeUpload={handleEmployeeUpload}
                  gradingScale={gradingScale}
                  setGradingScale={setGradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  handleResultsUpdate={handleResultsUpdate}
                />;
      case 'evaluator':
        return <EvaluatorDashboard 
                  allResults={results}
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate} 
                  handleResultsUpdate={handleResultsUpdate}
                />;
      case 'employee':
        const allEmployeeEvals: Evaluation[] = Object.values(evaluations).flat();
        const allEmployeeData: Employee[] = Object.values(employees).flat();
        
        const allTimeResults = allEmployeeData.flatMap(employee => {
            return allEmployeeEvals
                .filter(ev => ev.employeeId === employee.id)
                .map(evaluation => {
                    const grade = evaluation?.grade || null;
                    const gradeInfo = grade ? gradingScale[grade] : null;
                    const score = gradeInfo ? gradeInfo.score : 0;
                    const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
                    const gradeAmount = (employee.baseAmount || 0) * payoutRate;
                    const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
                    const evaluator = mockUsers.find(u => u.id === employee.evaluatorId);
                    return {
                        ...employee,
                        year: evaluation.year,
                        month: evaluation.month,
                        grade,
                        score,
                        payoutRate,
                        gradeAmount,
                        finalAmount,
                        evaluatorName: evaluator?.name || 'N/A',
                        detailedGroup1: '', // Not needed for employee view
                        detailedGroup2: '', // Not needed for employee view
                    };
                });
        });

        return <EmployeeDashboard allResults={allTimeResults} />;
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
