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
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/contexts/notification-context';

interface EvaluatorManagementProps {
  results: EvaluationResult[];
  allEmployees: Employee[];
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;


interface MultiSelectFilterProps {
  title: string;
  options: readonly string[];
  selected: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
  searchable?: boolean;
  className?: string;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  title,
  options,
  selected,
  onSelectionChange,
  searchable = false,
  className,
}) => {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredOptions = searchable
    ? options.filter(option => option.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleToggle = (option: string) => {
    const newSelection = new Set(selected);
    if (newSelection.has(option)) {
      newSelection.delete(option);
    } else {
      newSelection.add(option);
    }
    onSelectionChange(newSelection);
  };
  
  const selectedLabel = selected.size > 0 
    ? selected.size > 2
      ? `${selected.size}개 선택됨`
      : Array.from(selected).join(', ')
    : `모든 ${title}`;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={isOpen} className={cn("w-full sm:w-[180px] justify-between", className)}>
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        {searchable && (
          <div className="p-2">
            <Input
              placeholder={`${title} 검색...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
             <div
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent"
                onClick={() => onSelectionChange(new Set())}
              >
              <Checkbox checked={selected.size === 0} readOnly />
              <Label className="font-normal cursor-pointer w-full">{`모든 ${title}`}</Label>
            </div>
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent"
                onClick={() => handleToggle(option)}
              >
                <Checkbox checked={selected.has(option)} readOnly />
                <Label className="font-normal cursor-pointer w-full">{option}</Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};


export default function EvaluatorManagement({
  results,
  allEmployees,
  handleResultsUpdate,
}: EvaluatorManagementProps) {
  const [filteredResults, setFilteredResults] = React.useState(results);
  const [companyFilter, setCompanyFilter] = React.useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = React.useState<Set<string>>(new Set());
  const [titleFilter, setTitleFilter] = React.useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'evaluatorName', direction: 'ascending' });
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkEvaluatorId, setBulkEvaluatorId] = React.useState('');
  const [currentGroupEvaluator, setCurrentGroupEvaluator] = React.useState<string>('필터를 선택하세요');
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const evaluators = React.useMemo(() => {
    return allEmployees.filter(e => allEmployees.some(emp => emp.evaluatorId === e.uniqueId));
  }, [allEmployees]);
  
  React.useEffect(() => {
    let newFilteredResults = [...results];

    if (companyFilter.size > 0) {
      newFilteredResults = newFilteredResults.filter((r) => r.company && companyFilter.has(r.company));
    }
    if (departmentFilter.size > 0) {
      newFilteredResults = newFilteredResults.filter((r) => r.department && departmentFilter.has(r.department));
    }
    if (titleFilter.size > 0) {
      newFilteredResults = newFilteredResults.filter(r => {
          const isLeader = ['지부장', '센터장', '팀장', '지점장'].includes(r.title);
          if (titleFilter.has(r.title)) return true;
          if (titleFilter.has('팀원') && !isLeader) return true;
          return false;
      });
    }
    
    if (companyFilter.size === 0 && departmentFilter.size === 0 && titleFilter.size === 0) {
        setCurrentGroupEvaluator('필터를 선택하여 그룹을 지정해주세요.');
    } else if (newFilteredResults.length > 0) {
        const uniqueEvaluatorIds = Array.from(new Set(newFilteredResults.map(r => r.evaluatorId).filter(Boolean)));
        
        if (uniqueEvaluatorIds.length === 0) {
            if (newFilteredResults.some(r => !r.evaluatorId)) {
                setCurrentGroupEvaluator('미지정');
            } else {
                setCurrentGroupEvaluator('해당 그룹 없음');
            }
        } else if (uniqueEvaluatorIds.length === 1) {
            const evaluator = allEmployees.find(e => e.uniqueId === uniqueEvaluatorIds[0]);
            setCurrentGroupEvaluator(evaluator ? `${evaluator.name} (${evaluator.uniqueId})` : `ID: ${uniqueEvaluatorIds[0]}`);
        } else {
            const evaluatorNames = uniqueEvaluatorIds.map(id => {
                const evaluator = allEmployees.find(e => e.uniqueId === id);
                return evaluator ? evaluator.name : `ID: ${id}`;
            });

            const displayNames = evaluatorNames.slice(0, 3);
            let displayText = displayNames.join(', ');
            if (evaluatorNames.length > 3) {
                displayText += '...';
            }
            setCurrentGroupEvaluator(displayText);
        }
    } else {
        setCurrentGroupEvaluator('해당 그룹 없음');
    }

    if (sortConfig !== null) {
      newFilteredResults.sort((a, b) => {
        if (sortConfig.key === 'evaluatorName') {
            const aUnassigned = !a.evaluatorId;
            const bUnassigned = !b.evaluatorId;
            if (aUnassigned !== bUnassigned) {
                return sortConfig.direction === 'ascending' ? (aUnassigned ? -1 : 1) : (aUnassigned ? 1 : -1);
            }
        }
        
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
    setSelectedIds(new Set());
  }, [companyFilter, departmentFilter, titleFilter, results, sortConfig, allEmployees]);

  const allCompanies = React.useMemo(() => [...new Set(results.map((r) => r.company).filter(Boolean))], [results]);
  const allDepartments = React.useMemo(() => [...new Set(results.map((r) => r.department).filter(Boolean))].sort(), [results]);
  const allTitles = ['지부장', '센터장', '팀장', '지점장', '팀원'];

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
    const finalEvaluatorId = newEvaluatorId === 'unassigned' ? '' : newEvaluatorId;
    const employee = results.find(r => r.id === employeeId);
    const newEvaluator = allEmployees.find(u => u.uniqueId === finalEvaluatorId);

    if (employee) {
        if (newEvaluator) {
             addNotification({ recipientId: '1911042', message: `${employee.name}의 평가자가 ${newEvaluator.name}(으)로 변경되었습니다.` });
             addNotification({ recipientId: newEvaluator.uniqueId, message: `${employee.name}의 평가를 새로 담당하게 되었습니다.` });
             addNotification({ recipientId: employee.uniqueId, message: `담당 평가자가 ${newEvaluator.name}님으로 변경되었습니다.` });
        } else if (!finalEvaluatorId) { // unassigned
            addNotification({ recipientId: '1911042', message: `${employee.name}의 평가자가 미지정으로 변경되었습니다.` });
            addNotification({ recipientId: employee.uniqueId, message: `담당 평가자가 지정되지 않았습니다. 관리자에게 문의하세요.` });
        }
    }

    const updatedResults = results.map((r) => {
      if (r.id === employeeId) {
        return { ...r, evaluatorId: finalEvaluatorId, evaluatorName: finalEvaluatorId ? (newEvaluator?.name || `ID: ${finalEvaluatorId}`) : '미지정' };
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
    const finalEvaluatorId = bulkEvaluatorId === 'unassigned' ? '' : bulkEvaluatorId;
    const newEvaluator = allEmployees.find(u => u.uniqueId === finalEvaluatorId);

    const updatedResults = results.map(r => {
      if (selectedIds.has(r.id)) {
        // Send notification only if evaluator changes
        if (r.evaluatorId !== finalEvaluatorId) {
            if (newEvaluator) {
                 addNotification({ recipientId: '1911042', message: `${r.name}의 평가자가 ${newEvaluator.name}(으)로 변경되었습니다.` });
                 addNotification({ recipientId: newEvaluator.uniqueId, message: `${r.name}의 평가를 새로 담당하게 되었습니다.` });
                 addNotification({ recipientId: r.uniqueId, message: `담당 평가자가 ${newEvaluator.name}님으로 변경되었습니다.` });
            } else if (!finalEvaluatorId) {
                addNotification({ recipientId: '1911042', message: `${r.name}의 평가자가 미지정으로 변경되었습니다.` });
                addNotification({ recipientId: r.uniqueId, message: `담당 평가자가 지정되지 않았습니다. 관리자에게 문의하세요.` });
            }
        }
        return { ...r, evaluatorId: finalEvaluatorId, evaluatorName: finalEvaluatorId ? (newEvaluator?.name || `ID: ${finalEvaluatorId}`) : '미지정' };
      }
      return r;
    });

    handleResultsUpdate(updatedResults);
    toast({
      title: '일괄 반영 완료',
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
            <MultiSelectFilter title="회사" options={allCompanies} selected={companyFilter} onSelectionChange={setCompanyFilter} />
            <MultiSelectFilter title="부서" options={allDepartments} selected={departmentFilter} onSelectionChange={setDepartmentFilter} searchable />
            <MultiSelectFilter title="직책" options={allTitles} selected={titleFilter} onSelectionChange={setTitleFilter} />
            
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
                <SelectItem value="unassigned">미지정</SelectItem>
                {evaluators.map((evaluator) => (
                    <SelectItem key={evaluator.uniqueId} value={evaluator.uniqueId}>
                        {`${evaluator.name} (${evaluator.uniqueId})`}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAssign}>일괄 반영</Button>
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
                      <Select value={result.evaluatorId || 'unassigned'} onValueChange={(newEvaluatorId) => handleEvaluatorChange(result.id, newEvaluatorId)}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="미지정" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">미지정</SelectItem>
                          {evaluators.map((evaluator) => (
                              <SelectItem key={evaluator.uniqueId} value={evaluator.uniqueId}>
                                  {`${evaluator.name} (${evaluator.uniqueId})`}
                              </SelectItem>
                          ))}
                        </SelectContent>
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
