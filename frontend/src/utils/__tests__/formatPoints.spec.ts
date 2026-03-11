import { describe, it, expect } from 'vitest'
import { formatPoints } from '@/utils/formatPoints'

describe('formatPoints', () => {
  it('shows integer when value has no fractional part', () => {
    expect(formatPoints(100)).toBe('100')
  })

  it('shows one decimal when value has a single significant decimal', () => {
    expect(formatPoints(23.5)).toBe('23.5')
  })

  it('trims trailing zero from two decimals', () => {
    expect(formatPoints(156.40)).toBe('156.4')
  })

  it('keeps two decimals when both are significant', () => {
    expect(formatPoints(156.34)).toBe('156.34')
  })

  it('handles zero', () => {
    expect(formatPoints(0)).toBe('0')
  })

  it('handles double-zero decimals like 23.00', () => {
    expect(formatPoints(23.00)).toBe('23')
  })
})
