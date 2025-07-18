'use client';

import * as React from 'react';
import type { User, Employee, Grade, Evaluation, GradeInfo, WorkRateInputs, AttendanceType, Holiday, EvaluationResult, EvaluationUploadData, ShortenedWorkType, ShortenedWorkHourRecord, DailyAttendanceRecord } from '@/lib/types';
import { mockEmployees as initialMockEmployees, gradingScale as initialGradingScale, mockEvaluations as initialMockEvaluations, initialAttendanceTypes, initialHolidays, calculateFinalAmount, getDetailedGroup1 } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';
import { calculateWorkRateDetails, type WorkRateDetailsResult } from '@/lib/work-rate-calculator';

/**
 * @fileoverview EvaluationContext는 평가와 관련된 모든 데이터와 로직을 관리합니다.
 * @description
 * 이 컨텍스트는 AuthContext에 의존하여 사용자 정보를 가져오고,
 * 직원, 평가, 근무율 등 평가에 필요한 모든 데이터를 종합하여 최종 결과를 계산하고 제공합니다.
 *
 * 제공하는 데이터:
 * - allEvaluationResults: 화면에 표시될 최종 평가 결과 (계산 완료된 상태)
 * - monthlyEvaluationTargets: 특정 월의 평가 대상자 목록을 반환하는 함수
 * - workRateDetails: 근무율 상세 계산 결과
 * - gradingScale, attendanceTypes, holidays 등 평가 기준 데이터
 *
 * 제공하는 함수:
 * - 데이터 업로드/초기화/수정 등 평가 데이터와 관련된 모든 setter 함수
 */

const getFromLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    localStorage.removeItem(key);
  }
  return defaultValue;
}

interface EvaluationContextType {
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  evaluations: Record<string, Evaluation[]>;
  setEvaluations: React.Dispatch<React.SetStateAction<Record<string, Evaluation[]>>>;
  workRateInputs: Record<string, WorkRateInputs>;
  setWorkRateInputs: React.Dispatch<React.SetStateAction<Record<string, WorkRateInputs>>>;
  attendanceTypes: AttendanceType[];
  setAttendanceTypes: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  evaluationStatus: Record<string, 'open' | 'closed'>;
  setEvaluationStatus: React.Dispatch<React.SetStateAction<Record<string, 'open' | 'closed'>>>;
  
  handleEmployeeUpload: (year: number, month: number, data: Employee[]) => void;
  handleEvaluationUpload: (year: number, month: number, data: EvaluationUploadData[]) => void;
  handleClearEmployeeData: (year: number, month: number) => void;
  handleClearEvaluationData: (year: number, month: number) => void;
  handleClearWorkRateData: (year: number, month: number, type: keyof WorkRateInputs | ShortenedWorkType) => void;
  handleWorkRateDataUpload: (year: number, month: number, type: keyof WorkRateInputs, data: any[], isApproved: boolean) => void;
  handleClearMyEvaluations: (year: number, month: number, evaluatorId: string) => void;

  allEvaluationResults: EvaluationResult[];
  monthlyEvaluationTargets: (selectedDate: {year: number, month: number}) => EvaluationResult[];
  workRateDetails: WorkRateDetailsResult;
}

const EvaluationContext = React.createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children }: { children: React.ReactNode }) {
  const { allUsers, addUser, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>(() => getFromLocalStorage('employees', initialMockEmployees ));
  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>(() => getFromLocalStorage('evaluations', initialMockEvaluations ));
  const [gradingScale, setGradingScale] = React.useState<Record<NonNullable<Grade>, GradeInfo>>(() => getFromLocalStorage('gradingScale', initialGradingScale));
  const [workRateInputs, setWorkRateInputs] = React.useState<Record<string, WorkRateInputs>>(() => getFromLocalStorage('workRateInputs', {}));
  const [attendanceTypes, setAttendanceTypes] = React.useState<AttendanceType[]>(() => getFromLocalStorage('attendanceTypes', initialAttendanceTypes));
  const [holidays, setHolidays] = React.useState<Holiday[]>(() => getFromLocalStorage('holidays', initialHolidays));
  const [evaluationStatus, setEvaluationStatus] = React.useState<Record<string, 'open' | 'closed'>>(() => getFromLocalStorage('evaluationStatus', {}));

  React.useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  React.useEffect(() => { localStorage.setItem('evaluations', JSON.stringify(evaluations)); }, [evaluations]);
  React.useEffect(() => { localStorage.setItem('gradingScale', JSON.stringify(gradingScale)); }, [gradingScale]);
  React.useEffect(() => { localStorage.setItem('workRateInputs', JSON.stringify(workRateInputs)); }, [workRateInputs]);
  React.useEffect(() => { localStorage.setItem('attendanceTypes', JSON.stringify(attendanceTypes)); }, [attendanceTypes]);
  React.useEffect(() => { localStorage.setItem('holidays', JSON.stringify(holidays)); }, [holidays]);
  React.useEffect(() => { localStorage.setItem('evaluationStatus', JSON.stringify(evaluationStatus)); }, [evaluationStatus]);
  
  const handleEmployeeUpload = (year: number, month: number, newEmployees: Employee[]) => {
    const key = `${year}-${month}`;

    newEmployees.forEach(emp => {
      const existingUser = allUsers.find(u => u.uniqueId === emp.uniqueId);
      const employeeDataForUser: Partial<User> = { name: emp.name, department: emp.department, title: emp.title, company: emp.company };
      
      if (emp.evaluatorId) {
        employeeDataForUser.evaluatorId = emp.evaluatorId;
      }
      
      if (!existingUser) {
        addUser({ ...emp, company: emp.company || 'N/A', position: emp.position || emp.title || '팀원', }, ['employee']);
      } else {
        updateUser(existingUser.id, employeeDataForUser);
      }
    });

    setEmployees(prev => ({...prev, [key]: newEmployees}));

    setEvaluations(prev => {
        const currentEvalsForMonth = prev[key] || [];
        const finalEvals = newEmployees.map(emp => {
            const existingEval = currentEvalsForMonth.find(e => e.employeeId === emp.id);
            return {
              id: existingEval?.id || `eval-${emp.id}-${year}-${month}`,
              employeeId: emp.id, year, month,
              grade: existingEval?.grade || null,
              memo: existingEval?.memo || emp.memo || '',
            };
        });
        return {...prev, [key]: finalEvals};
    });
  };

  const handleEvaluationUpload = (year: number, month: number, uploadedData: EvaluationUploadData[]) => {
      const key = `${year}-${month}`;
      const usersToUpdate: Record<string, Partial<User>> = {};
      
      const processUserUpdate = (item: EvaluationUploadData) => {
          if (!item.uniqueId) return;

          const userData: Partial<User> = { name: item.name, department: item.department, title: item.title, company: item.company };
          if(item.evaluatorId) userData.evaluatorId = item.evaluatorId;

          const existingUser = allUsers.find(u => u.uniqueId === item.uniqueId);
          if(existingUser) {
              if (!usersToUpdate[existingUser.id]) usersToUpdate[existingUser.id] = {};
              Object.assign(usersToUpdate[existingUser.id], userData);
          } else {
              addUser({ uniqueId: item.uniqueId, ...userData }, ['employee']);
          }
      };

      uploadedData.forEach(processUserUpdate);

      for(const userId in usersToUpdate) {
          updateUser(userId, usersToUpdate[userId]);
      }
        
      setEmployees(prevEmps => {
          const newState = { ...prevEmps };
          const newEmpsForMonth = newState[key] ? [...newState[key]] : [];
          
          uploadedData.forEach(uploadItem => {
              if (!uploadItem.uniqueId) return;
              const empIndex = newEmpsForMonth.findIndex((e: Employee) => e.uniqueId === uploadItem.uniqueId);
              const { grade, memo, ...empDetails } = uploadItem;
              const dataToUpdate = { ...empDetails, id: `E${uploadItem.uniqueId}` };

              if (empIndex > -1) {
                  Object.assign(newEmpsForMonth[empIndex], dataToUpdate);
              } else {
                  newEmpsForMonth.push(dataToUpdate as Employee);
              }
          });
          newState[key] = newEmpsForMonth;
          return newState;
      });

      setEvaluations(prevEvals => {
          const newState = { ...prevEvals };
          const newEvalsForMonth = newState[key] ? [...newState[key]] : [];
          
          uploadedData.forEach(uploadItem => {
              if (!uploadItem.uniqueId) return;
              const employeeId = `E${uploadItem.uniqueId}`;
              const evalIndex = newEvalsForMonth.findIndex((e: Evaluation) => e.employeeId === employeeId);
              const evalData = { grade: uploadItem.grade || null, memo: uploadItem.memo || '', };
              if (evalIndex > -1) {
                  Object.assign(newEvalsForMonth[evalIndex], evalData);
              } else {
                  newEvalsForMonth.push({ id: `eval-${employeeId}-${year}-${month}`, employeeId, year, month, ...evalData });
              }
          });
          newState[key] = newEvalsForMonth;
          return newState;
      });
  };

  const handleClearEmployeeData = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setEmployees(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
    setEvaluations(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
  };

  const handleClearEvaluationData = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setEvaluations(prev => {
        const currentEvalsForMonth = prev[key] || [];
        const resetEvals = currentEvalsForMonth.map(ev => ({ ...ev, grade: null, memo: '', }));
        return {...prev, [key]: resetEvals };
    });
  };

  const handleWorkRateDataUpload = (year: number, month: number, type: keyof WorkRateInputs, newData: any[], isApproved: boolean) => {
      if (!isApproved) return;
      const key = `${year}-${month}`;
      setWorkRateInputs(prev => {
          const currentMonthInputs = prev[key] || { shortenedWorkHours: [], dailyAttendance: [], };
  
          let combinedData;
          if (type === 'shortenedWorkHours') {
              const existingKeys = new Set(currentMonthInputs.shortenedWorkHours.map((r: ShortenedWorkHourRecord) => `${r.uniqueId}|${r.startDate}|${r.endDate}`));
              const uniqueNewData = (newData as ShortenedWorkHourRecord[]).filter(r => !existingKeys.has(`${r.uniqueId}|${r.startDate}|${r.endDate}`));
              combinedData = [...currentMonthInputs.shortenedWorkHours, ...uniqueNewData];
          } else {
              const existingKeys = new Set(currentMonthInputs.dailyAttendance.map((r: DailyAttendanceRecord) => `${r.uniqueId}|${r.date}`));
              const uniqueNewData = (newData as DailyAttendanceRecord[]).filter(r => !existingKeys.has(`${r.uniqueId}|${r.date}`));
              combinedData = [...currentMonthInputs.dailyAttendance, ...uniqueNewData];
          }
  
          return { ...prev, [key]: { ...currentMonthInputs, [type]: combinedData, } };
      });
  
      if (type === 'dailyAttendance') {
          setAttendanceTypes(prevTypes => {
              const existingTypeNames = new Set(prevTypes.map(t => t.name));
              const newTypesFromData = new Set((newData as DailyAttendanceRecord[]).map(d => d.type).filter(t => !existingTypeNames.has(t)));
              if (newTypesFromData.size === 0) return prevTypes;
              
              const newTypesToAdd: AttendanceType[] = Array.from(newTypesFromData).map(typeName => ({
                  id: `att-${Date.now()}-${Math.random()}`, name: typeName as string, deductionDays: 0,
              }));
  
              return [...prevTypes, ...newTypesToAdd];
          });
      }
  };

  const handleClearWorkRateData = (year: number, month: number, type: keyof WorkRateInputs | ShortenedWorkType) => {
    const key = `${year}-${month}`;
    setWorkRateInputs(prev => {
        const currentMonthInputs = prev[key];
        if (!currentMonthInputs) return prev;
        const updatedMonthInputs = { ...currentMonthInputs };

        if (type === '임신' || type === '육아/돌봄') {
            updatedMonthInputs.shortenedWorkHours = (currentMonthInputs.shortenedWorkHours || []).filter(d => d.type !== type);
        } else if (type === 'dailyAttendance') {
            updatedMonthInputs.dailyAttendance = [];
        } else if (type === 'shortenedWorkHours') {
            updatedMonthInputs.shortenedWorkHours = [];
        }
        
        if (updatedMonthInputs.shortenedWorkHours.length === 0 && updatedMonthInputs.dailyAttendance.length === 0) {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        }

        return { ...prev, [key]: updatedMonthInputs };
    });
  };

  const handleClearMyEvaluations = (year: number, month: number, evaluatorId: string) => {
    const key = `${year}-${month}`;
    if (!evaluatorId) return;

    const myEmployeeUniqueIds = new Set(allUsers.filter(u => u.evaluatorId === evaluatorId).map(u => u.uniqueId));

    setEvaluations(prev => {
        const updatedEvalsForMonth = (prev[key] || []).map(ev => {
            const empUniqueId = ev.employeeId.replace('E', '');
            if (myEmployeeUniqueIds.has(empUniqueId)) return { ...ev, grade: null, memo: '' };
            return ev;
        });
        return { ...prev, [key]: updatedEvalsForMonth };
    });
  };
  
  const allEvaluationResults = React.useMemo(() => {
    const uniqueUserMap = new Map(allUsers.map(u => [u.uniqueId, u]));
    
    return Object.entries(employees).flatMap(([key, monthlyEmployees]) => {
        const [year, month] = key.split('-').map(Number);
        const monthlyEvaluations = evaluations[key] || [];

        return monthlyEmployees.map(employee => {
            const userForEmployee = uniqueUserMap.get(employee.uniqueId) || {};
            const evaluation = monthlyEvaluations.find(e => e.employeeId === employee.id);
            const base: Employee = { ...employee, ...userForEmployee };
            
            const grade = evaluation?.grade || null;
            const gradeInfo = grade ? gradingScale[grade] : null;
            const score = gradeInfo?.score || 0;
            const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
            const gradeAmount = (base.baseAmount || 0) * payoutRate;
            const finalAmount = calculateFinalAmount(gradeAmount, base.workRate);
            
            const evaluator = uniqueUserMap.get(base.evaluatorId || '');
            
            const getEvaluationGroup = (workRate: number): string => {
                if (workRate >= 0.7) return 'A. 정규평가';
                if (workRate >= 0.25) return 'B. 별도평가';
                return 'C. 미평가';
            };

            const getDetailedGroup2 = (employee: Employee): string => {
                const { position, growthLevel } = employee;
                if (position === '팀장' || position === '지점장') return '팀장/지점장';
                if (position === '지부장' || position === '센터장') return '지부장/센터장';
                if (growthLevel === 'Lv.1') return 'Lv.1';
                if (growthLevel === 'Lv.2' || growthLevel === 'Lv.3') return 'Lv.2~3';
                return '기타';
            }
            
            return {
                ...base, year, month, grade, score, payoutRate, gradeAmount, finalAmount,
                evaluatorName: evaluator?.name || (base.evaluatorId ? `미지정 (${base.evaluatorId})` : '미지정'),
                evaluationGroup: getEvaluationGroup(base.workRate),
                detailedGroup1: getDetailedGroup1(base.workRate),
                detailedGroup2: getDetailedGroup2(base),
                memo: evaluation?.memo || base.memo || ''
            };
        });
    });
  }, [employees, evaluations, gradingScale, allUsers]);

  const getMonthlyEvaluationTargets = React.useCallback((selectedDate: {year: number, month: number}) => {
    const monthKey = `${selectedDate.year}-${selectedDate.month}`;
    const monthlyEmployeeList = employees[monthKey] || [];
    
    const monthlyEmployeeIds = new Set(monthlyEmployeeList.map(e => e.uniqueId));
    return allEvaluationResults.filter(r => r.year === selectedDate.year && r.month === selectedDate.month && monthlyEmployeeIds.has(r.uniqueId));
  }, [allEvaluationResults, employees]);

  const workRateDetails = React.useMemo(() => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return calculateWorkRateDetails(
          workRateInputs,
          attendanceTypes,
          holidays,
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1
      );
  }, [workRateInputs, attendanceTypes, holidays]);


  const value = {
    gradingScale, setGradingScale,
    evaluations, setEvaluations,
    workRateInputs, setWorkRateInputs,
    attendanceTypes, setAttendanceTypes,
    holidays, setHolidays,
    evaluationStatus, setEvaluationStatus,
    handleEmployeeUpload, handleEvaluationUpload, handleClearEmployeeData,
    handleClearEvaluationData, handleClearWorkRateData, handleWorkRateDataUpload,
    handleClearMyEvaluations,
    allEvaluationResults, monthlyEvaluationTargets: getMonthlyEvaluationTargets, workRateDetails
  };

  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>;
}

export function useEvaluation() {
  const context = React.useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error('useEvaluation must be used within a EvaluationProvider');
  }
  return context;
}
