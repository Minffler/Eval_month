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
import type { EvaluationResult, User } from '@/lib/types';
import { mockUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface EvaluatorManagementProps {
  results: EvaluationResult[];
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

export default function EvaluatorManagement({
  results,
  handleResultsUpdate,
}: EvaluatorManagementProps) {
  const [filteredResults, setFilteredResults] = React.useState(results);
  const [companyFilter, setCompanyFilter] = React.useState('all');
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [positionFilter, setPositionFilter] = React.useState('all');
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkEvaluatorId, setBulkEvaluatorId] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    let newFilteredResults = [...results];

    if (sortConfig !== null) {
      newFilteredResults.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    if (companyFilter !== 'all') {
      newFilteredResults = newFilteredResults.filter((r) => r.company === companyFilter);
    }
    if (departmentFilter !== 'all') {
      newFilteredResults = newFilteredResults.filter((r) => r.department === departmentFilter);
    }
    if (positionFilter !== 'all') {
        if (positionFilter === '-') {
            newFilteredResults = newFilteredResults.filter((r) => !['팀장', '지점장', '센터장', '지부장'].includes(r.position));
        } else {
            newFilteredResults = newFilteredResults.filter((r) => r.position === positionFilter);
        }
    }
    
    setFilteredResults(newFilteredResults);
  }, [companyFilter, departmentFilter, positionFilter, results, sortConfig]);

  const allCompanies = ['all', ...Array.from(new Set(results.map((r) => r.company)))];
  const allDepartments = ['all', ...Array.from(new Set(results.map((r) => r.department)))];
  const allPositions = ['all', '팀장', '지점장', '센터장', '지부장', '-'];
  const evaluators = mockUsers.filter(u => u.roles.includes('evaluator'));

  const evaluatorDepartments = React.useMemo(() => {
    const departmentsByEvaluator: Record<string, Set<string>> = {};
    for (const r of results) {
        if (r.evaluatorId) {
            if (!departmentsByEvaluator[r.evaluatorId]) {
                departmentsByEvaluator[r.evaluatorId] = new Set();
            }
            departmentsByEvaluator[r.evaluatorId].add(r.department);
        }
    }
    return departmentsByEvaluator;
  }, [results]);

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
        const evaluator = mockUsers.find(u => u.id === newEvaluatorId);
        return { ...r, evaluatorId: newEvaluatorId, evaluatorName: evaluator?.name || 'N/A' };
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
        const evaluator = mockUsers.find(u => u.id === bulkEvaluatorId);
        return { ...r, evaluatorId: bulkEvaluatorId, evaluatorName: evaluator?.name || 'N/A' };
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
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={companyFilter} onValueChange={setCompanyFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="회사 선택" /></SelectTrigger><SelectContent>{allCompanies.map((c) => (<SelectItem key={c} value={c}>{c === 'all' ? '모든 회사' : c}</SelectItem>))}</SelectContent></Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="소속부서 선택" /></SelectTrigger><SelectContent>{allDepartments.map((d) => (<SelectItem key={d} value={d}>{d === 'all' ? '모든 부서' : d}</SelectItem>))}</SelectContent></Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="직책 선택" /></SelectTrigger><SelectContent>{allPositions.map((p) => (<SelectItem key={p} value={p}>{p === 'all' ? '모든 직책' : p === '-' ? '없음' : p}</SelectItem>))}</SelectContent></Select>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 p-4 border rounded-lg items-center">
            <p className="font-semibold text-sm">선택한 {selectedIds.size}명</p>
            <Select value={bulkEvaluatorId} onValueChange={setBulkEvaluatorId}><SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="평가자 선택" /></SelectTrigger><SelectContent>{evaluators.map((evaluator) => { const depts = evaluatorDepartments[evaluator.id]; const deptString = depts ? `(${[...depts].slice(0, 2).join(', ')}${[...depts].size > 2 ? ', ...' : ''})` : ''; return (<SelectItem key={evaluator.id} value={evaluator.id}>{evaluator.name} {deptString}</SelectItem>);})}</SelectContent></Select>
            <Button onClick={handleBulkAssign}>일괄 할당</Button>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(Boolean(checked))} /></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => requestSort('uniqueId')}><div className="flex items-center">고유사번{getSortIcon('uniqueId')}</div></TableHead>
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
                      <Select value={result.evaluatorId} onValueChange={(newEvaluatorId) => handleEvaluatorChange(result.id, newEvaluatorId)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="평가자 선택" /></SelectTrigger>
                        <SelectContent>{evaluators.map((evaluator) => (<SelectItem key={evaluator.id} value={evaluator.id}>{evaluator.name}</SelectItem>))}</SelectContent>
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
