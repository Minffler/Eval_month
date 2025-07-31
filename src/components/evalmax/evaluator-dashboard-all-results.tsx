'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { getPositionSortValue, formatCurrency } from '@/lib/data';
import type { EvaluationResult, Grade, GradeInfo, SortConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AllResultsViewProps {
  currentMonthResults: EvaluationResult[];
  allEmployees: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
  currentEvaluatorId?: string; // 현재 로그인한 평가자 ID
}

export default function AllResultsView({ 
  currentMonthResults, 
  allEmployees, 
  gradingScale, 
  handleResultsUpdate,
  currentEvaluatorId
}: AllResultsViewProps) {
  // 상태 관리
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [selectedCompanies, setSelectedCompanies] = React.useState<Set<string>>(new Set(['all']));
  const [selectedDepartments, setSelectedDepartments] = React.useState<Set<string>>(new Set(['all']));
  const [selectedPositions, setSelectedPositions] = React.useState<Set<string>>(new Set(['all']));

  // 필터 옵션들
  const allCompanies = React.useMemo(() => 
    ['all', ...Array.from(new Set(currentMonthResults.map(e => e.company).filter(Boolean)))], 
    [currentMonthResults]
  );
  
  const allDepartments = React.useMemo(() => 
    ['all', ...Array.from(new Set(currentMonthResults.map(e => e.department).filter(Boolean)))].sort(), 
    [currentMonthResults]
  );
  
  const allPositions = React.useMemo(() => {
    const positions = Array.from(new Set(currentMonthResults.map(e => e.title).filter(Boolean)));
    const sortedPositions = positions.sort((a,b) => getPositionSortValue(a) - getPositionSortValue(b));
    return ['all', ...sortedPositions];
  }, [currentMonthResults]);

  // 선택된 필터 값들 (전체가 선택된 경우 모든 항목 포함)
  const effectiveCompanies = React.useMemo(() => {
    if (selectedCompanies.has('all')) {
      return allCompanies.filter(c => c !== 'all');
    }
    return Array.from(selectedCompanies);
  }, [selectedCompanies, allCompanies]);

  const effectiveDepartments = React.useMemo(() => {
    if (selectedDepartments.has('all')) {
      return allDepartments.filter(d => d !== 'all');
    }
    return Array.from(selectedDepartments);
  }, [selectedDepartments, allDepartments]);

  const effectivePositions = React.useMemo(() => {
    if (selectedPositions.has('all')) {
      return allPositions.filter(p => p !== 'all');
    }
    return Array.from(selectedPositions);
  }, [selectedPositions, allPositions]);

  // 필터링된 결과
  const filteredResults = React.useMemo(() => {
    return currentMonthResults.filter(r => {
      const companyMatch = effectiveCompanies.includes(r.company);
      const departmentMatch = effectiveDepartments.includes(r.department);
      const positionMatch = effectivePositions.includes(r.title);
      
      // 현재 로그인한 평가자가 담당하는 피평가자만 필터링
      const evaluatorMatch = currentEvaluatorId ? r.evaluatorId === currentEvaluatorId : true;
      
      return companyMatch && departmentMatch && positionMatch && evaluatorMatch;
    });
  }, [currentMonthResults, effectiveCompanies, effectiveDepartments, effectivePositions, currentEvaluatorId]);

  // 정렬된 결과
  const sortedFilteredResults = React.useMemo(() => {
    let sortableItems = [...filteredResults];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'title') {
          const orderA = getPositionSortValue(a.title);
          const orderB = getPositionSortValue(b.title);
          if (orderA !== orderB) {
            return sortConfig.direction === 'ascending' ? orderA - orderB : orderB - orderA;
          }
        }
        
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredResults, sortConfig]);

  // 정렬 핸들러
  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // 정렬 아이콘
  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  // 구분 아이콘 컴포넌트
  const EvaluationGroupIcon = ({ group }: { group: string }) => {
    const groupChar = group.charAt(0);
    switch (groupChar) {
      case 'A':
        return (
          <div 
            className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-700" 
            style={{ backgroundColor: 'hsl(25, 15%, 75%)' }}
          >
            {groupChar}
          </div>
        );
      case 'B':
        return (
          <div 
            className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-800" 
            style={{ backgroundColor: 'hsl(25, 20%, 92%)' }}
          >
            {groupChar}
          </div>
        );
      case 'C':
        return (
          <div 
            className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-400" 
            style={{ backgroundColor: 'hsl(30, 20%, 98%)' }}
          >
            {groupChar}
          </div>
        );
      default:
        return <span>{group}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        {/* 상단 필터 영역 */}
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* 회사 필터 */}
            <div className="w-full sm:w-[180px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    className="w-full justify-between"
                  >
                    {selectedCompanies.has('all') 
                      ? '모든 회사' 
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
                              if (company === 'all') {
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
                                  newSelected.delete('all');
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
                            {company === 'all' ? '모든 회사' : company}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* 부서 필터 */}
            <div className="w-full sm:w-[180px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    className="w-full justify-between"
                  >
                    {selectedDepartments.has('all') 
                      ? '모든 부서' 
                      : selectedDepartments.size > 0 
                        ? `${selectedDepartments.size}개 선택됨` 
                        : '부서를 선택하세요'
                    }
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <div className="p-2">
                    <div className="space-y-2">
                      {allDepartments.map((department) => (
                        <div key={department} className="flex items-center space-x-2">
                          <Checkbox
                            id={`department-${department}`}
                            checked={selectedDepartments.has(department)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedDepartments);
                              if (department === 'all') {
                                if (checked) {
                                  // 전체 선택 시 모든 항목 선택
                                  allDepartments.forEach(d => newSelected.add(d));
                                } else {
                                  // 전체 해제 시 모든 항목 해제
                                  newSelected.clear();
                                }
                              } else {
                                if (checked) {
                                  newSelected.add(department);
                                  // 개별 항목 선택 시 전체 해제
                                  newSelected.delete('all');
                                } else {
                                  newSelected.delete(department);
                                }
                              }
                              setSelectedDepartments(newSelected);
                            }}
                          />
                          <Label 
                            htmlFor={`department-${department}`} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {department === 'all' ? '모든 부서' : department}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* 직책 필터 */}
            <div className="w-full sm:w-[180px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    role="combobox" 
                    className="w-full justify-between"
                  >
                    {selectedPositions.has('all') 
                      ? '모든 직책' 
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
                              if (position === 'all') {
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
                                  newSelected.delete('all');
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
                            {position === 'all' ? '모든 직책' : position}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        
        {/* 테이블 영역 */}
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* 회사 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('company')}
                  >
                    <div className="flex items-center justify-center">
                      회사{getSortIcon('company')}
                    </div>
                  </TableHead>
                  
                  {/* 소속부서 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('department')}
                  >
                    <div className="flex items-center justify-center">
                      소속부서{getSortIcon('department')}
                    </div>
                  </TableHead>
                  
                  {/* 이름 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center justify-center">
                      이름{getSortIcon('name')}
                    </div>
                  </TableHead>
                  
                  {/* 직책 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center justify-center">
                      직책{getSortIcon('title')}
                    </div>
                  </TableHead>
                  
                  {/* 구분 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('evaluationGroup')}
                  >
                    <div className="flex items-center justify-center">
                      구분{getSortIcon('evaluationGroup')}
                    </div>
                  </TableHead>
                  
                  {/* 근무율 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('workRate')}
                  >
                    <div className="flex items-center justify-center">
                      근무율{getSortIcon('workRate')}
                    </div>
                  </TableHead>
                  
                  {/* 등급 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('grade')}
                  >
                    <div className="flex items-center justify-center">
                      등급{getSortIcon('grade')}
                    </div>
                  </TableHead>
                  
                  {/* 점수 */}
                  <TableHead 
                    className="cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('score')}
                  >
                    <div className="flex items-center justify-center">
                      점수{getSortIcon('score')}
                    </div>
                  </TableHead>
                  
                  {/* 기준금액 */}
                  <TableHead 
                    className="text-right cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('baseAmount')}
                  >
                    <div className="flex items-center justify-center">
                      기준금액{getSortIcon('baseAmount')}
                    </div>
                  </TableHead>
                  
                  {/* 최종금액 */}
                  <TableHead 
                    className="text-right cursor-pointer whitespace-nowrap text-center" 
                    onClick={() => requestSort('finalAmount')}
                  >
                    <div className="flex items-center justify-center">
                      최종금액{getSortIcon('finalAmount')}
                    </div>
                  </TableHead>
                  
                  {/* 비고 */}
                  <TableHead className="whitespace-nowrap text-center">
                    비고
                  </TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {sortedFilteredResults.length > 0 ? (
                  sortedFilteredResults.map(result => (
                    <TableRow key={`${result.year}-${result.month}-${result.uniqueId}`}>
                      <TableCell className="text-center">{result.company}</TableCell>
                      <TableCell className="text-center">{result.department}</TableCell>
                      <TableCell className="text-center">{result.name}</TableCell>
                      <TableCell className="text-center">{result.title}</TableCell>
                      <TableCell className="text-center">
                        <EvaluationGroupIcon group={result.evaluationGroup} />
                      </TableCell>
                      <TableCell className="text-center">
                        {(result.workRate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">{result.grade}</TableCell>
                      <TableCell className="text-center">{result.score}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(result.baseAmount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(result.finalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.memo || ''}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">
                      해당 조건의 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
