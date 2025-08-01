'use client';

import * as React from 'react';
import type { User, Employee, Grade, Evaluation, GradeInfo, WorkRateInputs, AttendanceType, Holiday, EvaluationResult, EvaluationUploadData, ShortenedWorkType, ShortenedWorkHourRecord, DailyAttendanceRecord, Role, Approval } from '@/lib/types';
import { mockEmployees, defaultGradingScale as initialGradingScale, mockEvaluations, calculateFinalAmount, getDetailedGroup1 } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';
import { log } from '@/lib/logger';
import { applyApprovedWorkData, isApprovalAlreadyApplied } from '@/lib/approval-utils';

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

// 근무기준 목업 데이터
const MOCK_ATTENDANCE_TYPES = [
  { id: '1', name: '가족돌봄휴가', deductionDays: 1 },
  { id: '2', name: '결근', deductionDays: 1 },
  { id: '3', name: '공가', deductionDays: 1 },
  { id: '4', name: '연차(1년미만)', deductionDays: 1 },
  { id: '5', name: '연차휴가', deductionDays: 1 },
  { id: '6', name: '육아휴직', deductionDays: 1 },
  { id: '7', name: '반반차(오후)', deductionDays: 0.5 },
  { id: '8', name: '반차(오전)', deductionDays: 0.5 },
  { id: '9', name: '반차(오전)(1년미만)', deductionDays: 0.5 },
  { id: '10', name: '반차(오후)', deductionDays: 0.5 },
  { id: '11', name: '반차(오후)(1년미만)', deductionDays: 0.5 },
  { id: '12', name: '반반차(오전)', deductionDays: 0.25 },
  { id: '13', name: '반반차(오후)(1년미만)', deductionDays: 0.25 },
  { id: '14', name: '대체휴무(종일)', deductionDays: 0 },
  { id: '15', name: '외부교육', deductionDays: 0 },
];

// 공휴일 목업 데이터
const MOCK_HOLIDAYS = [
  { id: 'h1', date: '2025-01-01', name: '신정', type: '공휴일' as const },
  { id: 'h2', date: '2025-06-03', name: '대통령선거', type: '공휴일' as const },
  { id: 'h3', date: '2025-06-06', name: '현충일', type: '공휴일' as const },
];

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
  
  // 결재 반영 기능
  handleApplyApproval: (approval: Approval) => void;
  
  // 새로운 저장 액션들
  updateEvaluationMemo: (employeeId: string, memo: string, year: number, month: number) => void;
  updateEvaluationGroup: (employeeId: string, groupName: string, year: number, month: number) => void;
  updateEvaluationGrade: (employeeId: string, grade: Grade | null, year: number, month: number) => void;

  allEvaluationResults: EvaluationResult[];
  monthlyEvaluationTargets: (selectedDate: {year: number, month: number}) => EvaluationResult[];
  monthlyEvaluationTargetsByEvaluator: (selectedDate: {year: number, month: number}, evaluatorId: string) => EvaluationResult[];
}

const EvaluationContext = React.createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children }: { children: React.ReactNode }) {
  const { userMap, upsertUsers } = useAuth();
  const { toast } = useToast();
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>(() => getFromLocalStorage('employees', mockEmployees ));
  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>(() => getFromLocalStorage('evaluations', mockEvaluations ));
  // 등급 정보는 거의 안 바뀌므로 캐싱
  const [gradingScale, setGradingScale] = React.useState<Record<NonNullable<Grade>, GradeInfo>>(() => {
    const cached = getFromLocalStorage('gradingScale', initialGradingScale);
    log.debug('Grading scale loaded:', Object.keys(cached));
    return cached;
  });
  

  const [workRateInputs, setWorkRateInputs] = React.useState<Record<string, WorkRateInputs>>(() => getFromLocalStorage('workRateInputs', {}));
  const [attendanceTypes, setAttendanceTypes] = React.useState<AttendanceType[]>(() => MOCK_ATTENDANCE_TYPES);
  const [holidays, setHolidays] = React.useState<Holiday[]>(() => MOCK_HOLIDAYS);
  const [evaluationStatus, setEvaluationStatus] = React.useState<Record<string, 'open' | 'closed'>>(() => getFromLocalStorage('evaluationStatus', {}));

  useDebouncedEffect(() => localStorage.setItem('employees', JSON.stringify(employees)), [employees], 500);
  useDebouncedEffect(() => localStorage.setItem('evaluations', JSON.stringify(evaluations)), [evaluations], 500);
  useDebouncedEffect(() => localStorage.setItem('gradingScale', JSON.stringify(gradingScale)), [gradingScale], 500);
  useDebouncedEffect(() => localStorage.setItem('workRateInputs', JSON.stringify(workRateInputs)), [workRateInputs], 500);
  useDebouncedEffect(() => localStorage.setItem('attendanceTypes', JSON.stringify(attendanceTypes)), [attendanceTypes], 500);
  useDebouncedEffect(() => localStorage.setItem('holidays', JSON.stringify(holidays)), [holidays], 500);
  useDebouncedEffect(() => localStorage.setItem('evaluationStatus', JSON.stringify(evaluationStatus)), [evaluationStatus], 500);

  // 결재 승인 시 근무 데이터 업데이트 이벤트 리스너
  React.useEffect(() => {
    const handleWorkRateDataUpdate = (event: CustomEvent) => {
      const { approval, dataType, action, data } = event.detail;
      
      console.log('근무 데이터 업데이트 이벤트 수신:', { dataType, action, data });
      
      // 상태 업데이트를 다음 마이크로태스크로 지연시켜 렌더링 규칙 준수
      queueMicrotask(() => {
        // 현재 날짜 정보 추출 (approval.date에서)
        const approvalDate = new Date(approval.date);
        const year = approvalDate.getFullYear();
        const month = approvalDate.getMonth() + 1;
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        
        setWorkRateInputs(prev => {
          const updated = { ...prev };
          
          if (dataType === 'shortenedWorkHours') {
            // 단축근로 데이터 업데이트
            if (!updated[key]) {
              updated[key] = { shortenedWorkHours: [], dailyAttendance: [] };
            }
            
            if (action === 'add') {
              // 새로운 단축근로 데이터 추가
              const newRecord: ShortenedWorkHourRecord = {
                uniqueId: data.uniqueId,
                name: data.name,
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate,
                startTime: data.startTime,
                endTime: data.endTime,
                lastModified: new Date().toISOString()
              };
              
              updated[key].shortenedWorkHours.push(newRecord);
              console.log('단축근로 데이터 추가됨:', newRecord);
            } else if (action === 'edit') {
              // 기존 단축근로 데이터 수정
              const existingIndex = updated[key].shortenedWorkHours.findIndex(
                (record: ShortenedWorkHourRecord) => record.uniqueId === data.uniqueId && record.startDate === data.startDate
              );
              
              if (existingIndex !== -1) {
                updated[key].shortenedWorkHours[existingIndex] = {
                  ...updated[key].shortenedWorkHours[existingIndex],
                  ...data,
                  lastModified: new Date().toISOString()
                };
                console.log('단축근로 데이터 수정됨:', data);
              }
            }
          } else if (dataType === 'dailyAttendance') {
            // 일근태 데이터 업데이트
            if (!updated[key]) {
              updated[key] = { shortenedWorkHours: [], dailyAttendance: [] };
            }
            
            if (action === 'add') {
              // 새로운 일근태 데이터 추가
              const newRecord: DailyAttendanceRecord = {
                uniqueId: data.uniqueId,
                name: data.name,
                date: data.date,
                type: data.type,
                lastModified: new Date().toISOString()
              };
              
              updated[key].dailyAttendance.push(newRecord);
              console.log('일근태 데이터 추가됨:', newRecord);
            } else if (action === 'edit') {
              // 기존 일근태 데이터 수정
              const existingIndex = updated[key].dailyAttendance.findIndex(
                (record: DailyAttendanceRecord) => record.uniqueId === data.uniqueId && record.date === data.date
              );
              
              if (existingIndex !== -1) {
                updated[key].dailyAttendance[existingIndex] = {
                  ...updated[key].dailyAttendance[existingIndex],
                  ...data,
                  lastModified: new Date().toISOString()
                };
                console.log('일근태 데이터 수정됨:', data);
              }
            }
          }
          
          console.log('업데이트된 workRateInputs:', updated);
          return updated;
        });
      });
    };

    window.addEventListener('workRateDataUpdate', handleWorkRateDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('workRateDataUpdate', handleWorkRateDataUpdate as EventListener);
    };
  }, [setWorkRateInputs]);
  
  const handleEmployeeUpload = (year: number, month: number, newEmployees: Employee[]) => {
    const key = `${year}-${month}`;
    
    console.log('=== handleEmployeeUpload 호출됨 ===');
    console.log('year:', year, 'month:', month);
    console.log('newEmployees:', newEmployees);
    console.log('key:', key);

    const usersToUpsert = newEmployees.map(emp => ({
        uniqueId: emp.uniqueId,
        name: emp.name,
        department: emp.department,
        title: emp.title,
        company: emp.company,
        evaluatorId: emp.evaluatorId,
        roles: ['employee'] as Role[]
    }));

    newEmployees.forEach(emp => {
      if (emp.evaluatorId) {
        const evaluatorInList = usersToUpsert.find(u => u.uniqueId === emp.evaluatorId);
        if (!evaluatorInList) {
          // 기존 사용자 정보에서 평가자 이름을 찾아서 우선 사용
          const existingUser = userMap.get(emp.evaluatorId);
          const evaluatorName = existingUser?.name || `평가자(${emp.evaluatorId})`;
          
          usersToUpsert.push({ 
            uniqueId: emp.evaluatorId, 
            name: evaluatorName, 
            roles: ['evaluator'], 
            department: existingUser?.department || 'N/A', 
            title: existingUser?.title || '평가자', 
            company: existingUser?.company || 'N/A', 
            evaluatorId: '' 
          });
        }
      }
    });

    upsertUsers(usersToUpsert);

    console.log('=== employees 상태 업데이트 전 ===');
    console.log('현재 employees 상태:', employees);
    
    setEmployees(prev => {
      // 중복 제거: uniqueId를 기준으로 중복된 직원 제거
      const uniqueEmployees = newEmployees.filter((employee, index, self) => 
        index === self.findIndex(e => e.uniqueId === employee.uniqueId)
      );
      
      console.log('=== 중복 제거 전/후 ===');
      console.log('원본 newEmployees 길이:', newEmployees.length);
      console.log('중복 제거 후 uniqueEmployees 길이:', uniqueEmployees.length);
      
      // 기존 데이터를 완전히 교체 (덮어쓰기)
      const newState = {...prev, [key]: uniqueEmployees};
      console.log('=== employees 상태 업데이트 후 ===');
      console.log('기존 데이터 완전 교체됨');
      console.log('새로운 employees 상태:', newState);
      return newState;
    });

    setEvaluations(prev => {
        const currentEvalsForMonth = prev[key] || [];
        const finalEvals = newEmployees.map(emp => {
            const existingEval = currentEvalsForMonth.find(e => e.employeeId === emp.uniqueId);
            return {
              id: existingEval?.id || `eval-${emp.uniqueId}-${year}-${month}`,
              employeeId: emp.uniqueId, year, month,
              grade: existingEval?.grade || null,
              memo: existingEval?.memo || emp.memo || '',
            };
        });
        return {...prev, [key]: finalEvals};
    });
    
    console.log('=== handleEmployeeUpload 완료 ===');
  };

  const handleEvaluationUpload = (year: number, month: number, uploadedData: EvaluationUploadData[]) => {
      const key = `${year}-${month}`;
      
      const usersToUpsert: Partial<User>[] = [];
      const employeeData: Employee[] = [];
      const evaluationData: Evaluation[] = [];

      uploadedData.forEach(item => {
        const uniqueId = String(item.uniqueId || '');
        if (!uniqueId) return;

        // Add employee to users list
        usersToUpsert.push({
          uniqueId: uniqueId,
          name: item.name,
          department: item.department,
          title: item.title,
          company: item.company,
          evaluatorId: item.evaluatorId, // This will just update the field, not create a user from it
          roles: ['employee'],
        });
        
        // Add evaluator to users list if they exist in the upload
        const evaluatorId = String(item.evaluatorId || '');
        if (evaluatorId && !usersToUpsert.some(u => u.uniqueId === evaluatorId)) {
          // 기존 사용자 정보에서 평가자 이름을 찾아서 우선 사용
          const existingUser = userMap.get(evaluatorId);
          const evaluatorName = existingUser?.name || item.evaluatorName || `평가자(${evaluatorId})`;
          
          usersToUpsert.push({
            uniqueId: evaluatorId,
            name: evaluatorName,
            roles: ['evaluator'],
          });
        }
        
        const employeeId = uniqueId;
        employeeData.push({
            uniqueId: uniqueId,
            name: item.name || '',
            company: item.company || 'N/A',
            department: item.department || 'N/A',
            title: item.title || '팀원',
            position: item.title || '팀원',
            growthLevel: item.growthLevel || '',
            workRate: 1, // 엑셀 업로드한 근무율 무시하고 기본값 1로 설정
            evaluatorId: evaluatorId,
            baseAmount: item.baseAmount ?? 0,
        });
        
        evaluationData.push({
            id: `eval-${employeeId}-${year}-${month}`,
            employeeId,
            year,
            month,
            grade: item.grade || null,
            memo: item.memo || '',
        });
      });
      
      upsertUsers(usersToUpsert);
      setEmployees(prev => ({...prev, [key]: employeeData}));
      setEvaluations(prev => ({...prev, [key]: evaluationData}));
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
          const currentMonthInputs = prev[key] || { shortenedWorkHours: [], dailyAttendance: [] };
  
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

    const myEmployeeUniqueIds = new Set(Array.from(userMap.values()).filter(u => u.evaluatorId === evaluatorId).map(u => u.uniqueId));

    setEvaluations(prev => {
        const updatedEvalsForMonth = (prev[key] || []).map(ev => {
            const empUniqueId = ev.employeeId.replace('E', '');
            if (myEmployeeUniqueIds.has(empUniqueId)) return { ...ev, grade: null, memo: '' };
            return ev;
        });
        return { ...prev, [key]: updatedEvalsForMonth };
    });
  };

  // 결재 반영 기능
  const handleApplyApproval = React.useCallback((approval: Approval) => {
    console.log('결재 반영 시작:', approval);
    
    try {
      // 결재 날짜에서 년/월 추출
      const approvalDate = new Date(approval.date);
      const year = approvalDate.getFullYear();
      const month = approvalDate.getMonth() + 1;
      
      console.log('결재 날짜 정보:', { year, month, approvalDate });
      
      // 이미 반영되었는지 확인
      const isAlreadyApplied = isApprovalAlreadyApplied(approval, workRateInputs, year, month);
      console.log('이미 반영되었는지 확인:', isAlreadyApplied);
      
      if (isAlreadyApplied) {
        toast({
          title: '이미 반영됨',
          description: '이 결재는 이미 반영되었습니다.',
        });
        return;
      }
      
      console.log('근무 데이터 반영 시작');
      
      // 근무 데이터에 반영
      const updatedWorkRateInputs = applyApprovedWorkData(approval, workRateInputs, year, month);
      console.log('업데이트된 workRateInputs:', updatedWorkRateInputs);
      
      setWorkRateInputs(updatedWorkRateInputs);
      
      toast({
        title: '반영 완료',
        description: '결재 내용이 성공적으로 반영되었습니다.',
      });
      
      console.log('결재 반영 완료:', approval.id);
    } catch (error) {
      console.error('결재 반영 중 오류:', error);
      toast({
        variant: 'destructive',
        title: '반영 실패',
        description: '결재 내용 반영 중 오류가 발생했습니다.',
      });
    }
  }, [workRateInputs, setWorkRateInputs, toast]);

  // 새로운 저장 액션들
  const updateEvaluationMemo = React.useCallback((employeeId: string, memo: string, year: number, month: number) => {
    
    const key = `${year}-${month}`;
    setEvaluations(prev => {
      const currentEvalsForMonth = prev[key] || [];
      
      // 해당 직원의 기존 평가 데이터 찾기
      let existingEvaluation = currentEvalsForMonth.find(evaluation => evaluation.employeeId === employeeId);
      
      let updatedEvals;
      if (existingEvaluation) {
        // 기존 데이터가 있으면 업데이트
        updatedEvals = currentEvalsForMonth.map(evaluation => 
          evaluation.employeeId === employeeId ? { ...evaluation, memo } : evaluation
        );
      } else {
        // 기존 데이터가 없으면 새로 생성
        const newEvaluation = {
          id: `eval-${employeeId}-${year}-${month}`,
          employeeId: employeeId,
          year: year,
          month: month,
          grade: null,
          memo: memo,
          detailedGroup2: '',
        };
        updatedEvals = [...currentEvalsForMonth, newEvaluation];
      }
      

      
      const newEvaluations = { ...prev, [key]: updatedEvals };
      
      // localStorage에 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('evaluations', JSON.stringify(newEvaluations));
      }
      
      return newEvaluations;
    });
  }, []);

  const updateEvaluationGroup = React.useCallback((employeeId: string, groupName: string, year: number, month: number) => {
    const key = `${year}-${month}`;
    setEvaluations(prev => {
      const currentEvalsForMonth = prev[key] || [];
      
      // 해당 직원의 기존 평가 데이터 찾기
      let existingEvaluation = currentEvalsForMonth.find(evaluation => evaluation.employeeId === employeeId);
      
      let updatedEvals;
      if (existingEvaluation) {
        // 기존 데이터가 있으면 업데이트
        updatedEvals = currentEvalsForMonth.map(evaluation => 
          evaluation.employeeId === employeeId ? { ...evaluation, detailedGroup2: groupName } : evaluation
        );
      } else {
        // 기존 데이터가 없으면 새로 생성
        const newEvaluation = {
          id: `eval-${employeeId}-${year}-${month}`,
          employeeId: employeeId,
          year: year,
          month: month,
          grade: null,
          memo: '',
          detailedGroup2: groupName,
        };
        updatedEvals = [...currentEvalsForMonth, newEvaluation];
      }
      

      
      const newEvaluations = { ...prev, [key]: updatedEvals };
      
      // localStorage에 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('evaluations', JSON.stringify(newEvaluations));
      }
      
      return newEvaluations;
    });
  }, []);

  const updateEvaluationGrade = React.useCallback((employeeId: string, grade: Grade | null, year: number, month: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== Context: updateEvaluationGrade 시작 ===');
      console.debug('매개변수:', { employeeId, grade, year, month });
    }
    
    const key = `${year}-${month}`;
    setEvaluations(prev => {
      const currentEvalsForMonth = prev[key] || [];
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('현재 평가 데이터:', currentEvalsForMonth);
        console.debug('찾으려는 employeeId:', employeeId);
        console.debug('기존 평가 데이터의 employeeId들:', currentEvalsForMonth.map(e => e.employeeId));
      }
      
      // 해당 직원의 기존 평가 데이터 찾기
      let existingEvaluation = currentEvalsForMonth.find(evaluation => evaluation.employeeId === employeeId);
      
      // 등급에 따른 점수 계산
      const gradeInfo = grade ? gradingScale[grade] : null;
      const score = gradeInfo ? gradeInfo.score : 0;
      
      let updatedEvals;
      if (existingEvaluation) {
        // 기존 데이터가 있으면 업데이트
        updatedEvals = currentEvalsForMonth.map(evaluation => 
          evaluation.employeeId === employeeId ? { ...evaluation, grade, score } : evaluation
        );
        if (process.env.NODE_ENV === 'development') {
          console.debug('기존 평가 데이터 업데이트됨');
        }
      } else {
        // 기존 데이터가 없으면 새로 생성
        const newEvaluation = {
          id: `eval-${employeeId}-${year}-${month}`,
          employeeId: employeeId,
          year: year,
          month: month,
          grade: grade,
          score: score,
          memo: '',
          detailedGroup2: '',
        };
        updatedEvals = [...currentEvalsForMonth, newEvaluation];
        if (process.env.NODE_ENV === 'development') {
          console.debug('새 평가 데이터 생성됨:', newEvaluation);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('업데이트된 평가 데이터:', updatedEvals);
      }
      
      const newEvaluations = { ...prev, [key]: updatedEvals };
      
      // localStorage에 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('evaluations', JSON.stringify(newEvaluations));
      }
      
      return newEvaluations;
    });
  }, [gradingScale]);
  
  const allEvaluationResults = React.useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== allEvaluationResults 재계산 ===');
      console.debug('evaluations 변경됨:', evaluations);
      console.debug('employees 변경됨:', employees);
    }
    
    const results = Object.entries(employees).flatMap(([key, monthlyEmployees]) => {
        const [year, month] = key.split('-').map(Number);
        const monthlyEvaluations = evaluations[key] || [];
        const evalMap = new Map(monthlyEvaluations.map(evaluation => [evaluation.employeeId, evaluation]));

        return (monthlyEmployees as Employee[])
          .filter(employee => {
            // userMap에 존재하는 유효한 사용자만 필터링
            const user = userMap.get(employee.uniqueId);
            const isValid = user && user.uniqueId;
            return isValid;
          })
          .map(employee => {
            const user = userMap.get(employee.uniqueId) || {};
            const base: Employee = { ...employee, ...user };
            
            // uniqueId로 평가 데이터와 매칭 (단순화)
            const evaluation = evalMap.get(employee.uniqueId);
            
            // 디버깅 로그
            if (process.env.NODE_ENV === 'development' && employee.uniqueId === '0000584') {
              console.debug('=== uniqueId 매칭 디버깅 ===');
              console.debug('employee.uniqueId:', employee.uniqueId);
              console.debug('evaluation 찾음:', !!evaluation);
              console.debug('evaluation 데이터:', evaluation);
              console.debug('===============================');
            }
            
            const grade = evaluation?.grade || null;
            const gradeInfo = grade ? gradingScale[grade] : null;
            // 저장된 점수가 있으면 사용하고, 없으면 등급 기준 점수 사용
            const score = evaluation?.score !== undefined ? evaluation.score : (gradeInfo?.score || 0);
            
            // admin 사용자의 기준금액을 570,000으로 강제 설정
            const adjustedBaseAmount = base.uniqueId === 'admin' ? 570000 : base.baseAmount;
            
            const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
            const gradeAmount = (adjustedBaseAmount || 0) * payoutRate;
            const finalAmount = calculateFinalAmount(gradeAmount, base.workRate);
            
            const evaluator = userMap.get(base.evaluatorId || '');
            
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
            
            const result = {
                ...base, 
                baseAmount: adjustedBaseAmount,
                year, month, grade, score, payoutRate, gradeAmount, finalAmount,
                evaluatorId: base.evaluatorId || '',
                evaluatorName: evaluator?.name || (base.evaluatorId ? `미지정 (${base.evaluatorId})` : '미지정'),
                evaluationGroup: getEvaluationGroup(base.workRate),
                detailedGroup1: getDetailedGroup1(base.workRate),
                detailedGroup2: getDetailedGroup2(base),
                memo: evaluation?.memo || base.memo || ''
            };
            
            return result;
        });
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('계산된 결과 수:', results.length);
      console.debug('등급이 있는 결과들:', results.filter(r => r.grade).map(r => ({ uniqueId: r.uniqueId, name: r.name, grade: r.grade, score: r.score })));
    }
    
    return results;
  }, [
    // evaluations 의존성 추가
    evaluations,
    employees,
    gradingScale,
    userMap
  ]);

  const getMonthlyEvaluationTargets = React.useCallback((selectedDate: {year: number, month: number}) => {
    const monthKey = `${selectedDate.year}-${selectedDate.month}`;
    const monthlyEmployeeList = employees[monthKey] || [];
    
    if (!Array.isArray(monthlyEmployeeList)) return [];

    const monthlyEmployeeIds = new Set(monthlyEmployeeList.map(e => e.uniqueId));
    return allEvaluationResults.filter(r => r.year === selectedDate.year && r.month === selectedDate.month && monthlyEmployeeIds.has(r.uniqueId));
  }, [allEvaluationResults, employees]);

  // 평가자별 피평가자 조회 함수 추가
  const getMonthlyEvaluationTargetsByEvaluator = React.useCallback((selectedDate: {year: number, month: number}, evaluatorId: string) => {
    const monthKey = `${selectedDate.year}-${selectedDate.month}`;
    const monthlyEmployeeList = employees[monthKey] || [];
    
    if (!Array.isArray(monthlyEmployeeList)) return [];

    const monthlyEmployeeIds = new Set(monthlyEmployeeList.map(e => e.uniqueId));
    
    // 해당 평가자가 담당하는 피평가자만 필터링
    const filteredResults = allEvaluationResults.filter(r => 
      r.year === selectedDate.year && 
      r.month === selectedDate.month && 
      monthlyEmployeeIds.has(r.uniqueId) &&
      r.evaluatorId === evaluatorId // 평가자 ID로 필터링
    );
    
    // 디버깅 로그
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== Context: 평가자별 필터링 디버그 ===');
      console.debug('evaluatorId:', evaluatorId);
      console.debug('selectedDate:', selectedDate);
      console.debug('monthlyEmployeeList.length:', monthlyEmployeeList.length);
      console.debug('allEvaluationResults.length:', allEvaluationResults.length);
      console.debug('필터링 조건:', {
        year: selectedDate.year,
        month: selectedDate.month,
        monthlyEmployeeIdsSize: monthlyEmployeeIds.size,
        evaluatorId
      });
      console.debug('필터링된 결과 수:', filteredResults.length);
      console.debug('필터링된 결과들:', filteredResults.map(r => ({ uniqueId: r.uniqueId, name: r.name, evaluatorId: r.evaluatorId })));
      console.debug('==========================================');
    }
    
    return filteredResults;
  }, [allEvaluationResults, employees]);

  // 성능 최적화된 쿼리 함수들
  const getEvaluationsByMonth = React.useCallback((year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return allEvaluationResults.filter(evaluation => {
      const evalDate = new Date(evaluation.year + '-' + evaluation.month + '-01');
      return evalDate >= startDate && evalDate <= endDate;
    });
  }, [allEvaluationResults]);

  const getMonthlyStats = React.useCallback((year: number, month: number) => {
    const monthlyEvaluations = getEvaluationsByMonth(year, month);
    const totalEvaluations = monthlyEvaluations.length;
    const completedEvaluations = monthlyEvaluations.filter(evaluation => evaluation.grade !== null).length;
    const averageScore = totalEvaluations > 0 
      ? monthlyEvaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / totalEvaluations 
      : 0;
    const completionRate = totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0;
    
    return {
      totalEvaluations,
      completedEvaluations,
      averageScore,
      completionRate
    };
  }, [getEvaluationsByMonth]);

  // 메모이제이션된 계산값들
  const completedEvaluations = React.useMemo(() => 
    allEvaluationResults.filter(evaluation => evaluation.grade !== null),
    [allEvaluationResults]
  );

  const pendingEvaluations = React.useMemo(() => 
    allEvaluationResults.filter(evaluation => evaluation.grade === null),
    [allEvaluationResults]
  );

  const evaluationsByEmployee = React.useMemo(() => {
    const index = new Map<string, EvaluationResult[]>();
    allEvaluationResults.forEach(evaluation => {
      const key = evaluation.uniqueId;
      if (!index.has(key)) index.set(key, []);
      index.get(key)!.push(evaluation);
    });
    return index;
  }, [allEvaluationResults]);


  const value = {
    gradingScale, setGradingScale,
    evaluations, setEvaluations,
    workRateInputs, setWorkRateInputs,
    attendanceTypes, setAttendanceTypes,
    holidays, setHolidays,
    evaluationStatus, setEvaluationStatus,
    handleEmployeeUpload, handleEvaluationUpload, handleClearEmployeeData,
    handleClearEvaluationData, handleClearWorkRateData, handleWorkRateDataUpload,
    handleClearMyEvaluations, handleApplyApproval,
    updateEvaluationMemo, updateEvaluationGroup, updateEvaluationGrade,
    allEvaluationResults, 
    monthlyEvaluationTargets: getMonthlyEvaluationTargets,
    monthlyEvaluationTargetsByEvaluator: getMonthlyEvaluationTargetsByEvaluator
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
