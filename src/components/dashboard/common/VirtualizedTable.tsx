import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    width?: number;
    render?: (value: any, item: T) => React.ReactNode;
  }[];
  rowHeight?: number;
  visibleRows?: number;
  className?: string;
}

/**
 * 가상화된 테이블 컴포넌트
 * 대용량 데이터를 효율적으로 렌더링
 */
export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 48,
  visibleRows = 10,
  className = ''
}: VirtualizedTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 전체 높이 계산
  const totalHeight = data.length * rowHeight;
  
  // 가시 영역 계산
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleRows, data.length);
  
  // 가시 영역의 데이터만 추출
  const visibleData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // 스크롤 핸들러 (디바운스 적용)
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // 가시 영역의 오프셋 계산
  const offsetY = startIndex * rowHeight;

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: visibleRows * rowHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={String(column.key)}
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map((item, index) => (
                <TableRow key={startIndex + index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render 
                        ? column.render((item as any)[column.key], item)
                        : String((item as any)[column.key] || '')
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 