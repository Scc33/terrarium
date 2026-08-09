import { architecture } from './generated/architecture'
import type { ModuleNode, PipelineStep, SourceLocation } from './model'
import './styles.css'

type View = 'pipeline' | 'system' | 'modules'

const appNode = document.querySelector<HTMLDivElement>('#app')
if (!appNode) throw new Error('Missing #app')
const app: HTMLDivElement = appNode

const moduleById = new Map(architecture.modules.map((module) => [module.id, module]))
const packageById = new Map(architecture.packages.map((pkg) => [pkg.id, pkg]))
const categories = [...new Set(architecture.modules.map((module) => module.category))].sort()

let currentView: View = 'pipeline'
let selectedStep = architecture.pipeline.find((step) => step.name === 'statistics')?.name ?? architecture.pipeline[0]?.name ?? ''
let selectedPackage = architecture.packages.find((pkg) => pkg.id === 'engine')?.id ?? architecture.packages[0]?.id ?? ''
let selectedModule = 'packages/engine/src/pipeline/pipeline.ts'
let moduleQuery = ''
let modulePackage = 'all'
let moduleCategory = 'all'

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function sourceButton(location: SourceLocation, label = `${location.path}:${location.line}`): string {
  return `<button class="source-link" type="button" data-open-path="${escapeHtml(location.path)}" data-open-line="${location.line}">
    <span aria-hidden="true">↗</span><span>${escapeHtml(label)}</span>
  </button>`
}

function moduleButton(moduleId: string, label?: string, className = 'text-link'): string {
  const module = moduleById.get(moduleId)
  if (!module) return `<code>${escapeHtml(moduleId)}</code>`
  return `<button class="${className}" type="button" data-module="${escapeHtml(module.id)}">${escapeHtml(label ?? module.label)}</button>`
}

function stateTags(areas: readonly string[]): string {
  if (areas.length === 0) return '<span class="empty-inline">No direct top-level state references found</span>'
  return `<ul class="tag-list">${areas.map((area) => `<li><code>${escapeHtml(area)}</code></li>`).join('')}</ul>`
}

function header(): string {
  const totalLines = architecture.packages.reduce((sum, pkg) => sum + pkg.lines, 0)
  return `<header class="masthead">
    <div class="brand-block">
      <p class="eyebrow">MINISTRY SYSTEMS OFFICE · CODE MAP</p>
      <h1>Terrarium Engine Atlas</h1>
    </div>
    <dl class="snapshot-stats" aria-label="Analyzed repository summary">
      <div><dt>revision</dt><dd>${escapeHtml(architecture.revision)}</dd></div>
      <div><dt>modules</dt><dd>${formatNumber(architecture.modules.length)}</dd></div>
      <div><dt>imports</dt><dd>${formatNumber(architecture.moduleEdges.length)}</dd></div>
      <div><dt>source lines</dt><dd>${formatNumber(totalLines)}</dd></div>
    </dl>
  </header>`
}

function navigation(): string {
  const tabs: Array<[View, string, string]> = [
    ['pipeline', 'Tick pipeline', `${architecture.pipeline.length} ordered stages`],
    ['system', 'System map', `${architecture.packages.length} runtime packages`],
    ['modules', 'Module explorer', `${architecture.modules.length} source files`],
  ]
  return `<nav class="view-tabs" aria-label="Architecture views">
    ${tabs
      .map(
        ([view, label, detail]) => `<button type="button" data-view="${view}" aria-current="${currentView === view ? 'page' : 'false'}">
          <span>${label}</span><small>${detail}</small>
        </button>`,
      )
      .join('')}
  </nav>`
}

function pipelinePositionNote(step: PipelineStep): string {
  if (step.name === 'statistics') {
    return 'This position is load-bearing: the statistics office makes the public print before politics awards or withdraws political capital.'
  }
  if (step.name === 'institutions') {
    return 'Institutions follows household experience and precedes the published unrest print, connecting the economic machine to the political one.'
  }
  if (step.name === 'shocks') {
    return 'Shocks land first, so every producer, trader, household, and voter lives through the rupture in the same quarter.'
  }
  if (step.name === 'finance') {
    return 'Finance sees the world shock and last quarter’s profits; production then receives the resulting asset price, credit, and crisis state.'
  }
  if (step.name === 'politics') {
    return 'Politics closes the quarter after households, institutions, and the statistics office have all recorded what the government and electorate can know.'
  }
  const previous = architecture.pipeline[step.order - 2]
  const next = architecture.pipeline[step.order]
  if (previous && next) return `Receives the state left by ${previous.name}; ${next.name} is the next subsystem to consume its result.`
  if (next) return `${next.name} is the first subsystem to consume the state this stage leaves behind.`
  if (previous) return `Receives the state left by ${previous.name} and closes the ordered fold.`
  return 'The pipeline order is the model’s within-quarter causal order.'
}

function pipelineView(): string {
  const step = architecture.pipeline.find((candidate) => candidate.name === selectedStep) ?? architecture.pipeline[0]
  if (!step) return '<div class="empty-state">Run the architecture scan to populate the pipeline.</div>'
  const module = moduleById.get(step.moduleId)
  return `<section class="pipeline-layout" aria-label="Ordered simulation pipeline">
    <aside class="pipeline-index">
      <div class="panel-heading">
        <div><p class="section-kicker">ONE QUARTER</p><h2>Ordered fold</h2></div>
        <span class="count-mark">${architecture.pipeline.length}</span>
      </div>
      <ol class="step-list">
        ${architecture.pipeline
          .map(
            (candidate) => `<li class="${candidate.name === step.name ? 'is-current' : ''}">
              <button type="button" data-step="${escapeHtml(candidate.name)}" aria-pressed="${candidate.name === step.name}">
                <span class="step-number">${String(candidate.order).padStart(2, '0')}</span>
                <span class="step-copy"><strong>${escapeHtml(candidate.name)}</strong><small>${escapeHtml(candidate.description)}</small></span>
              </button>
            </li>`,
          )
          .join('')}
      </ol>
    </aside>
    <article class="detail-panel step-detail">
      <div class="detail-heading">
        <div>
          <p class="section-kicker">STAGE ${String(step.order).padStart(2, '0')} OF ${architecture.pipeline.length}</p>
          <h2>${escapeHtml(step.name)}</h2>
          <p class="lede">${escapeHtml(step.description)}</p>
        </div>
        <div class="step-stamp" aria-hidden="true">Q<br>${String(step.order).padStart(2, '0')}</div>
      </div>
      <div class="logic-note">
        <span>WHY HERE</span>
        <p>${escapeHtml(pipelinePositionNote(step))}</p>
      </div>
      ${step.summary ? `<section class="detail-section"><h3>Logic in the source</h3><p>${escapeHtml(step.summary)}</p></section>` : ''}
      <div class="detail-columns">
        <section class="detail-section">
          <h3>State regions referenced</h3>
          ${stateTags(step.stateAreas)}
        </section>
        <section class="detail-section">
          <h3>Direct code dependencies</h3>
          <div class="dependency-list">
            ${step.dependencies.length ? step.dependencies.map((id) => moduleButton(id, moduleById.get(id)?.label)).join('') : '<span class="empty-inline">No internal module imports</span>'}
          </div>
        </section>
      </div>
      <section class="detail-section source-section">
        <h3>Source record</h3>
        ${sourceButton(step)}
        ${module ? `<span class="source-meta">${module.lines} lines · ${module.exports.length} exports</span>` : ''}
      </section>
    </article>
  </section>`
}

function packageNode(packageId: string): string {
  const pkg = packageById.get(packageId)
  if (!pkg) return ''
  const outgoing = architecture.packageEdges.filter((edge) => edge.source === packageId).reduce((sum, edge) => sum + edge.count, 0)
  return `<button class="package-node package-${escapeHtml(packageId)} ${selectedPackage === packageId ? 'is-selected' : ''}" type="button" data-package="${escapeHtml(packageId)}" aria-pressed="${selectedPackage === packageId}">
    <span class="package-name">${escapeHtml(pkg.name.replace('@terrarium/', ''))}</span>
    <span class="package-metrics">${pkg.moduleCount} modules · ${formatNumber(pkg.lines)} lines</span>
    <span class="package-role">${escapeHtml(pkg.description)}</span>
    <span class="package-import-count">${outgoing} cross-package imports</span>
  </button>`
}

function edgeLabel(source: string, target: string): string {
  const edge = architecture.packageEdges.find((candidate) => candidate.source === source && candidate.target === target)
  if (!edge) return 'no imports'
  return `${edge.count} import${edge.count === 1 ? '' : 's'}${edge.typeOnlyCount ? ` · ${edge.typeOnlyCount} type-only` : ''}`
}

function packageFlow(): string {
  return `<div class="package-flow" aria-label="Workspace package dependency direction">
    <div class="flow-primary">
      ${packageNode('ui')}
      <div class="flow-arrow"><span>${escapeHtml(edgeLabel('ui', 'observation'))}</span><b aria-hidden="true">→</b></div>
      ${packageNode('observation')}
      <div class="flow-arrow"><span>${escapeHtml(edgeLabel('observation', 'engine'))}</span><b aria-hidden="true">→</b></div>
      ${packageNode('engine')}
    </div>
    <div class="flow-secondary">
      <div class="secondary-origin">${packageNode('runner')}<div class="secondary-arrow"><span>${escapeHtml(edgeLabel('runner', 'engine'))} into engine</span><b aria-hidden="true">↗</b></div></div>
      <div class="secondary-origin">${packageNode('fixtures')}<div class="secondary-arrow"><span>${escapeHtml(edgeLabel('fixtures', 'engine'))} into engine</span><b aria-hidden="true">↗</b></div></div>
    </div>
  </div>`
}

function selectedPackageDetail(): string {
  const pkg = packageById.get(selectedPackage) ?? architecture.packages[0]
  if (!pkg) return ''
  const modules = architecture.modules.filter((module) => module.packageId === pkg.id)
  const categoriesInPackage = [...new Set(modules.map((module) => module.category))]
  const outgoing = architecture.packageEdges.filter((edge) => edge.source === pkg.id)
  const incoming = architecture.packageEdges.filter((edge) => edge.target === pkg.id)
  return `<aside class="package-detail">
    <p class="section-kicker">SELECTED PACKAGE</p>
    <h2>${escapeHtml(pkg.name)}</h2>
    <p>${escapeHtml(pkg.description)}</p>
    <dl class="package-facts">
      <div><dt>Modules</dt><dd>${pkg.moduleCount}</dd></div>
      <div><dt>Source lines</dt><dd>${formatNumber(pkg.lines)}</dd></div>
      <div><dt>Categories</dt><dd>${categoriesInPackage.length}</dd></div>
    </dl>
    <section><h3>Dependency traffic</h3>
      <ul class="traffic-list">
        ${outgoing.map((edge) => `<li><b>imports</b> ${escapeHtml(packageById.get(edge.target)?.name ?? edge.target)} <span>${edge.count}</span></li>`).join('')}
        ${incoming.map((edge) => `<li><b>used by</b> ${escapeHtml(packageById.get(edge.source)?.name ?? edge.source)} <span>${edge.count}</span></li>`).join('')}
        ${outgoing.length + incoming.length === 0 ? '<li>No cross-package edges</li>' : ''}
      </ul>
    </section>
    <button class="inspect-package" type="button" data-inspect-package="${escapeHtml(pkg.id)}">Inspect its ${modules.length} modules →</button>
  </aside>`
}

function seams(): string {
  return `<section class="seams-section">
    <div class="panel-heading"><div><p class="section-kicker">LOAD-BEARING CONNECTIONS</p><h2>Architectural seams</h2></div></div>
    <div class="seam-grid">
      ${architecture.seams
        .map(
          (seam, index) => `<article class="seam-record">
            <span class="seam-number">${String(index + 1).padStart(2, '0')}</span>
            <h3>${escapeHtml(seam.title)}</h3>
            <p>${escapeHtml(seam.summary)}</p>
            <div>${seam.locations.map((location) => sourceButton(location, `${location.path.split('/').at(-1)}:${location.line}`)).join('')}</div>
          </article>`,
        )
        .join('')}
    </div>
  </section>`
}

function systemView(): string {
  return `<section class="system-layout" aria-label="System dependency map">
    <div class="system-main">
      <div class="panel-heading system-title">
        <div><p class="section-kicker">DEPENDENCY DIRECTION</p><h2>Interface → projection → engine</h2></div>
        <p>Arrows are counted from resolved production imports.</p>
      </div>
      ${packageFlow()}
      ${seams()}
    </div>
    ${selectedPackageDetail()}
  </section>`
}

function filteredModules(): readonly ModuleNode[] {
  const query = moduleQuery.trim().toLowerCase()
  return architecture.modules.filter((module) => {
    if (modulePackage !== 'all' && module.packageId !== modulePackage) return false
    if (moduleCategory !== 'all' && module.category !== moduleCategory) return false
    if (!query) return true
    return `${module.id} ${module.label} ${module.summary} ${module.exports.map((symbol) => symbol.name).join(' ')}`
      .toLowerCase()
      .includes(query)
  })
}

function moduleList(): string {
  const matches = filteredModules()
  return `<div class="module-results-heading"><span>${matches.length} matching modules</span></div>
    <ul class="module-list">
      ${matches
        .map(
          (module) => `<li><button type="button" data-module="${escapeHtml(module.id)}" aria-pressed="${module.id === selectedModule}">
            <span><strong>${escapeHtml(module.label)}</strong><small>${escapeHtml(module.category)}</small></span>
            <code>${escapeHtml(module.id.replace(`packages/${module.packageId}/`, ''))}</code>
          </button></li>`,
        )
        .join('')}
    </ul>`
}

function relationList(ids: readonly string[], empty: string): string {
  if (ids.length === 0) return `<p class="empty-inline">${escapeHtml(empty)}</p>`
  return `<ul class="relation-list">${ids.map((id) => `<li>${moduleButton(id, id)}</li>`).join('')}</ul>`
}

function moduleDetail(): string {
  const module = moduleById.get(selectedModule) ?? architecture.modules[0]
  if (!module) return '<article class="detail-panel empty-state">Run the architecture scan to populate modules.</article>'
  return `<article class="detail-panel module-detail">
    <div class="detail-heading compact">
      <div>
        <p class="section-kicker">${escapeHtml(module.packageId)} · ${escapeHtml(module.category)}</p>
        <h2>${escapeHtml(module.label)}</h2>
        <p class="path-line">${escapeHtml(module.id)}</p>
      </div>
      <span class="line-count">${module.lines}<small>lines</small></span>
    </div>
    ${module.summary ? `<p class="module-summary">${escapeHtml(module.summary)}</p>` : '<p class="module-summary empty-inline">No leading module note. Read the exports and import neighborhood below.</p>'}
    <section class="detail-section">
      <div class="section-heading-row"><h3>Exported surface</h3>${sourceButton(module, 'open source')}</div>
      ${
        module.exports.length
          ? `<table class="symbol-table"><thead><tr><th>Symbol</th><th>Kind</th><th>Line</th></tr></thead><tbody>${module.exports
              .map(
                (symbol) => `<tr><td><code>${escapeHtml(symbol.name)}</code></td><td>${escapeHtml(symbol.kind)}</td><td>${sourceButton(symbol, String(symbol.line))}</td></tr>`,
              )
              .join('')}</tbody></table>`
          : '<p class="empty-inline">No named exports</p>'
      }
    </section>
    <div class="detail-columns module-relations">
      <section class="detail-section"><h3>Imports (${module.imports.length})</h3>${relationList(module.imports, 'No internal imports')}</section>
      <section class="detail-section"><h3>Imported by (${module.importedBy.length})</h3>${relationList(module.importedBy, 'No internal consumers')}</section>
    </div>
  </article>`
}

function modulesView(): string {
  return `<section class="modules-layout" aria-label="Source module explorer">
    <aside class="module-browser">
      <div class="panel-heading"><div><p class="section-kicker">CODE INDEX</p><h2>Modules</h2></div></div>
      <div class="module-filters">
        <label><span>Search paths, notes, exports</span><input id="module-search" type="search" value="${escapeHtml(moduleQuery)}" placeholder="e.g. politicalCostOfAction" /></label>
        <div class="filter-row">
          <label><span>Package</span><select id="package-filter">
            <option value="all">All packages</option>
            ${architecture.packages.map((pkg) => `<option value="${escapeHtml(pkg.id)}" ${modulePackage === pkg.id ? 'selected' : ''}>${escapeHtml(pkg.id)}</option>`).join('')}
          </select></label>
          <label><span>Category</span><select id="category-filter">
            <option value="all">All categories</option>
            ${categories.map((category) => `<option value="${escapeHtml(category)}" ${moduleCategory === category ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}
          </select></label>
        </div>
      </div>
      <div id="module-results" class="module-results">${moduleList()}</div>
    </aside>
    ${moduleDetail()}
  </section>`
}

function render(): void {
  const content = currentView === 'pipeline' ? pipelineView() : currentView === 'system' ? systemView() : modulesView()
  app.innerHTML = `<div class="atlas-shell">${header()}${navigation()}<main class="atlas-main">${content}</main><footer><span>GENERATED FROM TYPESCRIPT AST</span><span>TICK ORDER · IMPORTS · EXPORTS · STATE REFERENCES</span></footer></div>`
  if (currentView === 'pipeline') {
    document.querySelector<HTMLButtonElement>(`[data-step="${selectedStep}"]`)?.scrollIntoView({ block: 'nearest' })
  }
}

function renderModuleResults(): void {
  const matches = filteredModules()
  if (matches.length && !matches.some((module) => module.id === selectedModule)) {
    selectedModule = matches[0]?.id ?? selectedModule
  }
  const target = document.querySelector<HTMLDivElement>('#module-results')
  if (target) target.innerHTML = moduleList()
  const detail = document.querySelector<HTMLElement>('.module-detail')
  if (detail) detail.outerHTML = moduleDetail()
}

async function openSource(path: string, line: number, button: HTMLButtonElement): Promise<void> {
  const editorPath = `${architecture.repoRoot}/${path}:${line}:1`
  try {
    const response = await fetch(`/__open-in-editor?file=${encodeURIComponent(editorPath)}`)
    if (!response.ok) throw new Error('Editor endpoint unavailable')
  } catch {
    await navigator.clipboard.writeText(`${path}:${line}`)
    const original = button.textContent
    button.textContent = 'copied source location'
    window.setTimeout(() => {
      button.textContent = original
    }, 1400)
  }
}

app.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest<HTMLButtonElement>('button')
  if (!button) return
  const view = button.dataset.view as View | undefined
  if (view) {
    currentView = view
    render()
    return
  }
  if (button.dataset.step) {
    selectedStep = button.dataset.step
    render()
    return
  }
  if (button.dataset.package) {
    selectedPackage = button.dataset.package
    render()
    return
  }
  if (button.dataset.inspectPackage) {
    modulePackage = button.dataset.inspectPackage
    moduleCategory = 'all'
    moduleQuery = ''
    selectedModule = architecture.modules.find((module) => module.packageId === modulePackage)?.id ?? selectedModule
    currentView = 'modules'
    render()
    return
  }
  if (button.dataset.module) {
    selectedModule = button.dataset.module
    currentView = 'modules'
    render()
    return
  }
  if (button.dataset.openPath) {
    void openSource(button.dataset.openPath, Number(button.dataset.openLine ?? 1), button)
  }
})

app.addEventListener('input', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || target.id !== 'module-search') return
  moduleQuery = target.value
  renderModuleResults()
})

app.addEventListener('change', (event) => {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  if (target.id === 'package-filter') modulePackage = target.value
  if (target.id === 'category-filter') moduleCategory = target.value
  renderModuleResults()
})

app.addEventListener('keydown', (event) => {
  const target = event.target
  if (!(target instanceof HTMLButtonElement) || !target.dataset.step) return
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  const index = architecture.pipeline.findIndex((step) => step.name === target.dataset.step)
  const delta = event.key === 'ArrowDown' ? 1 : -1
  const next = architecture.pipeline[(index + delta + architecture.pipeline.length) % architecture.pipeline.length]
  if (!next) return
  selectedStep = next.name
  render()
  document.querySelector<HTMLButtonElement>(`[data-step="${next.name}"]`)?.focus()
})

render()
