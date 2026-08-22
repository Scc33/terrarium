/**
 * The war room, on one screen: header letterhead, the instrument wall with
 * the ledger and corridor docked, the control rail, and the wire along the
 * bottom. Overlays are ministry paperwork on top — the ledger's full books,
 * the wire's spike, the study, the records office.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from './store/gameStore'
import { HeaderBar } from './panels/HeaderBar'
import { Instruments } from './panels/Instruments'
import { ControlRail } from './panels/ControlRail'
import { NewsWire } from './panels/NewsWire'
import { LedgerOverlay } from './panels/LedgerOverlay'
import { PolicyOverlay } from './panels/PolicyOverlay'
import { AccountsOverlay } from './panels/AccountsOverlay'
import { IndustryOverlay } from './panels/IndustryOverlay'
import { WireOverlay } from './panels/WireOverlay'
import { StudyOverlay } from './panels/StudyOverlay'
import { SettingsOverlay } from './panels/SettingsOverlay'
import { ManualOverlay } from './panels/ManualOverlay'
import { Walkthrough } from './panels/Walkthrough'
import { ReportCardOverlay } from './panels/ReportCardOverlay'
import { CensusOverlay } from './panels/CensusOverlay'
import { FinanceOverlay } from './panels/FinanceOverlay'
import { ElectionOverlay } from './panels/ElectionOverlay'
import { ElectionResultOverlay } from './panels/ElectionResultOverlay'
import { DevConsole } from './panels/DevConsole'
import { CountrySelect } from './panels/CountrySelect'
import { DraftingRoom } from './panels/DraftingRoom'
import { Button, Modal, useFocusTrap } from './components/ui'
import { hasBeenBriefed, markBriefed } from './walkthrough'
import type { ManualChapterId } from './manual'
import { draftFrom, sharedCountryFromUrl, type CountryDocument } from './countryDraft'
import type { CuratedCountryId } from '@terrarium/engine'
import type { CabinetGroup } from './cabinetNavigation'

type OverlayKind =
  | 'ledger'
  | 'policy'
  | 'accounts'
  | 'industry'
  | 'wire'
  | 'study'
  | 'settings'
  | 'verdict'
  | 'census'
  | 'finance'
  | 'election'
  | 'count'
  | 'country'
  | 'manual'
  | null

export default function App() {
  const { published, newGame, newDraftedGame, loadAutosave, loadError, drafts, loadDrafts, saveDraft, deleteDraft, clearStudy } =
    useGame()
  const [startup, setStartup] = useState<'loading' | 'selecting'>('loading')
  const [overlay, setOverlay] = useState<OverlayKind>(null)
  /** the draft currently open in the drafting room, and the country it was
   * opened from — the origin is what the DRAFTED marks are measured against */
  const [editing, setEditing] = useState<{ draft: CountryDocument; origin: CountryDocument } | null>(null)
  /** the quarter the player takes office (ADR-0021). It lives here rather than
   * in the posting room because the drafting room's own ACCEPT starts a game
   * too, and a year chosen next door is still the year that player means. */
  const [appointedAt, setAppointedAt] = useState(0)
  const [cabinetOpen, setCabinetOpen] = useState(false)
  /** the handbook opens on whichever chapter the player was reaching for —
   * the records office wants the methodology, the header wants the front */
  const [manualChapter, setManualChapter] = useState<ManualChapterId>('briefing')
  /** the opening walkthrough (#33). `null` is "not touring". Decided once, at
   * mount, from a preference of this BROWSER rather than of the run — a player
   * on their fourth country has been introduced. The card itself renders only
   * inside the war room, so a tour armed here waits for a game to exist
   * without needing an effect to notice one arriving. */
  const [tourStep, setTourStep] = useState<number | null>(() => (hasBeenBriefed() ? null : 0))
  const [devOpen, setDevOpen] = useState(false)
  const [cabinetGroup, setCabinetGroup] = useState<CabinetGroup>('TAXATION')
  const [cabinetFocusRequest, setCabinetFocusRequest] = useState(0)
  const cabinetDrawerRef = useRef<HTMLDivElement>(null)
  const cabinetReturnFocusRef = useRef<HTMLElement>(null)
  const hadCard = useRef(false)
  const lastCampaignSeen = useRef<number | null>(null)
  const lastCountSeen = useRef<number | null>(null)
  const closeCabinet = useCallback(() => setCabinetOpen(false), [])

  useFocusTrap({
    active: cabinetOpen,
    containerRef: cabinetDrawerRef,
    initialFocusSelector: '[role="tab"][aria-selected="true"]',
    onEscape: closeCabinet,
    restoreFocusRef: cabinetReturnFocusRef,
  })

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

  // a century is four hundred quarters; making the player travel to a button
  // four hundred times is a tax on the only verb the game has. Space advances,
  // Escape closes whatever paperwork is on the desk.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      if (e.key === 'Escape') {
        setOverlay(null)
        return
      }
      // backtick opens the maintenance hatch. Dev builds only — in production
      // `__DEV_TOOLS__` is a literal false and this branch is dropped.
      if (__DEV_TOOLS__ && e.key === '`') {
        e.preventDefault()
        setDevOpen((o) => !o)
        return
      }
      // the tour keeps its own focus on NEXT, so Space belongs to that button
      // rather than to the quarter. Returning BEFORE preventDefault is the
      // whole point: swallowing the key here left the tour advancing on Enter
      // only, with Space doing nothing at all.
      if (tourStep !== null) return
      if (e.code === 'Space' && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const s = useGame.getState()
        if (overlay === null && !devOpen && !s.advancing && s.published?.inPower) s.advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay, devOpen, tourStep])

  const endTour = useCallback(() => {
    setTourStep(null)
    markBriefed()
  }, [])

  const openManual = (chapter: ManualChapterId) => {
    setManualChapter(chapter)
    setOverlay('manual')
  }

  // the verdict presents itself exactly once, when the run ends
  useEffect(() => {
    const has = published?.reportCard !== undefined
    if (has && !hadCard.current) setOverlay('verdict')
    hadCard.current = has
  }, [published])

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
      setOverlay('election')
      return
    }
    // the verdict outranks the count when a lost election ends the run
    const r = published.lastElection
    if (r && lastCountSeen.current !== r.tick && published.reportCard === undefined) {
      lastCountSeen.current = r.tick
      setOverlay('count')
    }
  }, [published])

  // the drafting room's wiring, shared by both places the posting room appears
  const openDraft = (doc: CountryDocument) => {
    clearStudy()
    setEditing({ draft: doc, origin: doc })
  }
  const postingRoom = {
    appointedAt,
    onAppointedAt: setAppointedAt,
    drafts,
    onNewDraft: (from: CuratedCountryId) => openDraft(draftFrom(from)),
    onEditDraft: openDraft,
    onImportDraft: (doc: CountryDocument) => void saveDraft(doc),
    onDeleteDraft: (key: string) => void deleteDraft(key),
  }
  const draftingRoom = editing && (
    <DraftingRoom
      draft={editing.draft}
      origin={editing.origin}
      onChange={(next) => setEditing((current) => (current ? { ...current, draft: next } : current))}
      onClose={() => setEditing(null)}
      onAccept={(doc) => {
        // accepting files it too: a country you played and cannot find again
        // is a country you cannot iterate on
        void saveDraft(doc)
        setEditing(null)
        setOverlay(null)
        setStartup('loading')
        newDraftedGame(doc, undefined, undefined, appointedAt)
      }}
    />
  )

  if (!published) {
    // A refused save is the other way the boot sequence ends, and it is derived
    // rather than latched: the splash screen has no exit of its own, so without
    // this the game is over before it starts with the reason in the console.
    // `newGame` clears `loadError`, which is what puts the splash back.
    if (startup === 'selecting' || loadError) {
      return (
        <>
          <CountrySelect
            {...postingRoom}
            notice={loadError}
            onStart={(country, seed, rules) => {
              setStartup('loading')
              newGame(country, seed, rules, appointedAt)
            }}
            onStartDraft={(doc, seed, rules) => {
              setStartup('loading')
              newDraftedGame(doc, seed, rules, appointedAt)
            }}
          />
          {draftingRoom}
        </>
      )
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-dossier-felt">
        <div className="font-mono text-[10px] tracking-[0.4em] text-dossier-brass">MINISTRY OF NATIONAL ECONOMY</div>
        <div className="font-dossier text-3xl font-semibold text-dossier-paper">Terrarium</div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-dossier-paper/50">DRAWING THE FIRST SURVEY…</div>
      </div>
    )
  }

  const openCabinet = (group?: CabinetGroup) => {
    if (group) setCabinetGroup(group)
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      cabinetReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      setCabinetOpen(true)
    }
    setCabinetFocusRequest((request) => request + 1)
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] bg-[#22382d]">
      <HeaderBar
        pub={published}
        onStudy={() => setOverlay('study')}
        onManual={() => openManual('briefing')}
        onSettings={() => setOverlay('settings')}
        onCensus={() => setOverlay('census')}
        onFinance={() => setOverlay('finance')}
        onAccounts={() => setOverlay('accounts')}
        onIndustry={() => setOverlay('industry')}
        onVerdict={published.reportCard ? () => setOverlay('verdict') : undefined}
      />
      <div className="relative grid min-h-0 min-w-0 grid-cols-1 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_384px] xl:overflow-hidden">
        <main data-tour="wall" className="min-h-[700px] min-w-0 xl:min-h-0 xl:overflow-hidden">
          <Instruments pub={published} onLedger={() => setOverlay('ledger')} onOpenCapacity={() => openCabinet('STATE CAPACITY')} />
        </main>
        {cabinetOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-[#090b09]/70 xl:hidden"
            aria-label="Close cabinet"
            onClick={closeCabinet}
          />
        )}
        <div
          ref={cabinetDrawerRef}
          role={cabinetOpen ? 'dialog' : undefined}
          aria-modal={cabinetOpen ? 'true' : undefined}
          aria-label={cabinetOpen ? 'Cabinet drawer' : undefined}
          className={`${cabinetOpen ? 'fixed' : 'hidden'} inset-y-0 right-0 z-40 h-full min-h-0 w-full max-w-[430px] overflow-hidden shadow-[-12px_0_30px_rgba(0,0,0,0.35)] xl:static xl:z-auto xl:block xl:max-w-none xl:shadow-none`}
        >
          <ControlRail
            pub={published}
            openGroup={cabinetGroup}
            onOpenGroupChange={setCabinetGroup}
            focusRequest={cabinetFocusRequest}
            onOpenRecord={() => setOverlay('policy')}
            onClose={cabinetOpen ? closeCabinet : undefined}
          />
        </div>
        <Button
          variant="primary"
          className="fixed bottom-10 right-3 z-20 gap-2 shadow-[4px_5px_0_rgba(0,0,0,0.28)] xl:hidden"
          onClick={() => openCabinet()}
          aria-expanded={cabinetOpen}
          aria-controls="cabinet-controls"
        >
          OPEN CABINET <span className="border-l border-dossier-ink/25 pl-2">{published.rules.unlimitedCapital ? '∞' : published.politicalCapital.toFixed(0)} PC</span>
        </Button>
      </div>
      <NewsWire pub={published} onOpen={() => setOverlay('wire')} />

      {overlay === 'ledger' && <LedgerOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'policy' && <PolicyOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'accounts' && <AccountsOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'industry' && <IndustryOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'wire' && <WireOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'study' && <StudyOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'settings' && (
        <SettingsOverlay
          pub={published}
          onClose={() => setOverlay(null)}
          onNewCountry={() => setOverlay('country')}
          onMethodology={() => openManual('figures')}
        />
      )}
      {overlay === 'census' && <CensusOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'finance' && <FinanceOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'election' && <ElectionOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'count' && <ElectionResultOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'verdict' && published.reportCard && (
        <ReportCardOverlay pub={published} card={published.reportCard} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'country' && (
        <CountrySelect
          {...postingRoom}
          onCancel={() => setOverlay(null)}
          onStart={(country, seed, rules) => {
            newGame(country, seed, rules, appointedAt)
            setOverlay(null)
          }}
          onStartDraft={(doc, seed, rules) => {
            newDraftedGame(doc, seed, rules, appointedAt)
            setOverlay(null)
          }}
        />
      )}
      {overlay === 'manual' && (
        <Modal title="MINISTRY HANDBOOK" size="full" onClose={() => setOverlay(null)}>
          <ManualOverlay
            initialChapter={manualChapter}
            onWalkthrough={() => {
              setOverlay(null)
              setTourStep(0)
            }}
          />
        </Modal>
      )}
      {tourStep !== null && overlay === null && (
        <Walkthrough
          index={tourStep}
          onIndex={setTourStep}
          onClose={endTour}
          onHandbook={() => {
            endTour()
            openManual('briefing')
          }}
        />
      )}
      {draftingRoom}
      {__DEV_TOOLS__ && devOpen && <DevConsole onClose={() => setDevOpen(false)} />}
    </div>
  )
}
