import { useState, useCallback, useMemo } from 'react';

/**
 * 컴포넌트별 로컬 상태 관리를 위한 커스텀 훅들
 */

// 필터링 상태 관리
export const useFilterState = <T>(initialData: T[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'ascending' | 'descending';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let result = [...initialData];

    // 검색 필터링
    if (searchTerm.trim()) {
      result = result.filter(item => {
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // 추가 필터링
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = (item as any)[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    return result;
  }, [initialData, searchTerm, filters]);

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const updateSortConfig = useCallback((key: keyof T, direction: 'ascending' | 'descending') => {
    setSortConfig({ key, direction });
  }, []);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSortConfig(null);
    setFilters({});
  }, []);

  return {
    data: sortedData,
    searchTerm,
    sortConfig,
    filters,
    updateSearchTerm,
    updateSortConfig,
    updateFilter,
    clearFilters
  };
};

// 페이지네이션 상태 관리
export const usePagination = <T>(data: T[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentData,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    resetPagination
  };
};

// 폼 상태 관리
export const useFormState = <T extends Record<string, any>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 필드 업데이트 시 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrors(newErrors);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setIsSubmitting(false);
  }, [initialState]);

  const startSubmitting = useCallback(() => {
    setIsSubmitting(true);
  }, []);

  const stopSubmitting = useCallback(() => {
    setIsSubmitting(false);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    updateFields,
    setFieldError,
    setErrors,
    clearErrors,
    resetForm,
    startSubmitting,
    stopSubmitting
  };
};

// 선택 상태 관리
export const useSelection = <T>(items: T[], keyExtractor: (item: T) => string) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const isSelected = useCallback((item: T) => {
    return selectedItems.has(keyExtractor(item));
  }, [selectedItems, keyExtractor]);

  const selectItem = useCallback((item: T) => {
    setSelectedItems(prev => new Set([...prev, keyExtractor(item)]));
  }, [keyExtractor]);

  const deselectItem = useCallback((item: T) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyExtractor(item));
      return newSet;
    });
  }, [keyExtractor]);

  const toggleItem = useCallback((item: T) => {
    if (isSelected(item)) {
      deselectItem(item);
    } else {
      selectItem(item);
    }
  }, [isSelected, selectItem, deselectItem]);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(items.map(keyExtractor)));
  }, [items, keyExtractor]);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const getSelectedItems = useCallback(() => {
    return items.filter(item => isSelected(item));
  }, [items, isSelected]);

  return {
    selectedItems: Array.from(selectedItems),
    isSelected,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    getSelectedItems
  };
}; 