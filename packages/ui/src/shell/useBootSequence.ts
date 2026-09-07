/**
 * How a session starts. Exactly one of four things happens on mount: a visual
 * test asks for a named seed, a shared country arrives in the fragment, an
 * autosave is found, or the posting room opens. `startup` is which of those is
 * still outstanding — the war room shows the splash screen until it resolves,
 * and the posting room's own ACCEPT puts it back to `loading`, which is why the
 * setter is returned rather than kept private.
 */

import { useEffect, useState } from 'react'
import { useGame } from '../store/gameStore'
import { sharedCountryFromUrl, type CountryDocument } from '../countryDraft'

export function useBootSequence() {
  const { newGame, loadAutosave, loadDrafts, saveDraft } = useGame()
  const [startup, setStartup] = useState<'loading' | 'selecting'>('loading')

  useEffect(() => {
    const visualSeed = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('seed') : null
    if (visualSeed) {
      newGame('procedural', visualSeed)
      return
    }
    void loadDrafts()

    // a shared country arrives in the fragment. It opens the posting room with
    // the country on the shelf rather than starting it — accepting a stranger's
    // posting is the player's decision, not the link's.
    let shared: CountryDocument | null = null
    try {
      shared = sharedCountryFromUrl(window.location.href)
    } catch (error) {
      console.warn('shared country could not be opened:', error)
    }
    if (shared) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
      void saveDraft(shared).then(() => setStartup('selecting'))
      return
    }

    void loadAutosave().then((found) => {
      if (!found) setStartup('selecting')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { startup, setStartup }
}
