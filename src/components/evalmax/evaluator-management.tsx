'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { EvaluationResult, Employee } from '@/lib/types';
import { getPositionSortValue } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvaluatorManagementProps {
  results: EvaluationResult[];
  allEmployees: Employee[];
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

export default function EvaluatorManagement({
  results,
  allEmployees,
  handleResultsUpdate,
}: EvaluatorManagementProps) {
  const [filteredResults, setFilteredResults] = React.useState(results);
  const [companyFilter, setCompanyFilter] = React.useState('all');
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [titleFilter, setTitleFilter] = React.useState('all');
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkEvaluatorId, setBulkEvaluatorId] = React.useState('');
  const [currentGroupEvaluator, setCurrentGroupEvaluator] = React.useState<string>('필터를 선택하세요');
  const { toast } = useToast();

  const evaluators = React.useMemo(() => {
    const evaluatorUniqueIds = new Set(allEmployees.map(e => e.evaluatorId).filter(Boolean));
    return allEmployees.filter(e => evaluatorUniqueIds.has(e.uniqueId));
  }, [allEmployees]);
  
  React.useEffect(() => {
    let newFilteredResults = [...results];

    if (companyFilter !== 'all') {
      newFilteredResults = newFilteredResults.filter((r) => r.company === companyFilter);
    }
    if (departmentFilter !== 'all') {
      newFilteredResults = newFilteredResults.filter((r) => r.department === departmentFilter);
    }
    if (titleFilter !== 'all') {
        if (titleFilter === '팀원') {
            newFilteredResults = newFilteredResults.filter((r) => !['지부장', '센터장', '팀장', '지점장'].includes(r.title));
        } else {
            newFilteredResults = newFilteredResults.filter((r) => r.title === titleFilter);
        }
    }
    
    // Determine the current evaluator for the filtered group
    if (companyFilter === 'all' && departmentFilter === 'all' && titleFilter === 'all') {
        setCurrentGroupEvaluator('필터를 선택하여 그룹을 지정해주세요.');
    } else {
        if (newFilteredResults.length > 0) {
            const firstEvaluatorName = newFilteredResults[0].evaluatorName;
            const allSame = newFilteredResults.every(r => r.evaluatorName === firstEvaluatorName);
            if (allSame) {
                setCurrentGroupEvaluator(firstEvaluatorName || '미지정');
            } else {
                setCurrentGroupEvaluator('여러 평가자');
            }
        } else {
            setCurrentGroupEvaluator('해당 그룹 없음');
        }
    }

    if (sortConfig !== null) {
      newFilteredResults.sort((a, b) => {
        if (sortConfig.key === 'title') {
            const orderA = getPositionSortValue(a.title);
            const orderB = getPositionSortValue(b.title);
            if (orderA !== orderB) {
                return sortConfig.direction === 'ascending' ? orderA - orderB : orderB - orderA;
            }
        }
        
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    setFilteredResults(newFilteredResults);
  }, [companyFilter, departmentFilter, titleFilter, results, sortConfig]);

  const allCompanies = ['all', ...Array.from(new Set(results.map((r) => r.company)))];
  const allDepartments = ['all', ...Array.from(new Set(results.map((r) => r.department)))];
  const allTitles = ['all', '지부장', '센터장', '팀장', '지점장', '팀원'];
  
  const evaluatorDeptStrings = React.useMemo(() => {
    const deptsByEvaluator: Record<string, Record<string, number>> = {};
    for (const r of allEmployees) {
        if (r.evaluatorId) {
            const evaluator = allEmployees.find(e => e.uniqueId === r.evaluatorId);
            if(evaluator) {
              if (!deptsByEvaluator[evaluator.uniqueId]) {
                  deptsByEvaluator[evaluator.uniqueId] = {};
              }
              const dept = r.department || '미지정';
              deptsByEvaluator[evaluator.uniqueId][dept] = (deptsByEvaluator[evaluator.uniqueId][dept] || 0) + 1;
            }
        }
    }
    
    const deptStrings: Record<string, string> = {};
    for (const evaluator of evaluators) {
        const depts = deptsByEvaluator[evaluator.uniqueId];
        if (depts) {
          const sortedDeptNames = Object.entries(depts)
              .sort(([, countA], [, countB]) => countB - countA)
              .map(([deptName]) => deptName);

          if (sortedDeptNames.length > 0) {
              deptStrings[evaluator.uniqueId] = `(${sortedDeptNames.slice(0, 2).join(', ')}${sortedDeptNames.length > 2 ? ', ...' : ''})`;
          } else {
              deptStrings[evaluator.uniqueId] = '';
          }
        } else {
          deptStrings[evaluator.uniqueId] = '';
        }
    }
    return deptStrings;
}, [allEmployees, evaluators]);

  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredResults.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) newSelection.add(id);
    else newSelection.delete(id);
    setSelectedIds(newSelection);
  };

  const handleEvaluatorChange = (employeeId: string, newEvaluatorId: string) => {
    const updatedResults = results.map((r) => {
      if (r.id === employeeId) {
        const evaluator = allEmployees.find(u => u.uniqueId === newEvaluatorId);
        return { ...r, evaluatorId: newEvaluatorId, evaluatorName: evaluator?.name || `ID: ${newEvaluatorId}` };
      }
      return r;
    });
    handleResultsUpdate(updatedResults);
  };
  
  const handleBulkAssign = () => {
    if (selectedIds.size === 0 || !bulkEvaluatorId) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '직원을 선택하고 할당할 평가자를 선택해주세요.',
      });
      return;
    }
    const updatedResults = results.map(r => {
      if (selectedIds.has(r.id)) {
        const evaluator = allEmployees.find(u => u.uniqueId === bulkEvaluatorId);
        return { ...r, evaluatorId: bulkEvaluatorId, evaluatorName: evaluator?.name || `ID: ${bulkEvaluatorId}` };
      }
      return r;
    });
    handleResultsUpdate(updatedResults);
    toast({
      title: '일괄 할당 완료',
      description: `${selectedIds.size}명의 직원에 대한 평가자가 변경되었습니다.`,
    });
    setSelectedIds(new Set());
    setBulkEvaluatorId('');
  };

  const isAllSelected = filteredResults.length > 0 && selectedIds.size === filteredResults.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>평가자 관리</CardTitle>
          <CardDescription>
            회사, 소속부서, 직책별로 직원의 평가자를 매칭하고 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-2 gap-y-4 items-end">
            <Select value={companyFilter} onValueChange={setCompanyFilter}><SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="회사 선택" /></SelectTrigger><SelectContent>{allCompanies.map((c) => (<SelectItem key={c} value={c}>{c === 'all' ? '모든 회사' : c}</SelectItem>))}</SelectContent></Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}><SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="소속부서 선택" /></SelectTrigger><SelectContent>{allDepartments.map((d) => (<SelectItem key={d} value={d}>{d === 'all' ? '모든 부서' : d}</SelectItem>))}</SelectContent></Select>
            <Select value={titleFilter} onValueChange={setTitleFilter}><SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="직책 선택" /></SelectTrigger><SelectContent>{allTitles.map((p) => (<SelectItem key={p} value={p}>{p === 'all' ? '모든 직책' : p}</SelectItem>))}</SelectContent></Select>
            <div className={cn("p-2 rounded-md", 
              currentGroupEvaluator === '필터를 선택하여 그룹을 지정해주세요.' ? 'text-muted-foreground' : 'bg-muted')}>
                <p className="text-sm font-medium">현재 담당자: <span className="font-bold text-primary">{currentGroupEvaluator}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 my-4 p-4 border rounded-lg items-center">
            <p className="font-semibold text-sm">선택한 {selectedIds.size}명</p>
            <Select value={bulkEvaluatorId} onValueChange={setBulkEvaluatorId}>
              <SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="평가자 선택" /></SelectTrigger>
              <SelectContent>
                {evaluators.map((evaluator) => { 
                    const deptString = evaluatorDeptStrings[evaluator.uniqueId] || ''; 
                    return (<SelectItem key={evaluator.uniqueId} value={evaluator.uniqueId}>{evaluator.name} {deptString}</SelectItem>);
                })}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAssign}>일괄 할당</Button>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(Boolean(checked))} /></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('uniqueId')}><div className="flex items-center">ID{getSortIcon('uniqueId')}</div></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('name')}><div className="flex items-center">이름{getSortIcon('name')}</div></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('company')}><div className="flex items-center">회사{getSortIcon('company')}</div></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('department')}><div className="flex items-center">소속부서{getSortIcon('department')}</div></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('title')}><div className="flex items-center">직책{getSortIcon('title')}</div></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('evaluatorName')}><div className="flex items-center">평가자{getSortIcon('evaluatorName')}</div></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id} data-state={selectedIds.has(result.id) ? "selected" : ""}>
                    <TableCell><Checkbox checked={selectedIds.has(result.id)} onCheckedChange={(checked) => handleSelectRow(result.id, Boolean(checked))} /></TableCell>
                    <TableCell>{result.uniqueId}</TableCell>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.company}</TableCell>
                    <TableCell>{result.department}</TableCell>
                    <TableCell>{result.title}</TableCell>
                    <TableCell>
                      <Select value={result.evaluatorId || ''} onValueChange={(newEvaluatorId) => handleEvaluatorChange(result.id, newEvaluatorId)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="평가자 선택" /></SelectTrigger>
                        <SelectContent>{evaluators.map((evaluator) => (<SelectItem key={evaluator.uniqueId} value={evaluator.uniqueId}>{evaluator.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
