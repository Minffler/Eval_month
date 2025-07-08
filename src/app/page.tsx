'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import type { Employee, Evaluation, EvaluationResult, Grade, GradeInfo, User } from '@/lib/types';
import { mockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockUsers, mockEvaluations } from '@/lib/data';

export default function Home() {
  const { user, role, setUser } = useAuth();
  
  const [employees, setEmployees] = React.useState<Employee[]>(mockEmployees);
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>(mockEvaluations);
  const [gradingScale, setGradingScale] = React.useState(initialGradingScale);
  const [results, setResults] = React.useState<EvaluationResult[]>([]);
  const [selectedDate, setSelectedDate] = React.useState({ year: 2025, month: 7 });

  const handleResultsUpdate = (updatedResultsForMonth: EvaluationResult[]) => {
      const updatedEmployees = employees.map(emp => {
          const updatedResult = updatedResultsForMonth.find(r => r.id === emp.id);
          if (updatedResult) {
              return { ...emp, baseAmount: updatedResult.baseAmount };
          }
          return emp;
      });
      setEmployees(updatedEmployees);

      const otherMonthEvaluations = evaluations.filter(ev => 
          !(ev.year === selectedDate.year && ev.month === selectedDate.month)
      );
      
      const updatedMonthEvaluations = updatedResultsForMonth
        .filter(r => r.grade) // Only save if grade is assigned
        .map(r => {
            const existingEval = evaluations.find(e => e.employeeId === r.id && e.year === r.year && e.month === r.month);
            return {
                id: existingEval?.id || `eval-${r.id}-${r.year}-${r.month}`,
                employeeId: r.id,
                year: r.year,
                month: r.month,
                grade: r.grade
            };
        });

      setEvaluations([...otherMonthEvaluations, ...updatedMonthEvaluations]);
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
      return currentEmployees.map(employee => {
        const evaluation = currentEvaluations.find(e => 
          e.employeeId === employee.id && 
          e.year === selectedDate.year && 
          e.month === selectedDate.month
        );
        
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
        };
      });
    };

    setResults(getFullEvaluationResults(employees, evaluations, gradingScale));
  }, [employees, evaluations, gradingScale, selectedDate]);

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard 
                  results={results}
                  setEmployees={setEmployees}
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
                />;
      case 'employee':
        // For employee, we pass all results, not just for the selected month
        const allTimeResults = employees.flatMap(employee => {
            return evaluations
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
                        detailedGroup1: getDetailedGroup1(employee.workRate),
                        detailedGroup2: employee.title || employee.growthLevel,
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
