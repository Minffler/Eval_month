
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Trash2, ChevronDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EvaluationResult, User, AppNotification } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AssignmentManagementViewProps {
  myEmployees: EvaluationResult[];
  currentMonthResults: EvaluationResult[];
  allUsers: User[];
  handleEvaluatorAssignmentChange: (updatedUserId: string, newEvaluatorId: string) => void;
  evaluatorId: string;
  evaluatorName: string;
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;
}

export default function AssignmentManagementView({ 
  myEmployees, 
  currentMonthResults, 
  allUsers, 
  handleEvaluatorAssignmentChange, 
  evaluatorId, 
  evaluatorName,
  addNotification 
}: AssignmentManagementViewProps) {
  const { toast } = useToast();
  
  // 상태 관리
  const [selectedCompanies, setSelectedCompanies] = React.useState<Set<string>>(new Set(['전체']));
  const [department, setDepartment] = React.useState('');
  const [selectedPositions, setSelectedPositions] = React.useState<Set<string>>(new Set(['전체']));
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  
  const [groupToChange, setGroupToChange] = React.useState<{
    company: string;
    department: string;
    position: string;
    currentEvaluatorName: string;
    currentEvaluatorUniqueId: string;
    memberCount: number;
  } | null>(null);

  const [selectedGroupDetails, setSelectedGroupDetails] = React.useState<{
    group: { company: string; department: string; position: string; count: number };
    members: EvaluationResult[];
  } | null>(null);

  // 데이터 처리
  const allCompanies = React.useMemo(() => 
    ['전체', ...new Set(currentMonthResults.map(e => e.company).filter(Boolean))], 
    [currentMonthResults]
  );
  
  const allPositions = React.useMemo(() => 
    ['전체', ...new Set(currentMonthResults.map(e => e.title).filter(Boolean))].sort(), 
    [currentMonthResults]
  );

  // 선택된 회사와 직책 (전체가 선택된 경우 모든 항목 포함)
  const effectiveCompanies = React.useMemo(() => {
    if (selectedCompanies.has('전체')) {
      return allCompanies.filter(c => c !== '전체');
    }
    return Array.from(selectedCompanies);
  }, [selectedCompanies, allCompanies]);

  const effectivePositions = React.useMemo(() => {
    if (selectedPositions.has('전체')) {
      return allPositions.filter(p => p !== '전체');
    }
    return Array.from(selectedPositions);
  }, [selectedPositions, allPositions]);

  // 필터링된 담당 그룹
  const filteredManagedGroups = React.useMemo(() => {
    const groups: Record<string, { company: string; department: string; position: string; count: number }> = {};
    
    myEmployees.forEach(emp => {
      // 필터 조건 확인
      const companyMatch = effectiveCompanies.includes(emp.company);
      const departmentMatch = !department.trim() || emp.department.toLowerCase().includes(department.toLowerCase().trim());
      const positionMatch = effectivePositions.includes(emp.title);
      
      if (companyMatch && departmentMatch && positionMatch) {
        const key = `${emp.company}|${emp.department}|${emp.title}`;
        if (!groups[key]) {
          groups[key] = { company: emp.company, department: emp.department, position: emp.title, count: 0 };
        }
        groups[key].count++;
      }
    });
    
    return Object.entries(groups)
      .map(([key, value]) => ({ ...value, id: key }))
      .sort((a,b) => b.count - a.count);
  }, [myEmployees, effectiveCompanies, department, effectivePositions]);

  // 전체 담당 그룹 (필터링 없음)
  const allManagedGroups = React.useMemo(() => {
    const groups: Record<string, { company: string; department: string; position: string; count: number }> = {};
    myEmployees.forEach(emp => {
      const key = `${emp.company}|${emp.department}|${emp.title}`;
      if (!groups[key]) {
        groups[key] = { company: emp.company, department: emp.department, position: emp.title, count: 0 };
      }
      groups[key].count++;
    });
    return Object.entries(groups)
      .map(([key, value]) => ({ ...value, id: key }))
      .sort((a,b) => b.count - a.count);
  }, [myEmployees]);

  // 현재 표시할 그룹 (필터가 적용된 경우 필터링된 그룹, 아니면 전체 그룹)
  const managedGroups = React.useMemo(() => {
    const hasFilter = (selectedCompanies.size > 0 && !selectedCompanies.has('전체')) || department.trim() || (selectedPositions.size > 0 && !selectedPositions.has('전체'));
    return hasFilter ? filteredManagedGroups : allManagedGroups;
  }, [filteredManagedGroups, allManagedGroups, selectedCompanies, department, selectedPositions]);

  // 이벤트 핸들러들
  const handleInquire = () => {
    // 선택된 회사와 직책이 하나씩만 선택되어야 함
    const selectedCompany = effectiveCompanies.length === 1 ? effectiveCompanies[0] : null;
    const selectedPosition = effectivePositions.length === 1 ? effectivePositions[0] : null;
    
    if (!selectedCompany || !department.trim() || !selectedPosition) {
      toast({ 
        variant: 'destructive', 
        title: '오류', 
        description: '회사와 직책을 각각 하나씩만 선택하고, 부서를 입력해주세요.' 
      });
      return;
    }
    
    const trimmedDepartment = department.trim();
    const targetEmployees = currentMonthResults.filter(e => 
      e.company === selectedCompany && e.department === trimmedDepartment && e.title === selectedPosition
    );

    if (targetEmployees.length === 0) {
      toast({ 
        title: '정보', 
        description: '해당 조건의 소속 그룹이 존재하지 않습니다.' 
      });
      return;
    }
    
    const firstMember = targetEmployees[0];
    const currentEvaluator = allUsers.find(u => u.uniqueId === firstMember.evaluatorId);
    
    setGroupToChange({
      company: selectedCompany,
      department: trimmedDepartment,
      position: selectedPosition,
      currentEvaluatorName: currentEvaluator?.name || '미지정',
      currentEvaluatorUniqueId: currentEvaluator?.uniqueId || 'N/A',
      memberCount: targetEmployees.length,
    });
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmChange = () => {
    if (!groupToChange) return;
    
    if (groupToChange.currentEvaluatorUniqueId === evaluatorId) {
      toast({ 
        title: '정보', 
        description: '이미 담당하고 있는 소속입니다.' 
      });
      setIsConfirmDialogOpen(false);
      setGroupToChange(null);
      return;
    }

    const targetEmployees = currentMonthResults.filter(res => 
      res.company === groupToChange.company && 
      res.department === groupToChange.department && 
      res.title === groupToChange.position
    );

    targetEmployees.forEach(emp => {
      const user = allUsers.find(u => u.uniqueId === emp.uniqueId);
      if (user) {
        handleEvaluatorAssignmentChange(user.id, evaluatorId);
      }
    });
    
    // 알림 추가
    addNotification({ 
      recipientId: '1911042', 
      message: `${evaluatorName} 평가자가 ${groupToChange.department} 소속의 담당자가 되었습니다.` 
    });
    addNotification({ 
      recipientId: evaluatorId, 
      message: `이제 ${groupToChange.department} 소속의 평가를 담당합니다.` 
    });

    toast({ 
      title: '변경 완료', 
      description: `'${groupToChange.department}' 소속의 담당자가 성공적으로 변경되었습니다.` 
    });
    
    setIsConfirmDialogOpen(false);
    setGroupToChange(null);
    setCompany('');
    setDepartment('');
    setPosition('');
  };

  const handleShowDetails = (group: { company: string; department: string; position: string; count: number; }) => {
    const members = currentMonthResults.filter(e => 
      e.company === group.company && e.department === group.department && e.title === group.position
    );
    setSelectedGroupDetails({ group, members });
    setIsDetailsDialogOpen(true);
  };

  const handleReleaseGroup = (groupKey: string) => {
    const [company, department, position] = groupKey.split('|');
    const targetEmployees = myEmployees.filter(res => 
      res.company === company && 
      res.department === department && 
      res.title === position
    );

    targetEmployees.forEach(emp => {
      const user = allUsers.find(u => u.uniqueId === emp.uniqueId);
      if (user) {
        handleEvaluatorAssignmentChange(user.id, '');
      }
    });

    toast({ 
      title: '담당 해제 완료', 
      description: `'${department}' 소속을 더 이상 담당하지 않습니다.` 
    });
  };

  return (
    <div className="space-y-6">
      {/* 상단: 담당 소속 추가/변경 카드 */}
      <Card className="shadow-sm border-border">
        <CardHeader className="p-4">
          <CardTitle className="text-card-foreground">담당 소속 추가/변경</CardTitle>
          <CardDescription className="text-muted-foreground">
            담당을 원하는 소속 그룹의 정보를 입력하고 조회하여 담당자를 변경할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-end gap-2">
            {/* 회사 선택 */}
            <div className="grid flex-1 gap-1.5 w-full">
              <Label className="text-sm font-medium text-muted-foreground">회사</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    className="w-full justify-between border-border"
                  >
                    {selectedCompanies.has('전체') 
                      ? '전체 선택됨' 
                      : selectedCompanies.size > 0 
                        ? `${selectedCompanies.size}개 선택됨` 
                        : '회사를 선택하세요'
                    }
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <div className="p-2">
                    <div className="space-y-2">
                      {allCompanies.map((company) => (
                        <div key={company} className="flex items-center space-x-2">
                          <Checkbox
                            id={`company-${company}`}
                            checked={selectedCompanies.has(company)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedCompanies);
                              if (company === '전체') {
                                if (checked) {
                                  // 전체 선택 시 모든 항목 선택
                                  allCompanies.forEach(c => newSelected.add(c));
                                } else {
                                  // 전체 해제 시 모든 항목 해제
                                  newSelected.clear();
                                }
                              } else {
                                if (checked) {
                                  newSelected.add(company);
                                  // 개별 항목 선택 시 전체 해제
                                  newSelected.delete('전체');
                                } else {
                                  newSelected.delete(company);
                                }
                              }
                              setSelectedCompanies(newSelected);
                            }}
                          />
                          <Label 
                            htmlFor={`company-${company}`} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {company}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* 부서명 입력 */}
            <div className="grid flex-1 gap-1.5 w-full">
              <Label htmlFor="change-department" className="text-sm font-medium text-muted-foreground">부서명</Label>
              <Input 
                id="change-department" 
                placeholder="부서명을 정확히 입력하세요" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)}
                className="border-border"
              />
            </div>
            
            {/* 직책 선택 */}
            <div className="grid flex-1 gap-1.5 w-full">
              <Label className="text-sm font-medium text-muted-foreground">직책</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    className="w-full justify-between border-border"
                  >
                    {selectedPositions.has('전체') 
                      ? '전체 선택됨' 
                      : selectedPositions.size > 0 
                        ? `${selectedPositions.size}개 선택됨` 
                        : '직책을 선택하세요'
                    }
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <div className="p-2">
                    <div className="space-y-2">
                      {allPositions.map((position) => (
                        <div key={position} className="flex items-center space-x-2">
                          <Checkbox
                            id={`position-${position}`}
                            checked={selectedPositions.has(position)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedPositions);
                              if (position === '전체') {
                                if (checked) {
                                  // 전체 선택 시 모든 항목 선택
                                  allPositions.forEach(p => newSelected.add(p));
                                } else {
                                  // 전체 해제 시 모든 항목 해제
                                  newSelected.clear();
                                }
                              } else {
                                if (checked) {
                                  newSelected.add(position);
                                  // 개별 항목 선택 시 전체 해제
                                  newSelected.delete('전체');
                                } else {
                                  newSelected.delete(position);
                                }
                              }
                              setSelectedPositions(newSelected);
                            }}
                          />
                          <Label 
                            htmlFor={`position-${position}`} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {position}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* 조회 및 변경 요청 버튼 */}
            <Button onClick={handleInquire} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              조회 및 변경 요청
            </Button>
          </div>
          
          {/* 필터 초기화 버튼 */}
          {((selectedCompanies.size > 0 && !selectedCompanies.has('전체')) || department.trim() || (selectedPositions.size > 0 && !selectedPositions.has('전체'))) && (
            <div className="flex justify-end mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedCompanies(new Set(['전체']));
                  setDepartment('');
                  setSelectedPositions(new Set(['전체']));
                }}
                className="border-border hover:bg-accent"
              >
                필터 초기화
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 하단: 담당 소속 목록 카드 */}
      <Card className="shadow-sm border-border">
        <CardHeader className="p-4">
          <CardTitle className="text-card-foreground">
            담당 소속
            {((selectedCompanies.size > 0 && !selectedCompanies.has('전체')) || department.trim() || (selectedPositions.size > 0 && !selectedPositions.has('전체'))) && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (필터 적용됨)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {((selectedCompanies.size > 0 && !selectedCompanies.has('전체')) || department.trim() || (selectedPositions.size > 0 && !selectedPositions.has('전체')))
              ? `필터: ${(selectedCompanies.size > 0 && !selectedCompanies.has('전체')) ? `회사=${Array.from(selectedCompanies).join(', ')}` : ''} ${department.trim() ? `부서=${department.trim()}` : ''} ${(selectedPositions.size > 0 && !selectedPositions.has('전체')) ? `직책=${Array.from(selectedPositions).join(', ')}` : ''}`.trim()
              : '현재 담당하고 있는 소속 그룹 목록입니다.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="border border-border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted border-b border-border">
                  <TableHead className="text-center text-sm font-semibold text-muted-foreground">회사</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-muted-foreground">부서</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-muted-foreground">직책</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-muted-foreground">담당 인원</TableHead>
                  <TableHead className="text-center text-sm font-semibold text-muted-foreground">담당 해제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedGroups.length > 0 ? (
                  managedGroups.map((group) => (
                    <TableRow key={group.id} className="border-b border-border">
                      <TableCell className="text-center">{group.company}</TableCell>
                      <TableCell className="text-center">{group.department}</TableCell>
                      <TableCell className="text-center">{group.position}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span>{group.count}명</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 py-1 border-border hover:bg-accent" 
                            onClick={() => handleShowDetails(group)}
                          >
                            상세보기
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleReleaseGroup(group.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      현재 담당하는 소속이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 담당자 변경 확인 다이얼로그 */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>담당자 변경 확인</DialogTitle>
            <DialogDescription>
              선택한 소속 그룹의 담당자를 변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          {groupToChange && (
            <div className="space-y-4 py-4">
              <p className="text-sm">
                <span className="font-semibold text-muted-foreground">소속:</span> 
                {groupToChange.company} / {groupToChange.department} / {groupToChange.position}
              </p>
              <p className="text-sm">
                <span className="font-semibold text-muted-foreground">인원:</span> 
                {groupToChange.memberCount}명
              </p>
              <p className="text-sm">
                <span className="font-semibold text-muted-foreground">현재 담당자:</span> 
                {groupToChange.currentEvaluatorName} (ID: {groupToChange.currentEvaluatorUniqueId})
              </p>
              <p className="text-sm pt-4 font-bold text-primary">
                이 그룹의 담당자를 현재 로그인한 평가자({evaluatorName})님으로 변경합니다.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              아니오
            </Button>
            <Button onClick={handleConfirmChange} className="bg-primary hover:bg-primary/90">
              예, 변경합니다
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>담당 인원 상세 정보</DialogTitle>
            {selectedGroupDetails && (
              <DialogDescription>
                {selectedGroupDetails.group.company} / {selectedGroupDetails.group.department} / {selectedGroupDetails.group.position} 그룹의 구성원 목록입니다.
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedGroupDetails && (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted border-b border-border">
                    <TableHead className="text-center text-sm font-semibold text-muted-foreground">회사</TableHead>
                    <TableHead className="text-center text-sm font-semibold text-muted-foreground">부서</TableHead>
                    <TableHead className="text-center text-sm font-semibold text-muted-foreground">ID</TableHead>
                    <TableHead className="text-center text-sm font-semibold text-muted-foreground">이름</TableHead>
                    <TableHead className="text-center text-sm font-semibold text-muted-foreground">직책</TableHead>
                    <TableHead className="text-center text-sm font-semibold text-muted-foreground">성장레벨</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroupDetails.members.map(member => (
                    <TableRow key={member.id} className="border-b border-border">
                      <TableCell className="text-center">{member.company}</TableCell>
                      <TableCell className="text-center">{member.department}</TableCell>
                      <TableCell className="text-center">{member.uniqueId}</TableCell>
                      <TableCell className="text-center">{member.name}</TableCell>
                      <TableCell className="text-center">{member.title}</TableCell>
                      <TableCell className="text-center">{member.growthLevel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-primary hover:bg-primary/90">
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
