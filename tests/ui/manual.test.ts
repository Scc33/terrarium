/**
 * The handbook.
 *
 * The thing that would actually go wrong here is silence: a lever, an
 * instrument or a bloc that exists in the game and has no entry in the manual.
 * The generated chapters are built from the engine's id lists precisely so
 * that cannot happen — this file is what proves the generation is still wired
 * to those lists rather than to a hand-typed copy that once matched them.
 *
 * The rest is shape: a chapter with no prose, a search box that answers a
 * single letter with the entire manual, a chapter id in the spine that nothing
 * renders. Each of those reads as "the game has no answer" rather than as a
 * bug, which is why they are worth a test apiece.
 */

import { describe, expect, it } from 'vitest'
import {
  APPOINTMENTS,
  BLOC_IDS,
  CAPACITY_IDS,
  COHORT_IDS,
  GAME_RULE_IDS,
  INSTITUTION_IDS,
  SECTOR_IDS,
} from '@terrarium/engine'
import { INDICATOR_IDS } from '@terrarium/observation'
import { TICK_ORDER } from '../../packages/engine/src/pipeline/pipeline'
import { BLOC_NAMES, COHORT_NAMES, INSTITUTION_NAMES, NAMES } from '../../packages/ui/src/components/labels'
import { RULE_COPY } from '../../packages/ui/src/gameRules'
import { CAPACITY_COPY, LEVER_COPY, LEVER_GROUPS } from '../../packages/ui/src/levers'
import {
  MANUAL_CHAPTERS,
  MANUAL_CHAPTER_IDS,
  manualChapter,
  searchManual,
  sectionAnchor,
  type ManualChapterId,
} from '../../packages/ui/src/manual'

const chapter = (id: ManualChapterId) => manualChapter(id)
const termsIn = (id: ManualChapterId) =>
  chapter(id).sections.flatMap((section) => (section.entries ?? []).map((entry) => entry.term))
const proseIn = (id: ManualChapterId) =>
  chapter(id)
    .sections.flatMap((section) => [
      section.heading,
      ...(section.body ?? []),
      ...(section.entries ?? []).map((entry) => `${entry.term} ${entry.detail} ${entry.meta ?? ''}`),
    ])
    .join('\n')

describe('every chapter is reachable and says something', () => {
  it('renders exactly the chapters the spine offers, in that order', () => {
    expect(MANUAL_CHAPTERS.map((c) => c.id)).toEqual([...MANUAL_CHAPTER_IDS])
  })

  it('gives each chapter a title, a blurb, and sections with content in them', () => {
    for (const c of MANUAL_CHAPTERS) {
      expect(c.title, c.id).not.toBe('')
      expect(c.blurb.length, c.id).toBeGreaterThan(15)
      expect(c.sections.length, c.id).toBeGreaterThan(0)
      for (const section of c.sections) {
        const hasContent = (section.body?.length ?? 0) > 0 || (section.entries?.length ?? 0) > 0
        expect(hasContent, `${c.id} / ${section.heading}`).toBe(true)
      }
    }
  })

  it('never repeats a section heading inside a chapter', () => {
    // the reader navigates by heading, and React keys on it
    for (const c of MANUAL_CHAPTERS) {
      const headings = c.sections.map((section) => section.heading)
      expect(new Set(headings).size, c.id).toBe(headings.length)
    }
  })
})

describe('the generated chapters follow the engine, not a copy of it', () => {
  it('documents every lever the cabinet can pull', () => {
    const documented = termsIn('cabinet')
    for (const group of LEVER_GROUPS) {
      for (const path of group.paths) {
        expect(documented, path).toContain(LEVER_COPY[path].label)
      }
    }
    // and names the sectors rather than their ids
    for (const sid of SECTOR_IDS) expect(documented).toContain(LEVER_COPY[`subsidies.${sid}`].label)
  })

  it('documents every ministry and every institution, by the name on screen', () => {
    const documented = termsIn('cabinet')
    for (const id of CAPACITY_IDS) expect(documented, id).toContain(CAPACITY_COPY[id].label)
    for (const id of INSTITUTION_IDS) expect(documented, id).toContain(INSTITUTION_NAMES[id].name)
  })

  it('documents every instrument on the wall, with the survey it waits for', () => {
    const documented = termsIn('wall')
    for (const id of INDICATOR_IDS) expect(documented, id).toContain(NAMES[id].plate)
    const prose = proseIn('wall')
    for (const id of INDICATOR_IDS) expect(prose, id).toContain(NAMES[id].needs)
  })

  it('documents every bloc and every class, by the name on screen', () => {
    const documented = termsIn('room')
    for (const id of BLOC_IDS) expect(documented, id).toContain(BLOC_NAMES[id])
    for (const id of COHORT_IDS) expect(documented, id).toContain(COHORT_NAMES[id])
  })

  it('documents every standing order and every appointment', () => {
    const documented = termsIn('run')
    for (const id of GAME_RULE_IDS) expect(documented, id).toContain(RULE_COPY[id].label)
    const prose = proseIn('run')
    for (const appointment of APPOINTMENTS) {
      expect(prose, appointment.name).toContain(appointment.name)
      expect(prose, appointment.name).toContain(String(appointment.year))
    }
  })
})

describe('the methodology chapter answers what the records office promises', () => {
  const prose = proseIn('figures').toLowerCase()

  it('explains the three ways a print is not the truth', () => {
    for (const word of ['lag', 'error band', 'revision']) expect(prose).toContain(word)
  })

  it('says plainly that funding never buys the truth', () => {
    expect(prose).toContain('never buys the truth')
  })

  it('says that the politics reads the published figure', () => {
    expect(prose).toContain('published')
  })
})

describe('search', () => {
  it('refuses a query too short to mean anything', () => {
    // a search box that answers "e" with the whole manual has told the player
    // their query failed in the least legible way available
    expect(searchManual('')).toEqual([])
    expect(searchManual(' a ')).toEqual([])
  })

  it('finds a lever by the name on its slider', () => {
    const hits = searchManual('fuel excise')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((hit) => hit.chapter === 'cabinet')).toBe(true)
  })

  it('finds the methodology by the words a player would use for it', () => {
    for (const query of ['revision', 'error band', 'lag']) {
      const hits = searchManual(query)
      expect(hits.some((hit) => hit.chapter === 'figures'), query).toBe(true)
    }
  })

  it('is case-insensitive and reports where every hit lives', () => {
    const hits = searchManual('CORRIDOR')
    expect(hits.length).toBeGreaterThan(0)
    for (const hit of hits) {
      expect(MANUAL_CHAPTER_IDS).toContain(hit.chapter)
      expect(hit.heading).not.toBe('')
      expect(hit.text.length).toBeGreaterThan(0)
    }
  })
})

describe('jumping to a search result', () => {
  it('gives every section an id that is unique across the whole manual', () => {
    // both ends build this string, so a collision sends a result to the wrong
    // passage and an unstable slug sends it nowhere — both read as "the search
    // opened the chapter cover"
    const anchors = MANUAL_CHAPTERS.flatMap((chapter) =>
      chapter.sections.map((section) => sectionAnchor(chapter.id, section.heading)),
    )
    expect(new Set(anchors).size).toBe(anchors.length)
  })

  it('emits ids a browser will accept, from headings full of punctuation', () => {
    // real headings carry em dashes, middots and slashes
    expect(sectionAnchor('cabinet', 'TAXATION — REVENUE')).toBe('manual-cabinet-taxation-revenue')
    expect(sectionAnchor('figures', 'THE THREE THINGS A PRINT IS NOT')).toBe(
      'manual-figures-the-three-things-a-print-is-not',
    )
    for (const anchor of MANUAL_CHAPTERS.flatMap((c) =>
      c.sections.map((s) => sectionAnchor(c.id, s.heading)),
    )) {
      expect(anchor, anchor).toMatch(/^manual-[a-z0-9-]+$/)
      expect(anchor.endsWith('-'), anchor).toBe(false)
    }
  })

  it('lands every search hit on a section that exists', () => {
    for (const query of ['immigration', 'revision', 'corridor', 'tariff']) {
      for (const hit of searchManual(query)) {
        const chapter = manualChapter(hit.chapter)
        expect(
          chapter.sections.some((section) => section.heading === hit.heading),
          `${query} → ${hit.chapter}/${hit.heading}`,
        ).toBe(true)
      }
    }
  })
})

/**
 * The one chapter that copies a list out of the engine by hand.
 *
 * Everything else the manual enumerates is generated from an id list, so it
 * cannot drift. The order of a quarter cannot be: `TICK_ORDER` lives behind the
 * import boundary — only the worker may touch the engine's pipeline — so the
 * chapter describes sixteen steps in prose the UI cannot derive.
 *
 * A test can cross that boundary where production code may not, which is the
 * same trick `tests/unit/indicator-specs.test.ts` uses one layer down. Adding,
 * removing, renaming or reordering a pipeline step now fails here BY NAME, so
 * the schema-version event that changes the tick order also asks somebody to
 * write the sentence explaining it.
 */
describe('the order of a quarter still matches the engine', () => {
  const TERMS: Record<string, string> = {
    shocks: 'Shocks',
    demography: 'Demography',
    technology: 'Technology',
    world: 'The world',
    finance: 'Finance',
    foreignInvestment: 'Foreign investment',
    production: 'Production',
    environment: 'The environment',
    trade: 'Trade',
    fiscal: 'Fiscal',
    monetary: 'Monetary',
    prices: 'Prices',
    labor: 'Labour',
    cohorts: 'Classes',
    institutions: 'Institutions',
    statistics: 'Statistics',
    politics: 'Politics',
  }

  const section = manualChapter('economy').sections.find(
    (s) => s.heading === 'THE ORDER OF A QUARTER',
  )!
  const entries = section.entries ?? []

  it('names every pipeline step, in the engine’s own order', () => {
    const expected = TICK_ORDER.map((step) => {
      const term = TERMS[step.name]
      expect(term, `pipeline step '${step.name}' has no entry in the handbook`).toBeDefined()
      return term
    })
    expect(entries.map((entry) => entry.term)).toEqual(expected)
  })

  it('numbers them 1..n so the reader can follow the sequence', () => {
    expect(entries.map((entry) => entry.meta)).toEqual(
      TICK_ORDER.map((_, index) => String(index + 1)),
    )
  })

  it('describes each one rather than restating its name', () => {
    for (const entry of entries) {
      expect(entry.detail.length, entry.term).toBeGreaterThan(40)
      expect(entry.detail, entry.term).not.toBe(entry.term)
    }
  })
})
