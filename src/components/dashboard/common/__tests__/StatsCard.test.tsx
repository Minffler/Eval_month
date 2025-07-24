import { render, screen } from '@testing-library/react'
import { StatsCard } from '../StatsCard'
import { TrendingUp, TrendingDown } from 'lucide-react'

describe('StatsCard', () => {
  const defaultProps = {
    title: '테스트 통계',
    value: '100',
    description: '테스트 설명'
  }

  it('기본 정보를 올바르게 렌더링한다', () => {
    render(<StatsCard {...defaultProps} />)
    
    expect(screen.getByText('테스트 통계')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('테스트 설명')).toBeInTheDocument()
  })

  it('아이콘을 올바르게 렌더링한다', () => {
    const TestIcon = () => <div data-testid="test-icon">📊</div>
    render(<StatsCard {...defaultProps} icon={<TestIcon />} />)
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('긍정적인 변화를 올바르게 표시한다', () => {
    render(
      <StatsCard
        {...defaultProps}
        change={{ value: 15, isPositive: true }}
      />
    )
    
    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('이전 달 대비')).toBeInTheDocument()
    expect(screen.getByText('15%')).toHaveClass('text-green-500')
  })

  it('부정적인 변화를 올바르게 표시한다', () => {
    render(
      <StatsCard
        {...defaultProps}
        change={{ value: 8, isPositive: false }}
      />
    )
    
    expect(screen.getByText('8%')).toBeInTheDocument()
    expect(screen.getByText('이전 달 대비')).toBeInTheDocument()
    expect(screen.getByText('8%')).toHaveClass('text-red-500')
  })

  it('변화가 없을 때 변화 정보를 표시하지 않는다', () => {
    render(<StatsCard {...defaultProps} />)
    
    expect(screen.queryByText('이전 달 대비')).not.toBeInTheDocument()
  })

  it('숫자 값을 올바르게 표시한다', () => {
    render(<StatsCard {...defaultProps} value={42} />)
    
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('문자열 값을 올바르게 표시한다', () => {
    render(<StatsCard {...defaultProps} value="N/A" />)
    
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('카드에 호버 효과가 적용된다', () => {
    render(<StatsCard {...defaultProps} />)
    
    const card = screen.getByText('테스트 통계').closest('.hover\\:shadow-md')
    expect(card).toBeInTheDocument()
  })
}) 