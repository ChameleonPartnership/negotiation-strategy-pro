'use client'

import { useCallback, useRef } from 'react'

export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delayMs = 800
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        fn(...args)
      }, delayMs)
    },
    [fn, delayMs]
  ) as T
}

export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  delayMs = 800
): (data: T) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (data: T) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveFn(data).catch(console.error)
      }, delayMs)
    },
    [saveFn, delayMs]
  )
}
