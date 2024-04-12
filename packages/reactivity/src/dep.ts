import type { ReactiveEffect } from './effect'

export type Dep = Map<ReactiveEffect, number> & {
  cleanup: () => void
}

export const createDep = (
  cleanup: () => void,
): Dep => {
  const dep = new Map() as Dep
  dep.cleanup = cleanup
  return dep
}
