export function formatPoints(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '')
}
