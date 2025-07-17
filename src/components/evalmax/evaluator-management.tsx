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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { User, EvaluationResult } from '@/lib/types';
import { getPositionSortValue } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAuth } from '@/contexts/auth-context';
import { useEvaluation } from '@/contexts/evaluation-context';


interface EvaluatorManagementProps {}

type SortConfig = {
  key: keyof (User & { evaluatorName?: string});
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


const EvaluatorSelector = ({
    evaluators,
    value,
    onSelect,
    className,
}: {
    evaluators: User[];
    value: string;
    onSelect: (evaluatorId: string) => void;
    className?: string;
}) => {
    const [open, setOpen] = React.useState(false);

    const selectedEvaluator = evaluators.find(e => e.uniqueId === value);
    const triggerText = selectedEvaluator ? `${selectedEvaluator.name} (${selectedEvaluator.uniqueId})` : '미지정';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between h-8", className)}>
                    <span className="truncate">{triggerText}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
                <Command>
                    <CommandInput placeholder="평가자 검색..." />
                    <CommandList>
                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem onSelect={() => { onSelect(''); setOpen(false); }}>
                                미지정
                            </CommandItem>
                            {evaluators.map(evaluator => (
                                <CommandItem
                                    key={evaluator.uniqueId}
                                    value={`${evaluator.name} ${evaluator.uniqueId}`}
                                    onSelect={() => { onSelect(evaluator.uniqueId); setOpen(false); }}
                                >
                                    {evaluator.name} ({evaluator.uniqueId})
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


export default function EvaluatorManagement(props: EvaluatorManagementProps) {
  const { allUsers, updateUser } = useAuth();
  const { allEvaluationResults } = useEvaluation();
  const results = allEvaluationResults;

  const [filteredResults, setFilteredResults] = React.useState<EvaluationResult[]>(results);
  const [companyFilter, setCompanyFilter] = React.useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = React.useState<Set<string>>(new Set());
  const [titleFilter, setTitleFilter] = React.useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'evaluatorName', direction: 'ascending' });
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkEvaluatorId, setBulkEvaluatorId] = React.useState('');
  const [currentGroupEvaluator, setCurrentGroupEvaluator] = React.useState<string>('필터를 선택하세요');
  const { toast } = useToast();

  const evaluators = React.useMemo(() => {
    return allUsers
      .filter(u => u.roles.includes('evaluator'))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [allUsers]);
  
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
            const evaluator = allUsers.find(u => u.uniqueId === uniqueEvaluatorIds[0]);
            setCurrentGroupEvaluator(evaluator ? `${evaluator.name} (${evaluator.uniqueId})` : `ID: ${uniqueEvaluatorIds[0]}`);
        } else {
            const evaluatorNames = uniqueEvaluatorIds.map(id => {
                const evaluator = allUsers.find(u => u.uniqueId === id);
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
                return sortConfig.direction === 'ascending' ? orderA - orderB : orderB - a;
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
  }, [companyFilter, departmentFilter, titleFilter, results, sortConfig, allUsers]);

  const allCompanies = React.useMemo(() => [...new Set(results.map((r) => r.company).filter(Boolean))], [results]);
  const allDepartments = React.useMemo(() => [...new Set(results.map((r) => r.department).filter(Boolean))].sort(), [results]);
  const allTitles = ['지부장', '센터장', '팀장', '지점장', '팀원'];

  const requestSort = (key: keyof User) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof User) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
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
    const user = allUsers.find(u => u.employeeId === employeeId);
    if (user) {
        const finalEvaluatorId = newEvaluatorId === 'unassigned' ? '' : newEvaluatorId;
        updateUser(user.id, { evaluatorId: finalEvaluatorId });
    }
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
    
    selectedIds.forEach(employeeId => {
      const user = allUsers.find(u => u.id === employeeId);
      if (user) {
        updateUser(user.id, { evaluatorId: finalEvaluatorId });
      }
    });

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
          <CardTitle>평가자 배정</CardTitle>
          <CardDescription>
            회사, 소속부서, 직책별로 직원의 평가자를 매칭하고 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 items-start">
                <MultiSelectFilter title="회사" options={allCompanies} selected={companyFilter} onSelectionChange={setCompanyFilter} />
                <MultiSelectFilter title="부서" options={allDepartments} selected={departmentFilter} onSelectionChange={setDepartmentFilter} searchable />
                <MultiSelectFilter title="직책" options={allTitles} selected={titleFilter} onSelectionChange={setTitleFilter} />
                <div className={cn("p-2 rounded-md h-10 flex items-center", 
                    currentGroupEvaluator === '필터를 선택하여 그룹을 지정해주세요.' ? 'text-muted-foreground' : 'bg-muted')}>
                    <p className="text-sm font-medium whitespace-nowrap">현재 담당자: <span className="font-bold text-primary">{currentGroupEvaluator}</span></p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 p-4 border rounded-lg items-center">
                <p className="font-semibold text-sm whitespace-nowrap">선택한 {selectedIds.size}명</p>
                <EvaluatorSelector
                  evaluators={evaluators}
                  value={bulkEvaluatorId}
                  onSelect={setBulkEvaluatorId}
                  className="h-9 sm:w-64"
                />
                <Button onClick={handleBulkAssign} size="sm">일괄 반영</Button>
            </div>
          </div>
          
          <div className="border rounded-lg mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center"><Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(Boolean(checked))} /></TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}><div className="flex items-center justify-center">ID{getSortIcon('uniqueId')}</div></TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('company')}><div className="flex items-center justify-center">회사{getSortIcon('company')}</div></TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('department')}><div className="flex items-center justify-center">소속부서{getSortIcon('department')}</div></TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('title')}><div className="flex items-center justify-center">직책{getSortIcon('title')}</div></TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('evaluatorName')}><div className="flex items-center justify-center">평가자{getSortIcon('evaluatorName')}</div></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id} data-state={selectedIds.has(result.id) ? "selected" : ""}>
                    <TableCell className="text-center py-1 px-2"><Checkbox checked={selectedIds.has(result.id)} onCheckedChange={(checked) => handleSelectRow(result.id, Boolean(checked))} /></TableCell>
                    <TableCell className="text-center py-1 px-2">{result.uniqueId}</TableCell>
                    <TableCell className="text-center py-1 px-2">{result.name}</TableCell>
                    <TableCell className="text-center py-1 px-2">{result.company}</TableCell>
                    <TableCell className="text-center py-1 px-2">{result.department}</TableCell>
                    <TableCell className="text-center py-1 px-2">{result.title}</TableCell>
                    <TableCell className="py-1 px-2 text-center">
                       <EvaluatorSelector
                          evaluators={evaluators}
                          value={result.evaluatorId || ''}
                          onSelect={(newEvaluatorId) => handleEvaluatorChange(result.id, newEvaluatorId)}
                        />
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
