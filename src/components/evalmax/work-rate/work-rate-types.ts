export type DeductionType = 'attendance' | 'pregnancy' | 'care';

export interface WorkRateSummary {
  uniqueId: string;
  name: string;
  deductionHoursAttendance: number;
  deductionHoursPregnancy: number;
  deductionHoursCare: number;
  totalDeductionHours: number;
  totalWorkHours: number;
  monthlyWorkRate: number;
  lastModified?: string;
}

export type SortConfig = {
  key: keyof WorkRateSummary;
  direction: 'ascending' | 'descending';
} | null;

export interface DetailDialogInfo {
  isOpen: boolean;
  title: string;
  data: any[];
  type: 'attendance' | 'shortened';
} 