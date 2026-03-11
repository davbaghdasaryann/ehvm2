'use client'

import { useSyncExternalStore } from 'react'

type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean,
) => void

type GetState<T> = () => T

type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T

type PersistOptions<T> = {
  name: string
  partialize?: (state: T) => unknown
}

type StoreHook<T> = {
  (): T
  <U>(selector: (state: T) => U): U
  getState: GetState<T>
  setState: SetState<T>
  subscribe: (listener: () => void) => () => void
}

export function create<T>() {
  return (initializer: StateCreator<T>): StoreHook<T> => {
    const listeners = new Set<() => void>()
    let state: T

    const getState: GetState<T> = () => state

    const setState: SetState<T> = (partial, replace = false) => {
      const patch = typeof partial === 'function' ? partial(state) : partial
      state = replace ? (patch as T) : ({ ...state, ...patch } as T)
      listeners.forEach((listener) => listener())
    }

    const subscribe = (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }

    state = initializer(setState, getState)

    const useStore = (<U>(selector?: (state: T) => U) => {
      const resolve = () => (selector ? selector(state) : (state as unknown as U))
      return useSyncExternalStore(subscribe, resolve, resolve)
    }) as StoreHook<T>

    useStore.getState = getState
    useStore.setState = setState
    useStore.subscribe = subscribe

    return useStore
  }
}

export function persist<T>(
  initializer: StateCreator<T>,
  options: PersistOptions<T>,
): StateCreator<T> {
  return (set, get) => {
    const persistSet: SetState<T> = (partial, replace) => {
      set(partial, replace)
      if (typeof window === 'undefined') return
      try {
        const nextState = get()
        const toStore = options.partialize ? options.partialize(nextState) : nextState
        window.localStorage.setItem(options.name, JSON.stringify(toStore))
      } catch {
        // Ignore storage and quota errors.
      }
    }

    const initialState = initializer(persistSet, get)

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(options.name)
        if (raw) {
          const persisted = JSON.parse(raw) as Partial<T>
          Object.assign(initialState as Record<string, unknown>, persisted)
        }
      } catch {
        // Ignore malformed payloads.
      }
    }

    return initialState
  }
}
