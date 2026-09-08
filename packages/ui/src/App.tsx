/**
 * The war room, on one screen: header letterhead, the instrument wall with
 * the ledger and corridor docked, the control rail, and the wire along the
 * bottom. Overlays are ministry paperwork on top — the ledger's full books,
 * the wire's spike, the study, the records office.
 */
import { useCallback, useState } from 'react'
import { useGame } from './store/gameStore'
import { HeaderBar } from './panels/HeaderBar'
import { Instruments } from './panels/Instruments'
import { ControlRail } from './panels/ControlRail'
import { NewsWire } from './panels/NewsWire'
import { LedgerOverlay } from './panels/LedgerOverlay'
import { PolicyOverlay } from './panels/PolicyOverlay'
import { AccountsOverlay } from './panels/AccountsOverlay'
import { IndustryOverlay } from './panels/IndustryOverlay'
import { HouseholdOverlay } from './panels/HouseholdOverlay'
import { LabourOverlay } from './panels/LabourOverlay'
import { WireOverlay } from './panels/WireOverlay'
import { StudyOverlay } from './panels/StudyOverlay'
import { SettingsOverlay } from './panels/SettingsOverlay'
import { ManualOverlay } from './panels/ManualOverlay'
import { AtlasOverlay } from './panels/AtlasOverlay'
import { Walkthrough } from './panels/Walkthrough'
import { ReportCardOverlay } from './panels/ReportCardOverlay'
import { CensusOverlay } from './panels/CensusOverlay'
import { FinanceOverlay } from './panels/FinanceOverlay'
import { ElectionOverlay } from './panels/ElectionOverlay'
import { ElectionResultOverlay } from './panels/ElectionResultOverlay'
import { DevConsole } from './panels/DevConsole'
import { CountrySelect } from './panels/CountrySelect'
import { DraftingRoom } from './panels/DraftingRoom'
import { Button, Modal } from './components/ui'
import { hasBeenBriefed, markBriefed, stepAt } from './walkthrough'
import type { ManualChapterId } from './manual'
import { draftFrom, type CountryDocument } from './countryDraft'
import type { CuratedCountryId } from '@terrarium/engine'
import { useBootSequence } from './shell/useBootSequence'
import { useCabinetChrome } from './shell/useCabinetChrome'
import { useGlobalShortcuts } from './shell/useGlobalShortcuts'
import { useSceneOverlays } from './shell/useSceneOverlays'
/**
 * The paperwork that is only ever `(pub, onClose)` — a table, so opening a new
 * office is a word here rather than a line in a union and a line in the render
 * that have to agree. The overlays below the table are the ones that ask for
 * something else: a report card, a posting, a chapter, a scan.
 */
const PAPERWORK = {
  ledger: LedgerOverlay, policy: PolicyOverlay, accounts: AccountsOverlay, industry: IndustryOverlay,
  households: HouseholdOverlay, wire: WireOverlay, study: StudyOverlay, census: CensusOverlay,
  labour: LabourOverlay, finance: FinanceOverlay, election: ElectionOverlay, count: ElectionResultOverlay,
} as const

type OverlayKind = keyof typeof PAPERWORK | 'settings' | 'verdict' | 'country' | 'manual' | 'atlas' | null

export default function App() {
  const {
    published,
    staged,
    stagedCost,
    stagedAffordable,
    newGame,
    newDraftedGame,
    loadError,
    drafts,
    saveDraft,
    deleteDraft,
    clearStudy,
  } = useGame()
  const [overlay, setOverlay] = useState<OverlayKind>(null)
  /** the draft currently open in the drafting room, and the country it was
   * opened from — the origin is what the DRAFTED marks are measured against */
  const [editing, setEditing] = useState<{ draft: CountryDocument; origin: CountryDocument } | null>(null)
  /** the quarter the player takes office (ADR-0021). It lives here rather than
   * in the posting room because the drafting room's own ACCEPT starts a game
   * too, and a year chosen next door is still the year that player means. */
  const [appointedAt, setAppointedAt] = useState(0)
  /** the handbook opens on whichever chapter the player was reaching for —
   * the records office wants the methodology, the header wants the front */
  const [manualChapter, setManualChapter] = useState<ManualChapterId>('briefing')
  /** the opening walkthrough (#33). `null` is "not touring". Decided once, at
   * mount, from a preference of this BROWSER rather than of the run — a player
   * on their fourth country has been introduced. The card itself renders only
   * inside the war room, so a tour armed here waits for a game to exist
   * without needing an effect to notice one arriving. */
  const [tourStep, setTourStep] = useState<number | null>(() => (hasBeenBriefed() ? null : 0))
  const closeOverlay = useCallback(() => setOverlay(null), [])

  const {
    cabinetOpen,
    cabinetCollapsed,
    cabinetGroup,
    setCabinetGroup,
    cabinetFocusRequest,
    cabinetDrawerRef,
    cabinetExpandRef,
    closeCabinet,
    collapseCabinet,
    openCabinet,
    setCabinetCollapsedPreference,
  } = useCabinetChrome()
  const { startup, setStartup } = useBootSequence()
  const { devOpen, closeDevConsole } = useGlobalShortcuts({ overlay, tourStep, onCloseOverlay: closeOverlay })
  useSceneOverlays({ published, onScene: setOverlay })

  const endTour = useCallback(() => {
    setTourStep(null)
    markBriefed()
  }, [])

  const openManual = (chapter: ManualChapterId) => {
    setManualChapter(chapter)
    setOverlay('manual')
  }

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

  // the `in` guard is the check; the cast is only because narrowing a union of
  // string literals by `in` is not something TypeScript does
  const Paperwork =
    overlay !== null && overlay in PAPERWORK ? PAPERWORK[overlay as keyof typeof PAPERWORK] : null
  const compactDraftCost = stagedCost !== null && Number.isFinite(stagedCost)
    ? `${stagedCost.toFixed(1)} PC`
    : 'PRICING…'

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] bg-[#22382d]">
      <HeaderBar
        pub={published}
        onStudy={() => setOverlay('study')}
        onManual={() => openManual('briefing')}
        onAtlas={() => setOverlay('atlas')}
        onSettings={() => setOverlay('settings')}
        onCensus={() => setOverlay('census')}
        onFinance={() => setOverlay('finance')}
        onAccounts={() => setOverlay('accounts')}
        onIndustry={() => setOverlay('industry')}
        onLabour={() => setOverlay('labour')}
        onHouseholds={() => setOverlay('households')}
        onVerdict={published.reportCard ? () => setOverlay('verdict') : undefined}
      />
      <div
        className={`relative grid min-h-0 min-w-0 grid-cols-1 overflow-y-auto xl:overflow-hidden ${
          cabinetCollapsed
            ? 'xl:grid-cols-[minmax(0,1fr)_44px]'
            : 'xl:grid-cols-[minmax(0,1fr)_384px]'
        }`}
      >
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
          className={`${cabinetOpen ? 'fixed' : 'hidden'} inset-y-0 right-0 z-40 h-full min-h-0 w-full max-w-[430px] overflow-hidden shadow-[-12px_0_30px_rgba(0,0,0,0.35)] xl:static xl:z-auto xl:max-w-none xl:shadow-none ${
            cabinetCollapsed ? 'xl:hidden' : 'xl:block'
          }`}
        >
          <ControlRail
            pub={published}
            openGroup={cabinetGroup}
            onOpenGroupChange={setCabinetGroup}
            focusRequest={cabinetFocusRequest}
            onOpenRecord={() => setOverlay('policy')}
            onClose={cabinetOpen ? closeCabinet : undefined}
            onCollapse={collapseCabinet}
          />
        </div>
        {cabinetCollapsed && (
          <aside
            className="hidden h-full min-h-0 border-l border-dossier-brass/70 bg-[#294235] xl:flex"
            aria-label="Cabinet controls"
          >
            <button
              ref={cabinetExpandRef}
              type="button"
              onClick={() => openCabinet()}
              aria-label="Expand cabinet controls"
              aria-expanded="false"
              aria-controls="cabinet-controls"
              className="flex h-full w-full flex-col items-center gap-3 px-1 py-3 font-mono text-[9px] font-semibold tracking-[0.16em] text-dossier-paper/75 hover:bg-dossier-paper/5 hover:text-dossier-brass focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass"
            >
              <span className="text-lg leading-none text-dossier-brass" aria-hidden="true">‹</span>
              <span className="[writing-mode:vertical-rl] rotate-180">CABINET</span>
              {staged.size > 0 && (
                <span
                  role="status"
                  aria-label={`${staged.size} order${staged.size === 1 ? '' : 's'} drafted, ${compactDraftCost}${stagedAffordable ? ', will enact when the quarter advances' : ', not enough political capital to enact'}`}
                  className="mt-auto flex w-full flex-col items-center gap-1 border-y border-terminal-alert/70 bg-terminal-alert/10 py-2 text-terminal-alert"
                >
                  <span className="text-sm leading-none tabular-nums">{staged.size}</span>
                  <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] tracking-[0.14em]">DRAFTED</span>
                  <span className="text-[7px] tracking-normal">{compactDraftCost}</span>
                  {!stagedAffordable && <span className="text-[7px] tracking-[0.08em]">BLOCKED</span>}
                </span>
              )}
              <span className={`${staged.size === 0 ? 'mt-auto' : ''} text-[8px] tabular-nums text-dossier-brass/80`}>
                {published.rules.unlimitedCapital ? '∞' : published.politicalCapital.toFixed(0)} PC
              </span>
            </button>
          </aside>
        )}
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

      {Paperwork && <Paperwork pub={published} onClose={closeOverlay} />}
      {overlay === 'settings' && (
        <SettingsOverlay
          pub={published}
          onClose={() => setOverlay(null)}
          onNewCountry={() => setOverlay('country')}
          onMethodology={() => openManual('figures')}
        />
      )}
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
            onAtlas={() => setOverlay('atlas')}
          />
        </Modal>
      )}
      {overlay === 'atlas' && <AtlasOverlay onClose={closeOverlay} />}
      {tourStep !== null && overlay === null && (
        <Walkthrough
          index={tourStep}
          onIndex={(next) => {
            const target = stepAt(next)?.target
            // A remembered compact layout must not make the walkthrough point
            // at controls it has kept hidden. Do not move focus: NEXT remains
            // the active tour control while the subject opens beside it.
            if (target === 'cabinet' || target === 'enact') {
              setCabinetCollapsedPreference(false)
            }
            setTourStep(next)
          }}
          onClose={endTour}
          onHandbook={() => {
            endTour()
            openManual('briefing')
          }}
        />
      )}
      {draftingRoom}
      {__DEV_TOOLS__ && devOpen && <DevConsole onClose={closeDevConsole} />}
    </div>
  )
}
