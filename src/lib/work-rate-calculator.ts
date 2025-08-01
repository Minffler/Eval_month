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
  
  // 모든 월의 데이터를 순회하면서 선택된 월에 영향을 미치는 데이터 수집
  let allShortenedWorkRecords: ShortenedWorkHourRecord[] = [];
  let allDailyAttendanceRecords: DailyAttendanceRecord[] = [];
  
  Object.entries(allWorkRateInputs).forEach(([monthKey, monthData]) => {
    console.log(`월 ${monthKey} 데이터 처리:`, monthData);
    
    // 단축근로 데이터: 기간이 선택된 월과 겹치는 모든 데이터 수집
    monthData.shortenedWorkHours.forEach(record => {
      const startDate = new Date(record.startDate.replace(/\./g, '-'));
      const endDate = new Date(record.endDate.replace(/\./g, '-'));
      
      // 기간이 겹치는지 확인
      if (startDate <= selectedMonthEnd && endDate >= selectedMonthStart) {
        console.log(`단축근로 겹침 발견:`, { record, startDate, endDate });
        allShortenedWorkRecords.push(record);
      }
    });
    
    // 일근태 데이터: 해당 월의 데이터만 수집
    if (monthKey === selectedMonthKey) {
      console.log(`일근태 데이터 수집:`, monthData.dailyAttendance);
      allDailyAttendanceRecords.push(...monthData.dailyAttendance);
    }
  });
  
  console.log('수집된 전체 데이터:', {
    shortenedWorkRecords: allShortenedWorkRecords.length,
    dailyAttendanceRecords: allDailyAttendanceRecords.length
  });
  
  // 1. Process shortened work details first, as they are needed for daily attendance calculation
  const shortenedWorkDetails: ShortenedWorkDetail[] = allShortenedWorkRecords
    .map((record, index) => {
      // 날짜 형식 통일: 점(.)을 하이픈(-)으로 변환
      const normalizedStartDate = record.startDate.replace(/\./g, '-');
      const normalizedEndDate = record.endDate.replace(/\./g, '-');
      
      const startDate = new Date(normalizedStartDate);
      const endDate = new Date(normalizedEndDate);

      // Check for overlap with selected month
      if (endDate < selectedMonthStart || startDate > selectedMonthEnd) {
        return null;
      }
      
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
        // 날짜 형식을 하이픈으로 통일
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        rowId: `${record.uniqueId}-${normalizedStartDate}-${normalizedEndDate}-${record.type}-${index}`,
        type: record.type,
        workHours,
        actualWorkHours,
        dailyDeductionHours,
        businessDays,
        totalDeductionHours,
      };
    })
    .filter((r): r is ShortenedWorkDetail => r !== null);
  
  const shortenedWorkMapByEmployee: Map<string, ShortenedWorkDetail[]> = shortenedWorkDetails.reduce((map, record) => {
    if (!map.has(record.uniqueId)) {
      map.set(record.uniqueId, []);
    }
    map.get(record.uniqueId)!.push(record);
    return map;
  }, new Map());


  // 2. Process daily attendance details
  const dailyAttendanceDetails: DailyAttendanceDetail[] = allDailyAttendanceRecords
    .map((record, index) => {
        // 날짜 형식 통일: 점(.)을 하이픈(-)으로 변환
        const normalizedDate = record.date.replace(/\./g, '-');
        const recordDate = new Date(normalizedDate);
        
        if (recordDate.getFullYear() !== year || recordDate.getMonth() !== month - 1) {
            return null; // Filter out records not in the selected month
        }
        
        let isShortenedDay = false;
        let actualWorkHours = 8;
        
        const employeeShortenedRecords = shortenedWorkMapByEmployee.get(record.uniqueId);
        if (employeeShortenedRecords) {
            const shortenedRecordForDay = employeeShortenedRecords.find(sr => {
                const startDate = new Date(sr.startDate.replace(/\./g, '-'));
                const endDate = new Date(sr.endDate.replace(/\./g, '-'));
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
            // 날짜 형식을 하이픈으로 통일
            date: normalizedDate,
            rowId: `${record.uniqueId}-${normalizedDate}-${record.type}-${index}`,
            isShortenedDay,
            actualWorkHours,
            deductionDays,
            totalDeductionHours
        };
    })
    .filter((r): r is DailyAttendanceDetail => r !== null);

  return { shortenedWorkDetails, dailyAttendanceDetails };
};
