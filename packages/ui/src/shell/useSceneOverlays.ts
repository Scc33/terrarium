/**
 * The three overlays that come to the player rather than waiting to be found:
 * the verdict when a run ends, the campaign when an election becomes available,
 * and the count when the votes are in.
 *
 * All three are in ONE hook because there is a precedence rule between them —
 * the verdict outranks the count when a lost election ends the run. Split
 * across two hooks that rule becomes an ordering dependency between two
 * `useEffect`s in two files, which is exactly how it would get broken.
 *
 * `onScene` is deliberately narrower than the screen's overlay vocabulary: the
 * scenes are the only paperwork that opens itself, and the type says so.
 */

import { useEffect, useRef } from 'react'
import type { PublishedState } from '@terrarium/observation'

export function useSceneOverlays({
  published,
  onScene,
}: {
  published: PublishedState | null
  onScene: (scene: 'verdict' | 'election' | 'count') => void
}) {
  const hadCard = useRef(false)
  const lastCampaignSeen = useRef<number | null>(null)
  const lastCountSeen = useRef<number | null>(null)

  // the verdict presents itself exactly once, when the run ends
  useEffect(() => {
    const has = published?.reportCard !== undefined
    if (has && !hadCard.current) onScene('verdict')
    hadCard.current = has
  }, [published, onScene])

  // The election is a scene, so it comes to the player rather than
  // waiting to be found: the campaign opens itself the quarter it becomes
  // available, and the count presents itself once when the votes are in.
  // Each fires once per election — reopening on every advance would make the
  // campaign a nag rather than a moment.
  useEffect(() => {
    if (!published) return
    // keyed on the quarter the vote HAPPENS, not on the countdown, so the
    // campaign opens once per election rather than once per advance
    const c = published.campaign
    const voteAt = c ? published.tick + c.quartersToElection : null
    if (voteAt !== null && lastCampaignSeen.current !== voteAt) {
      lastCampaignSeen.current = voteAt
      onScene('election')
      return
    }
    // the verdict outranks the count when a lost election ends the run
    const r = published.lastElection
    if (r && lastCountSeen.current !== r.tick && published.reportCard === undefined) {
      lastCountSeen.current = r.tick
      onScene('count')
    }
  }, [published, onScene])
}
