'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import type { Employee, Evaluation, EvaluationResult, Grade, GradeInfo, User } from '@/lib/types';
import { mockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockUsers, mockEvaluations as initialMockEvaluations } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>({ '2025-7': mockEmployees });
  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>({ '2025-7': initialMockEvaluations });
  const [gradingScale, setGradingScale] = React.useState(initialGradingScale);
  const [results, setResults] = React.useState<EvaluationResult[]>([]);
  const [selectedDate, setSelectedDate] = React.useState({ year: 2025, month: 7 });

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const dateKey = `${selectedDate.year}-${selectedDate.month}`;
  const currentMonthEmployees = employees[dateKey] || [];
  const currentMonthEvaluations = evaluations[dateKey] || [];

  const handleEmployeeUpload = (year: number, month: number, newEmployees: Employee[]) => {
    const key = `${year}-${month}`;
    setEmployees(prev => ({ ...prev, [key]: newEmployees }));
    
    const newEvals = newEmployees.map(emp => ({
        id: `eval-${emp.id}-${year}-${month}`,
        employeeId: emp.id,
        year,
        month,
        grade: null,
        memo: ''
    }));
    
    setEvaluations(prev => {
        const existingEvals = prev[key] || [];
        const existingEmpIds = new Set(existingEvals.map(e => e.employeeId));
        const finalEvals = [...existingEvals];
        newEvals.forEach(newEval => {
            if (!existingEmpIds.has(newEval.employeeId)) {
                finalEvals.push(newEval);
            }
        });
        return {...prev, [key]: finalEvals};
    });
  };

  const handleEvaluationUpload = (year: number, month: number, uploadedEvals: (Pick<Evaluation, 'employeeId' | 'grade' | 'memo'> & { baseAmount?: number })[]) => {
      const key = `${year}-${month}`;
      
      setEvaluations(prev => {
          const newEvalsForMonth = [...(prev[key] || [])];
          uploadedEvals.forEach(uploadedEval => {
              const evalIndex = newEvalsForMonth.findIndex(e => e.employeeId === uploadedEval.employeeId);
              if (evalIndex > -1) {
                  newEvalsForMonth[evalIndex] = {
                      ...newEvalsForMonth[evalIndex],
                      grade: uploadedEval.grade,
                      memo: uploadedEval.memo,
                  };
              }
          });
          return {...prev, [key]: newEvalsForMonth};
      });

      setEmployees(prev => {
        const newEmpsForMonth = [...(prev[key] || [])];
        uploadedEvals.forEach(uploadedData => {
            if (uploadedData.baseAmount !== undefined && !isNaN(uploadedData.baseAmount)) {
                const empIndex = newEmpsForMonth.findIndex(e => e.id === uploadedData.employeeId);
                if (empIndex > -1) {
                    newEmpsForMonth[empIndex] = {
                        ...newEmpsForMonth[empIndex],
                        baseAmount: uploadedData.baseAmount,
                    };
                }
            }
        });
        return {...prev, [key]: newEmpsForMonth};
      });
  };

  const handleResultsUpdate = (updatedResultsForMonth: EvaluationResult[]) => {
      const key = `${selectedDate.year}-${selectedDate.month}`;

      // Rebuild employees array from the comprehensive results
      const updatedEmployees = updatedResultsForMonth.map(r => {
          const employee: Employee = {
            id: r.id,
            uniqueId: r.uniqueId,
            name: r.name,
            company: r.company,
            department: r.department,
            title: r.title,
            position: r.position,
            growthLevel: r.growthLevel,
            workRate: r.workRate,
            evaluatorId: r.evaluatorId,
            baseAmount: r.baseAmount,
            group: r.detailedGroup2, // Use detailedGroup2 as the new group
          };
          return employee;
      });
      setEmployees(prev => ({...prev, [key]: updatedEmployees}));

      // Rebuild evaluations array, preserving existing IDs
      const updatedMonthEvaluations = updatedResultsForMonth.map(r => {
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

    const getDetailedGroup2 = (employee: Employee): string => {
        return employee.group || '기타';
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
        const detailedGroup2 = getDetailedGroup2(employee);

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
                  onEvaluationUpload={handleEvaluationUpload}
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
                        detailedGroup1: '',
                        detailedGroup2: '',
                    };
                });
        });

        return <EmployeeDashboard allResults={allTimeResults} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">로딩중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
