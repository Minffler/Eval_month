import type { Approval, ApprovalStatus, WorkRateInputs, ShortenedWorkHourRecord, DailyAttendanceRecord } from '@/lib/types';

// 추적 ID 생성기
const TrackingIdGenerator = {
  ACTION_CODES: {
    'add': 'N',
    'edit': 'E', 
    'delete': 'D'
  },
  
  TYPE_CODES: {
    'shortenedWorkHours': 'A',
    'dailyAttendance': 'T'
  },
  
  generate(request: {
    actionType: 'add' | 'edit' | 'delete';
    dataType: 'shortenedWorkHours' | 'dailyAttendance';
    employeeId: string;
    targetTrackingId?: string; // 수정/삭제 시 원본 추적 ID
    changes?: Record<string, boolean>; // 수정된 필드들
  }): string {
    const action = this.ACTION_CODES[request.actionType];
    const type = this.TYPE_CODES[request.dataType];
    const employeeId = request.employeeId.padStart(7, '0');
    const sequence = this.getNextSequence(request.employeeId);
    
    let trackingId = `W${action}${type}${employeeId}${sequence}`;
    
    // 수정/삭제인 경우 원본 추적 ID 추가
    if (request.actionType === 'edit' || request.actionType === 'delete') {
      if (request.targetTrackingId) {
        trackingId += `T${request.targetTrackingId}`;
      }
      
      // 수정인 경우 변경 필드 정보 추가
      if (request.actionType === 'edit' && request.changes) {
        const changeDetails = this.buildChangeDetails(request.changes);
        trackingId += `_${changeDetails}`;
      }
    }
    
    return trackingId;
  },
  
  getNextSequence(employeeId: string): string {
    // 실제 구현에서는 DB에서 시퀀스를 가져와야 함
    // 현재는 간단히 타임스탬프 기반으로 생성
    return Date.now().toString().slice(-3);
  },
  
  buildChangeDetails(changes: Record<string, boolean>): string {
    const changeCodes = {
      'startDate': 'sd',
      'endDate': 'ed', 
      'startTime': 'st',
      'endTime': 'et',
      'type': 'tp',
      'date': 'dt'
    };
    
    return Object.entries(changes)
      .filter(([_, changed]) => changed)
      .map(([field, _]) => changeCodes[field as keyof typeof changeCodes] || field)
      .join('');
  },
  
  // 매핑 정보 저장 (실제로는 DB에 저장)
  saveMapping(mapping: {
    trackingId: string;
    targetTrackingId: string;
    changes: Record<string, boolean>;
  }) {
    // localStorage에 임시 저장 (실제로는 DB 사용)
    const mappings = JSON.parse(localStorage.getItem('trackingMappings') || '{}');
    mappings[mapping.trackingId] = mapping;
    localStorage.setItem('trackingMappings', JSON.stringify(mappings));
  },
  
  // 매핑 정보 조회
  getMapping(trackingId: string) {
    const mappings = JSON.parse(localStorage.getItem('trackingMappings') || '{}');
    return mappings[trackingId];
  }
};

/**
 * 결재 승인 권한 확인
 */
export const canApproveApproval = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;

  // 1차 결재자 (현업) - 결재중 상태일 때만
  if (userRole === 'evaluator' && approval.approverTeamId === currentUserId) {
    return approval.status === '결재중';
  }

  // 2차 결재자 (인사) - 현업승인 후 결재중 상태일 때만
  if (userRole === 'admin' && (approval.approverHRId === currentUserId || approval.approverHRId === 'admin' || currentUserId === 'admin')) {
    return approval.status === '현업승인' && approval.statusHR === '결재중';
  }

  return false;
};

/**
 * 결재 삭제 권한 확인
 */
export const canDeleteApproval = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;
  
  // 관리자는 모든 결재 삭제 가능
  if (userRole === 'admin') return true;
  
  // 평가자는 본인이 반려한 내역만 삭제 가능
  if (userRole === 'evaluator') {
    return approval.status === '반려' && approval.approverTeamId === currentUserId;
  }
  
  // 직원은 승인이 한건도 나지 않은 내역 또는 반려된 내역 삭제 가능
  if (userRole === 'employee') {
    return (approval.status === '결재중' && approval.statusHR === '결재중') || 
           (approval.status === '반려' || approval.statusHR === '반려');
  }
  
  return false;
};

/**
 * 결재 재상신 권한 확인
 */
export const canResubmitApproval = (
  approval: Approval,
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;
  
  // 요청자만 재상신 가능
  return approval.requesterId === currentUserId && 
         (approval.status === '반려' || approval.statusHR === '반려');
};

/**
 * 1차 결재 생략 가능 여부 확인
 */
export const canSkipFirstApproval = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;
  
  // 관리자가 1차 결재를 건너뛰고 바로 승인할 수 있는지 (2차 결재자만 가능)
  return userRole === 'admin' && 
         (approval.approverHRId === currentUserId || approval.approverHRId === 'admin' || currentUserId === 'admin') &&
         approval.status === '결재중' && 
         approval.statusHR === '결재중';
};

/**
 * 결재 상태에 따른 액션 버튼 표시 여부
 */
export const getApprovalActions = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
) => {
  const canApprove = canApproveApproval(approval, userRole, currentUserId);
  const canDelete = canDeleteApproval(approval, userRole, currentUserId);
  const canResubmit = canResubmitApproval(approval, currentUserId);
  const canSkip = canSkipFirstApproval(approval, userRole, currentUserId);

  return {
    canApprove,
    canDelete,
    canResubmit,
    canSkip,
    showApprovalButtons: canApprove,
    showDeleteButton: canDelete,
    showResubmitButton: canResubmit,
    showSkipButton: canSkip,
  };
};

/**
 * 결재 상태 텍스트 가져오기
 */
export const getApprovalStatusText = (status: ApprovalStatus): string => {
  const statusMap: Record<ApprovalStatus, string> = {
    '결재중': '결재중',
    '현업승인': '현업승인',
    '최종승인': '최종승인',
    '반려': '반려',
  };
  return statusMap[status] || status;
};

/**
 * 결재 타입 텍스트 가져오기
 */
export const getApprovalTypeText = (dataType: string, action: string): string => {
  const typeText = dataType === 'shortenedWorkHours' ? '단축근로' : '일근태';
  const actionText = action === 'add' ? '추가' : action === 'edit' ? '수정' : '삭제';
  return `${typeText} ${actionText}`;
}; 

/**
 * 결재 승인된 근무 데이터를 실제 근무 데이터에 반영
 */
export function applyApprovedWorkData(
  approval: Approval,
  currentWorkRateInputs: Record<string, WorkRateInputs>,
  year: number,
  month: number
): Record<string, WorkRateInputs> {
  const { payload } = approval;
  
  // 데이터의 실제 날짜를 기준으로 키 생성
  let key: string;
  if (payload.dataType === 'shortenedWorkHours') {
    const data = payload.data as ShortenedWorkHourRecord;
    const startDate = new Date(data.startDate);
    key = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
  } else if (payload.dataType === 'dailyAttendance') {
    const data = payload.data as DailyAttendanceRecord;
    const dataDate = new Date(data.date);
    key = `${dataDate.getFullYear()}-${(dataDate.getMonth() + 1).toString().padStart(2, '0')}`;
  } else {
    // 기본값으로 결재 날짜 사용
    key = `${year}-${month.toString().padStart(2, '0')}`;
  }
  
  console.log('데이터 저장 키:', key, '결재 날짜:', `${year}-${month.toString().padStart(2, '0')}`);
  
  // 현재 월의 근무 데이터 가져오기
  const currentMonthData = currentWorkRateInputs[key] || {
    shortenedWorkHours: [],
    dailyAttendance: []
  };

  let updatedShortenedWorkHours = [...currentMonthData.shortenedWorkHours];
  let updatedDailyAttendance = [...currentMonthData.dailyAttendance];

  if (payload.dataType === 'shortenedWorkHours') {
    const newData = payload.data as ShortenedWorkHourRecord;
    
    if (payload.action === 'add') {
      // 신규 추가 - 날짜 형식 통일
      const normalizedData = {
        ...newData,
        startDate: newData.startDate.replace(/\./g, '-'),
        endDate: newData.endDate.replace(/\./g, '-'),
        lastModified: new Date().toISOString()
      };
      updatedShortenedWorkHours.push(normalizedData);
    } else if (payload.action === 'edit') {
      // 매핑 정보를 통해 수정 대상 찾기
      const mapping = TrackingIdGenerator.getMapping(approval.id);
      if (mapping) {
        const existingIndex = updatedShortenedWorkHours.findIndex(
          (item: ShortenedWorkHourRecord) => item.rowId === mapping.targetTrackingId
        );
        
        if (existingIndex !== -1) {
          updatedShortenedWorkHours[existingIndex] = {
            ...newData,
            lastModified: new Date().toISOString()
          };
        } else {
          // 기존 데이터를 찾을 수 없는 경우 추가
          updatedShortenedWorkHours.push({
            ...newData,
            lastModified: new Date().toISOString()
          });
        }
      } else {
        // 매핑 정보가 없는 경우 기존 방식으로 처리
        const existingIndex = updatedShortenedWorkHours.findIndex(
          (item: ShortenedWorkHourRecord) => item.rowId === newData.rowId
        );
        
        if (existingIndex !== -1) {
          updatedShortenedWorkHours[existingIndex] = {
            ...newData,
            lastModified: new Date().toISOString()
          };
        } else {
          updatedShortenedWorkHours.push({
            ...newData,
            lastModified: new Date().toISOString()
          });
        }
      }
    } else if (payload.action === 'delete') {
      // 삭제: 모든 필드가 일치하는 데이터 찾아서 삭제
      const deleteIndex = updatedShortenedWorkHours.findIndex(
        (item: ShortenedWorkHourRecord) => 
          item.uniqueId === newData.uniqueId && 
          item.startDate === newData.startDate && 
          item.endDate === newData.endDate &&
          item.startTime === newData.startTime &&
          item.endTime === newData.endTime &&
          item.type === newData.type
      );
      
      if (deleteIndex !== -1) {
        updatedShortenedWorkHours.splice(deleteIndex, 1);
        console.log('단축근로 데이터 삭제됨:', newData);
      }
    }
  } else if (payload.dataType === 'dailyAttendance') {
    const newData = payload.data as DailyAttendanceRecord;
    
    if (payload.action === 'add') {
      // 신규 추가 - 날짜 형식 통일
      const normalizedData = {
        ...newData,
        date: newData.date.replace(/\./g, '-'),
        lastModified: new Date().toISOString()
      };
      updatedDailyAttendance.push(normalizedData);
    } else if (payload.action === 'edit') {
      // 매핑 정보를 통해 수정 대상 찾기
      const mapping = TrackingIdGenerator.getMapping(approval.id);
      if (mapping) {
        const existingIndex = updatedDailyAttendance.findIndex(
          (item: DailyAttendanceRecord) => item.rowId === mapping.targetTrackingId
        );
        
        if (existingIndex !== -1) {
          updatedDailyAttendance[existingIndex] = {
            ...newData,
            lastModified: new Date().toISOString()
          };
        } else {
          // 기존 데이터를 찾을 수 없는 경우 추가
          updatedDailyAttendance.push({
            ...newData,
            lastModified: new Date().toISOString()
          });
        }
      } else {
        // 매핑 정보가 없는 경우 기존 방식으로 처리
        const existingIndex = updatedDailyAttendance.findIndex(
          (item: DailyAttendanceRecord) => item.rowId === newData.rowId
        );
        
        if (existingIndex !== -1) {
          updatedDailyAttendance[existingIndex] = {
            ...newData,
            lastModified: new Date().toISOString()
          };
        } else {
          updatedDailyAttendance.push({
            ...newData,
            lastModified: new Date().toISOString()
          });
        }
      }
    } else if (payload.action === 'delete') {
      // 삭제: 모든 필드가 일치하는 데이터 찾아서 삭제
      const deleteIndex = updatedDailyAttendance.findIndex(
        (item: DailyAttendanceRecord) => 
          item.uniqueId === newData.uniqueId && 
          item.date === newData.date && 
          item.type === newData.type
      );
      
      if (deleteIndex !== -1) {
        updatedDailyAttendance.splice(deleteIndex, 1);
        console.log('일근태 데이터 삭제됨:', newData);
      }
    }
  }

  // 업데이트된 근무 데이터 반환
  return {
    ...currentWorkRateInputs,
    [key]: {
      shortenedWorkHours: updatedShortenedWorkHours,
      dailyAttendance: updatedDailyAttendance
    }
  };
}

/**
 * 결재 승인된 근무 데이터가 이미 반영되었는지 확인
 */
export function isApprovalAlreadyApplied(
  approval: Approval,
  currentWorkRateInputs: Record<string, WorkRateInputs>,
  year: number,
  month: number
): boolean {
  console.log('isApprovalAlreadyApplied 호출:', { approval, year, month });
  
  const { payload } = approval;
  
  // 데이터의 실제 날짜를 기준으로 키 생성
  let key: string;
  if (payload.dataType === 'shortenedWorkHours') {
    const data = payload.data as ShortenedWorkHourRecord;
    const startDate = new Date(data.startDate);
    key = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
  } else if (payload.dataType === 'dailyAttendance') {
    const data = payload.data as DailyAttendanceRecord;
    const dataDate = new Date(data.date);
    key = `${dataDate.getFullYear()}-${(dataDate.getMonth() + 1).toString().padStart(2, '0')}`;
  } else {
    // 기본값으로 결재 날짜 사용
    key = `${year}-${month.toString().padStart(2, '0')}`;
  }
  
  console.log('검색할 키:', key, '결재 날짜:', `${year}-${month.toString().padStart(2, '0')}`);
  
  const currentMonthData = currentWorkRateInputs[key];
  console.log('현재 월 데이터:', currentMonthData);
  
  if (!currentMonthData) {
    console.log('현재 월 데이터가 없음');
    return false;
  }

  if (payload.dataType === 'shortenedWorkHours') {
    const newData = payload.data as ShortenedWorkHourRecord;
    console.log('단축근로 데이터 확인:', newData);
    
    if (payload.action === 'add') {
      // 추가된 데이터가 이미 존재하는지 확인 - 모든 필드가 정확히 일치해야 함
      const exists = currentMonthData.shortenedWorkHours.some(
        (item: ShortenedWorkHourRecord) => 
          item.uniqueId === newData.uniqueId && 
          item.startDate.replace(/\./g, '-') === newData.startDate.replace(/\./g, '-') && 
          item.endDate.replace(/\./g, '-') === newData.endDate.replace(/\./g, '-') &&
          item.startTime === newData.startTime &&
          item.endTime === newData.endTime &&
          item.type === newData.type
      );
      console.log('추가 케이스 - 이미 존재하는지:', exists, '비교 데이터:', {
        uniqueId: newData.uniqueId,
        startDate: newData.startDate,
        endDate: newData.endDate,
        startTime: newData.startTime,
        endTime: newData.endTime,
        type: newData.type,
        existingCount: currentMonthData.shortenedWorkHours.length
      });
      return exists;
    } else if (payload.action === 'edit') {
      // 매핑 정보를 통해 수정 대상 찾기
      const mapping = TrackingIdGenerator.getMapping(approval.id);
      console.log('매핑 정보:', mapping);
      
      if (!mapping) {
        console.log('매핑 정보가 없음');
        return false;
      }
      
      // 원본 추적 ID로 기존 데이터 찾기
      const existingItem = currentMonthData.shortenedWorkHours.find(
        (item: ShortenedWorkHourRecord) => item.rowId === mapping.targetTrackingId
      );
      
      console.log('찾은 기존 데이터:', existingItem);
      
      if (!existingItem) {
        console.log('기존 데이터를 찾을 수 없음');
        return false;
      }
      
      // 수정된 필드들이 실제로 반영되었는지 확인
      const changes = mapping.changes;
      console.log('변경된 필드들:', changes);
      
      let isApplied = true;
      
      if (changes.startDate && existingItem.startDate !== newData.startDate) {
        console.log('시작일이 다름:', { existing: existingItem.startDate, new: newData.startDate });
        isApplied = false;
      }
      if (changes.endDate && existingItem.endDate !== newData.endDate) {
        console.log('종료일이 다름:', { existing: existingItem.endDate, new: newData.endDate });
        isApplied = false;
      }
      if (changes.startTime && existingItem.startTime !== newData.startTime) {
        console.log('시작시간이 다름:', { existing: existingItem.startTime, new: newData.startTime });
        isApplied = false;
      }
      if (changes.endTime && existingItem.endTime !== newData.endTime) {
        console.log('종료시간이 다름:', { existing: existingItem.endTime, new: newData.endTime });
        isApplied = false;
      }
      if (changes.type && existingItem.type !== newData.type) {
        console.log('타입이 다름:', { existing: existingItem.type, new: newData.type });
        isApplied = false;
      }
      
      console.log('수정 케이스 - 이미 반영되었는지:', isApplied);
      return isApplied;
    } else if (payload.action === 'delete') {
      // 삭제된 데이터가 이미 존재하지 않는지 확인
      const exists = currentMonthData.shortenedWorkHours.some(
        (item: ShortenedWorkHourRecord) => 
          item.uniqueId === newData.uniqueId && 
          item.startDate === newData.startDate && 
          item.endDate === newData.endDate &&
          item.startTime === newData.startTime &&
          item.endTime === newData.endTime &&
          item.type === newData.type
      );
      console.log('삭제 케이스 - 데이터가 존재하는지:', exists);
      return !exists; // 데이터가 존재하지 않으면 이미 삭제된 것
    }
  } else if (payload.dataType === 'dailyAttendance') {
    const newData = payload.data as DailyAttendanceRecord;
    console.log('일근태 데이터 확인:', newData);
    
    if (payload.action === 'add') {
      // 추가된 데이터가 이미 존재하는지 확인 - 모든 필드가 정확히 일치해야 함
      const exists = currentMonthData.dailyAttendance.some(
        (item: DailyAttendanceRecord) => 
          item.uniqueId === newData.uniqueId && 
          item.date.replace(/\./g, '-') === newData.date.replace(/\./g, '-') && 
          item.type === newData.type
      );
      console.log('추가 케이스 - 이미 존재하는지:', exists, '비교 데이터:', {
        uniqueId: newData.uniqueId,
        date: newData.date,
        type: newData.type,
        existingCount: currentMonthData.dailyAttendance.length
      });
      return exists;
    } else if (payload.action === 'edit') {
      // 매핑 정보를 통해 수정 대상 찾기
      const mapping = TrackingIdGenerator.getMapping(approval.id);
      console.log('매핑 정보:', mapping);
      
      if (!mapping) {
        console.log('매핑 정보가 없음');
        return false;
      }
      
      // 원본 추적 ID로 기존 데이터 찾기
      const existingItem = currentMonthData.dailyAttendance.find(
        (item: DailyAttendanceRecord) => item.rowId === mapping.targetTrackingId
      );
      
      console.log('찾은 기존 데이터:', existingItem);
      
      if (!existingItem) {
        console.log('기존 데이터를 찾을 수 없음');
        return false;
      }
      
      // 수정된 필드들이 실제로 반영되었는지 확인
      const changes = mapping.changes;
      console.log('변경된 필드들:', changes);
      
      let isApplied = true;
      
      if (changes.date && existingItem.date !== newData.date) {
        console.log('날짜가 다름:', { existing: existingItem.date, new: newData.date });
        isApplied = false;
      }
      if (changes.type && existingItem.type !== newData.type) {
        console.log('타입이 다름:', { existing: existingItem.type, new: newData.type });
        isApplied = false;
    }
      
      console.log('수정 케이스 - 이미 반영되었는지:', isApplied);
      return isApplied;
    } else if (payload.action === 'delete') {
      // 삭제된 데이터가 이미 존재하지 않는지 확인
      const exists = currentMonthData.dailyAttendance.some(
        (item: DailyAttendanceRecord) => 
          item.uniqueId === newData.uniqueId && 
          item.date === newData.date && 
          item.type === newData.type
      );
      console.log('삭제 케이스 - 데이터가 존재하는지:', exists);
      return !exists; // 데이터가 존재하지 않으면 이미 삭제된 것
    }
  }

  console.log('기본값 false 반환');
  return false;
} 