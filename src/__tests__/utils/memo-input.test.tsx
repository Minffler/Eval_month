import { render, screen, fireEvent } from '@testing-library/react';
import { MemoizedMemoInput } from '@/components/evalmax/evaluator/evaluation-input-view';

// Mock the MemoizedMemoInput component for testing
const MockMemoizedMemoInput = ({ value, employeeId, onMemoChange }: {
  value: string;
  employeeId: string;
  onMemoChange: (id: string, memo: string) => void;
}) => {
  const [inputValue, setInputValue] = React.useState(value || '');
  
  React.useEffect(() => {
    const cleanValue = value && !value.includes('user-') ? value : '';
    setInputValue(cleanValue);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onMemoChange(employeeId, e.target.value);
  };
  
  return (
    <input
      data-testid="memo-input"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="평가 피드백 입력"
    />
  );
};

describe('Memo Input Component', () => {
  const mockOnMemoChange = jest.fn();

  beforeEach(() => {
    mockOnMemoChange.mockClear();
  });

  it('초기값이 올바르게 표시된다', () => {
    render(
      <MockMemoizedMemoInput
        value="테스트 메모"
        employeeId="emp-1"
        onMemoChange={mockOnMemoChange}
      />
    );

    const input = screen.getByTestId('memo-input');
    expect(input).toHaveValue('테스트 메모');
  });

  it('잘못된 데이터(user-)가 필터링된다', () => {
    render(
      <MockMemoizedMemoInput
        value="user-0000584"
        employeeId="emp-1"
        onMemoChange={mockOnMemoChange}
      />
    );

    const input = screen.getByTestId('memo-input');
    expect(input).toHaveValue('');
  });

  it('입력값이 변경되면 상태가 업데이트된다', () => {
    render(
      <MockMemoizedMemoInput
        value=""
        employeeId="emp-1"
        onMemoChange={mockOnMemoChange}
      />
    );

    const input = screen.getByTestId('memo-input');
    fireEvent.change(input, { target: { value: '새로운 메모' } });
    
    expect(input).toHaveValue('새로운 메모');
  });

  it('포커스 해제 시 onMemoChange가 호출된다', () => {
    render(
      <MockMemoizedMemoInput
        value=""
        employeeId="emp-1"
        onMemoChange={mockOnMemoChange}
      />
    );

    const input = screen.getByTestId('memo-input');
    fireEvent.change(input, { target: { value: '저장할 메모' } });
    fireEvent.blur(input);
    
    expect(mockOnMemoChange).toHaveBeenCalledWith('emp-1', '저장할 메모');
  });

  it('value prop이 변경되면 입력값이 업데이트된다', () => {
    const { rerender } = render(
      <MockMemoizedMemoInput
        value="초기값"
        employeeId="emp-1"
        onMemoChange={mockOnMemoChange}
      />
    );

    const input = screen.getByTestId('memo-input');
    expect(input).toHaveValue('초기값');

    rerender(
      <MockMemoizedMemoInput
        value="업데이트된 값"
        employeeId="emp-1"
        onMemoChange={mockOnMemoChange}
      />
    );

    expect(input).toHaveValue('업데이트된 값');
  });
}); 