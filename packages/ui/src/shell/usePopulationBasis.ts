/** One saved population basis for every office and the mounted wall. */
import { useSyncExternalStore } from 'react'
import { loadPopulationBasis, savePopulationBasis, subscribePopulationBasis, POPULATION_BASIS_KEY, type PopulationBasis } from '../perPerson'

function subscribe(listener: () => void) {
  const unsubscribe = subscribePopulationBasis(listener)
  const storageChanged = (event: StorageEvent) => {
    if (event.key === POPULATION_BASIS_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', storageChanged)
  return () => {
    unsubscribe()
    window.removeEventListener('storage', storageChanged)
  }
}

export function usePopulationBasis() {
  const basis = useSyncExternalStore<PopulationBasis>(subscribe, loadPopulationBasis, () => 'total')
  return [basis, savePopulationBasis] as const
}
