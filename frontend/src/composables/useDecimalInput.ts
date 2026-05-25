import { computed } from 'vue'

export function useDecimalInput() {
  const decimalSeparator = computed(() =>
    (1.1).toLocaleString().replace(/\d/g, '')
  )

  function normalizeDecimalKey(e: KeyboardEvent) {
    if (!(e.target instanceof HTMLInputElement)) return
    const sep = decimalSeparator.value
    const typed = e.key
    const opposite = sep === ',' ? '.' : ','
    if (typed !== opposite) return
    e.preventDefault()
    e.stopPropagation()
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand('insertText', false, sep)
  }

  return { decimalSeparator, normalizeDecimalKey }
}
