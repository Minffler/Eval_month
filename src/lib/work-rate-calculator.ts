'use client';

import type { WorkRateInputs, AttendanceType, Holiday, ShortenedWorkHourRecord, DailyAttendanceRecord, ShortenedWorkType } from './types';

export interface ShortenedWorkDetail extends ShortenedWorkHourRecord {
  rowId: string;
  type: ShortenedWorkType;
  workHours: number;
  actualWorkHours: number;
  dailyDeductionHours: number;
  businessDays: number;
  totalDeductionHours: number;
}

export interface DailyAttendanceDetail extends DailyAttendanceRecord {
    rowId: string;
    isShortenedDay: boolean;
    actualWorkHours: number;
    deductionDays: number;
    totalDeductionHours: number;
}

export interface WorkRateDetailsResult {
  shortenedWorkDetails: ShortenedWorkDetail[];
  dailyAttendanceDetails: DailyAttendanceDetail[];
}

function parseTime(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

function countBusinessDays(startDate: Date, endDate: Date, holidays: Set<string>): number {
    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        // 로컬 시간대로 날짜 문자열 생성 (YYYY-MM-DD 형식)
        const yearStr = currentDate.getFullYear();
        const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${yearStr}-${monthStr}-${dayStr}`;
        
        if (!isWeekend(currentDate) && !holidays.has(dateString)) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
}


export const calculateWorkRateDetails = (
  allWorkRateInputs: Record<string, WorkRateInputs>,
  attendanceTypes: AttendanceType[],
  holidays: Holiday[],
  year: number,
  month: number
): WorkRateDetailsResult => {
  
  const holidaySet = new Set(holidays.map(h => h.date));
  const attendanceTypeMap = new Map(attendanceTypes.map(at => [at.name, at.deductionDays]));

  const selectedMonthKey = `${year}-${month.toString().padStart(2, '0')}`;
  const selectedMonthStart = new Date(year, month - 1, 1);
  const selectedMonthEnd = new Date(year, month, 0);
  
  console.log('선택된 월 정보:', { year, month, selectedMonthKey, selectedMonthStart, selectedMonthEnd });
  
  // 연단위 바스켓 방식: 해당 연도의 모든 월에서 데이터 수집
  let allShortenedWorkRecords: ShortenedWorkHourRecord[] = [];
  let allDailyAttendanceRecords: DailyAttendanceRecord[] = [];
  
  // 해당 연도의 모든 월(1월~12월)에서 데이터 수집
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${year}-${m.toString().padStart(2, '0')}`;
    const monthData = allWorkRateInputs[monthKey] || { shortenedWorkHours: [], dailyAttendance: [] };
    
    console.log(`월 ${monthKey} 데이터 처리:`, monthData);
    
    // 단축근로 데이터: 기간이 선택된 월과 겹치는 데이터만 수집
    monthData.shortenedWorkHours.forEach(record => {
      const startDate = new Date(record.startDate);
      const endDate = new Date(record.endDate);
      
      // 기간이 겹치는지 확인
      if (startDate <= selectedMonthEnd && endDate >= selectedMonthStart) {
        console.log(`단축근로 겹침 발견:`, { record, startDate, endDate });
        allShortenedWorkRecords.push(record);
      }
    });
    
    // 일근태 데이터: 선택된 월의 데이터만 수집
    if (m === month) {
      console.log(`일근태 데이터 수집 (선택된 월):`, monthData.dailyAttendance);
      allDailyAttendanceRecords.push(...monthData.dailyAttendance);
    }
  }
  
  console.log('수집된 전체 데이터:', {
    selectedMonthKey,
    shortenedWorkRecordsCount: allShortenedWorkRecords.length,
    dailyAttendanceRecordsCount: allDailyAttendanceRecords.length,
    shortenedWorkRecords: allShortenedWorkRecords.map(r => ({ uniqueId: r.uniqueId, startDate: r.startDate, endDate: r.endDate })),
    dailyAttendanceRecords: allDailyAttendanceRecords.map(r => ({ uniqueId: r.uniqueId, date: r.date, type: r.type }))
  });
  
  // 1. Process shortened work details first, as they are needed for daily attendance calculation
  // 중복 제거: uniqueId|startDate|endDate|type 조합으로 고유한 데이터만 필터링
  const uniqueShortenedWorkRecords = allShortenedWorkRecords.filter((record, index, self) => 
    index === self.findIndex(r => 
      r.uniqueId === record.uniqueId && 
      r.startDate === record.startDate && 
      r.endDate === record.endDate && 
      r.type === record.type
    )
  );
  
  console.log('중복 제거 후 단축근로 데이터:', {
    before: allShortenedWorkRecords.length,
    after: uniqueShortenedWorkRecords.length,
    removed: allShortenedWorkRecords.length - uniqueShortenedWorkRecords.length
  });
  
  const shortenedWorkDetails: ShortenedWorkDetail[] = uniqueShortenedWorkRecords
    .map((record, index) => {
      // 이미 표준화된 형식 사용 (YYYY-MM-DD)
      const startDate = new Date(record.startDate);
      const endDate = new Date(record.endDate);

      // 선택된 월과 겹치는 기간만 계산
      const effectiveStartDate = startDate < selectedMonthStart ? selectedMonthStart : startDate;
      const effectiveEndDate = endDate > selectedMonthEnd ? selectedMonthEnd : endDate;
      
      const workHours = parseTime(record.endTime) - parseTime(record.startTime);
      let actualWorkHours = workHours;
      if (workHours >= 6) actualWorkHours -= 1;
      else if (workHours >= 4) actualWorkHours -= 0.5;

      const dailyDeductionHours = 8 - actualWorkHours;
      const businessDays = countBusinessDays(effectiveStartDate, effectiveEndDate, holidaySet);
      const totalDeductionHours = businessDays * dailyDeductionHours;

      return {
        ...record,
        // 이미 표준화된 형식 사용
        startDate: record.startDate,
        endDate: record.endDate,
        rowId: `${record.uniqueId}-${record.startDate}-${record.endDate}-${record.type}-${index}`,
        type: record.type,
        workHours,
        actualWorkHours,
        dailyDeductionHours,
        businessDays,
        totalDeductionHours,
      };
    });
  
  const shortenedWorkMapByEmployee: Map<string, ShortenedWorkDetail[]> = shortenedWorkDetails.reduce((map, record) => {
    if (!map.has(record.uniqueId)) {
      map.set(record.uniqueId, []);
    }
    map.get(record.uniqueId)!.push(record);
    return map;
  }, new Map());


  // 2. Process daily attendance details
  // 중복 제거: uniqueId|date|type 조합으로 고유한 데이터만 필터링
  const uniqueDailyAttendanceRecords = allDailyAttendanceRecords.filter((record, index, self) => 
    index === self.findIndex(r => 
      r.uniqueId === record.uniqueId && 
      r.date === record.date && 
      r.type === record.type
    )
  );
  
  console.log('중복 제거 후 일근태 데이터:', {
    before: allDailyAttendanceRecords.length,
    after: uniqueDailyAttendanceRecords.length,
    removed: allDailyAttendanceRecords.length - uniqueDailyAttendanceRecords.length
  });
  
  const dailyAttendanceDetails: DailyAttendanceDetail[] = uniqueDailyAttendanceRecords
    .map((record, index) => {
        // 이미 표준화된 형식 사용 (YYYY-MM-DD)
        const recordDate = new Date(record.date);
        
        // 평가년월 필터링 추가
        if (recordDate.getFullYear() !== year || recordDate.getMonth() !== month - 1) {
            console.log(`일근태 데이터 필터링됨: ${record.date} (선택된 월: ${year}-${month})`);
            return null;
        }
        
        let isShortenedDay = false;
        let actualWorkHours = 8;
        
        const employeeShortenedRecords = shortenedWorkMapByEmployee.get(record.uniqueId);
        if (employeeShortenedRecords) {
            const shortenedRecordForDay = employeeShortenedRecords.find(sr => {
                const startDate = new Date(sr.startDate);
                const endDate = new Date(sr.endDate);
                return recordDate >= startDate && recordDate <= endDate;
            });
            
            if (shortenedRecordForDay) {
                isShortenedDay = true;
                actualWorkHours = shortenedRecordForDay.actualWorkHours;
            }
        }
        
        const deductionDays = attendanceTypeMap.get(record.type) || 0;
        const totalDeductionHours = actualWorkHours * deductionDays;
        
        return {
            ...record,
            // 이미 표준화된 형식 사용
            date: record.date,
            rowId: `${record.uniqueId}-${record.date}-${record.type}-${index}`,
            isShortenedDay,
            actualWorkHours,
            deductionDays,
            totalDeductionHours
        };
    })
    .filter((r): r is DailyAttendanceDetail => r !== null);

  return { shortenedWorkDetails, dailyAttendanceDetails };
};
