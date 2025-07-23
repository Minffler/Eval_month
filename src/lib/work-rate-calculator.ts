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
        const dateString = currentDate.toISOString().split('T')[0];
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

  const monthKey = `${year}-${month}`;
  const currentMonthInputs = allWorkRateInputs[monthKey] || { shortenedWorkHours: [], dailyAttendance: [] };
  
  // 1. Process shortened work details first, as they are needed for daily attendance calculation
  const shortenedWorkDetails: ShortenedWorkDetail[] = currentMonthInputs.shortenedWorkHours
    .map((record, index) => {
      const startDate = new Date(record.startDate.replace(/\./g, '-'));
      const endDate = new Date(record.endDate.replace(/\./g, '-'));

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      // Check for overlap
      if (endDate < startOfMonth || startDate > endOfMonth) {
        return null;
      }
      
      const effectiveStartDate = startDate < startOfMonth ? startOfMonth : startDate;
      const effectiveEndDate = endDate > endOfMonth ? endOfMonth : endDate;
      
      const workHours = parseTime(record.endTime) - parseTime(record.startTime);
      let actualWorkHours = workHours;
      if (workHours >= 6) actualWorkHours -= 1;
      else if (workHours >= 4) actualWorkHours -= 0.5;

      const dailyDeductionHours = 8 - actualWorkHours;
      const businessDays = countBusinessDays(effectiveStartDate, effectiveEndDate, holidaySet);
      const totalDeductionHours = businessDays * dailyDeductionHours;

      return {
        ...record,
        rowId: `${record.uniqueId}-${record.startDate}-${record.endDate}-${record.type}-${index}`,
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
  const dailyAttendanceDetails: DailyAttendanceDetail[] = currentMonthInputs.dailyAttendance
    .map((record, index) => {
        const recordDate = new Date(record.date.replace(/\./g, '-'));
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
