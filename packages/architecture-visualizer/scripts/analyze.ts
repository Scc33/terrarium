import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

import type {
  ArchitectureSeam,
  ArchitectureSnapshot,
  ModuleEdge,
  ModuleNode,
  PackageEdge,
  PackageNode,
  PipelineStep,
  SourceLocation,
  SourceSymbol,
} from '../src/model'

const ANALYZER_PACKAGE = 'architecture-visualizer'

const PACKAGE_DESCRIPTIONS: Record<string, string> = {
  engine: 'Pure deterministic simulation, action legality, state, and the ordered quarterly tick.',
  observation: 'Presentation-only projection from engine prints to the player-visible contract.',
  ui: 'War-room interface; the worker is its only engine host and components consume published state.',
  runner: 'Headless execution and balance sweeps over the same public engine API.',
  fixtures: 'Shared country recipes and named action scripts used by tests and the runner.',
}

interface ScannedModule extends ModuleNode {
  absolutePath: string
  importSpecifiers: Array<{ specifier: string; typeOnly: boolean }>
  sourceFile: ts.SourceFile
  sourceText: string
}

interface WorkspacePackage {
  id: string
  name: string
  directory: string
  entry: string | undefined
}

function posixPath(path: string): string {
  return path.split(sep).join('/')
}

export function findRepoRoot(start: string): string {
  let cursor = resolve(start)
  while (cursor !== dirname(cursor)) {
    if (existsSync(join(cursor, 'pnpm-workspace.yaml'))) return cursor
    cursor = dirname(cursor)
  }
  throw new Error(`Could not find pnpm-workspace.yaml above ${start}`)
}

function walkTypeScript(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'node_modules') return []
      return walkTypeScript(path)
    }
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return []
    return [path]
  })
}

function workspacePackages(repoRoot: string): WorkspacePackage[] {
  const packagesRoot = join(repoRoot, 'packages')
  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== ANALYZER_PACKAGE)
    .map((entry) => {
      const directory = join(packagesRoot, entry.name)
      const packageJsonPath = join(directory, 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        name?: string
        exports?: { '.': string } | string
      }
      const exportPath =
        typeof packageJson.exports === 'string' ? packageJson.exports : packageJson.exports?.['.']
      const entryPath = exportPath ? resolve(directory, exportPath) : undefined
      return {
        id: entry.name,
        name: packageJson.name ?? entry.name,
        directory,
        entry: entryPath && existsSync(entryPath) ? entryPath : undefined,
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function categoryFor(packageId: string, repoPath: string): string {
  const withoutPackage = repoPath.replace(`packages/${packageId}/`, '')
  if (packageId === 'engine') {
    if (withoutPackage.includes('/pipeline/')) return 'Pipeline'
    if (withoutPackage.includes('/state/')) return 'State'
    if (withoutPackage.includes('/actions/')) return 'Actions'
    if (withoutPackage.includes('/rng/')) return 'Randomness'
    return 'Engine core'
  }
  if (packageId === 'ui') {
    if (withoutPackage.includes('/worker/')) return 'Worker boundary'
    if (withoutPackage.includes('/store/')) return 'Persistence & store'
    if (withoutPackage.includes('/panels/')) return 'Panels'
    if (withoutPackage.includes('/components/')) return 'Components'
    if (withoutPackage.includes('/dev/')) return 'Development tools'
    return 'UI core'
  }
  if (packageId === 'observation') return 'Published projection'
  if (packageId === 'runner') return 'Headless runner'
  if (packageId === 'fixtures') return 'Fixtures'
  return packageId
}

function leadingSummary(source: string): string {
  const match = source.match(/^\s*\/\*\*([\s\S]*?)\*\//)
  if (!match?.[1]) return ''
  const paragraphs = match[1]
    .split(/\n\s*\*?\s*\n/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, '').trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
  const first = paragraphs[0] ?? ''
  return first.length > 280 ? `${first.slice(0, 277).trimEnd()}…` : first
}

function lineAt(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
}

function hasExport(node: ts.Node): boolean {
  return Boolean(ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
}

function scanExports(sourceFile: ts.SourceFile, repoPath: string): SourceSymbol[] {
  const symbols: SourceSymbol[] = []
  const add = (name: ts.Identifier, kind: string) => {
    symbols.push({ name: name.text, kind, path: repoPath, line: lineAt(sourceFile, name) })
  }

  for (const statement of sourceFile.statements) {
    if (!hasExport(statement)) continue
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) add(declaration.name, 'constant')
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      add(statement.name, 'function')
    } else if (ts.isInterfaceDeclaration(statement)) {
      add(statement.name, 'interface')
    } else if (ts.isTypeAliasDeclaration(statement)) {
      add(statement.name, 'type')
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      add(statement.name, 'class')
    } else if (ts.isEnumDeclaration(statement)) {
      add(statement.name, 'enum')
    }
  }
  return symbols
}

function scanImportSpecifiers(sourceFile: ts.SourceFile): Array<{ specifier: string; typeOnly: boolean }> {
  const imports: Array<{ specifier: string; typeOnly: boolean }> = []
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      imports.push({
        specifier: statement.moduleSpecifier.text,
        typeOnly: statement.importClause?.isTypeOnly ?? false,
      })
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      imports.push({ specifier: statement.moduleSpecifier.text, typeOnly: statement.isTypeOnly })
    }
  }
  return imports
}

function resolveFile(candidate: string): string | undefined {
  const candidates = extname(candidate)
    ? [candidate]
    : [`${candidate}.ts`, `${candidate}.tsx`, join(candidate, 'index.ts'), join(candidate, 'index.tsx')]
  return candidates.find((path) => existsSync(path))
}

function resolveImport(
  sourcePath: string,
  specifier: string,
  packageByName: Map<string, WorkspacePackage>,
): string | undefined {
  if (specifier.startsWith('.')) return resolveFile(resolve(dirname(sourcePath), specifier))
  const workspacePackage = [...packageByName.entries()].find(
    ([name]) => specifier === name || specifier.startsWith(`${name}/`),
  )
  if (!workspacePackage) return undefined
  const [name, pkg] = workspacePackage
  const subpath = specifier.slice(name.length).replace(/^\//, '')
  if (!subpath) return pkg.entry
  return resolveFile(join(pkg.directory, subpath))
}

function firstStateProperty(expression: ts.Expression, stateName: string): string | undefined {
  const parts: string[] = []
  let cursor: ts.Expression = expression
  while (ts.isPropertyAccessExpression(cursor) || ts.isElementAccessExpression(cursor)) {
    if (ts.isPropertyAccessExpression(cursor)) parts.unshift(cursor.name.text)
    if (ts.isElementAccessExpression(cursor) && ts.isStringLiteral(cursor.argumentExpression)) {
      parts.unshift(cursor.argumentExpression.text)
    }
    cursor = cursor.expression
  }
  return ts.isIdentifier(cursor) && cursor.text === stateName ? parts[0] : undefined
}

function stateAreasFor(sourceFile: ts.SourceFile, stepName: string): string[] {
  let runMethod: ts.MethodDeclaration | ts.PropertyAssignment | undefined
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== stepName || !declaration.initializer) continue
      if (!ts.isObjectLiteralExpression(declaration.initializer)) continue
      runMethod = declaration.initializer.properties.find(
        (property): property is ts.MethodDeclaration | ts.PropertyAssignment =>
          (ts.isMethodDeclaration(property) || ts.isPropertyAssignment(property)) &&
          property.name !== undefined &&
          ((ts.isIdentifier(property.name) && property.name.text === 'run') ||
            (ts.isStringLiteral(property.name) && property.name.text === 'run')),
      )
    }
  }
  if (!runMethod) return []

  const callable = ts.isMethodDeclaration(runMethod)
    ? runMethod
    : ts.isArrowFunction(runMethod.initializer) || ts.isFunctionExpression(runMethod.initializer)
      ? runMethod.initializer
      : undefined
  const stateParameter = callable?.parameters[0]?.name
  const body = callable?.body
  if (!stateParameter || !ts.isIdentifier(stateParameter) || !body) return []

  const stateName = stateParameter.text
  const areas = new Set<string>()
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const property = firstStateProperty(node, stateName)
      if (property) areas.add(property)
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      ts.isIdentifier(node.initializer) &&
      node.initializer.text === stateName
    ) {
      for (const element of node.name.elements) {
        if (ts.isIdentifier(element.name)) areas.add(element.propertyName?.getText(sourceFile) ?? element.name.text)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(body)
  return [...areas].sort()
}

function sourceLocation(sourceFile: ts.SourceFile, repoPath: string, needle: string): SourceLocation {
  const offset = sourceFile.text.indexOf(needle)
  return {
    path: repoPath,
    line: offset < 0 ? 1 : sourceFile.getLineAndCharacterOfPosition(offset).line + 1,
  }
}

function buildSeams(moduleById: Map<string, ScannedModule>): ArchitectureSeam[] {
  const at = (path: string, needle: string): SourceLocation => {
    const module = moduleById.get(path)
    if (!module) return { path, line: 1 }
    return sourceLocation(module.sourceFile, path, needle)
  }
  return [
    {
      id: 'ordered-fold',
      title: 'One ordered, versioned tick',
      summary: 'Every subsystem receives the state left by the prior step. Reordering the fold changes the model and the save schema.',
      locations: [at('packages/engine/src/pipeline/pipeline.ts', 'TICK_ORDER')],
    },
    {
      id: 'fog-before-politics',
      title: 'The fog is causal',
      summary: 'Statistics creates published prints inside the engine immediately before politics, so political outcomes react to headlines rather than hidden truth.',
      locations: [
        at('packages/engine/src/pipeline/statistics.ts', "name: 'statistics'"),
        at('packages/engine/src/pipeline/politics.ts', "name: 'politics'"),
        at('packages/observation/src/observe.ts', 'export function observe'),
      ],
    },
    {
      id: 'worker-boundary',
      title: 'True state stops at the worker',
      summary: 'The worker owns the engine state and posts the published projection. UI components cannot reach the simulation heap.',
      locations: [
        at('packages/ui/src/worker/sim.worker.ts', 'let state'),
        at('packages/ui/src/worker/protocol.ts', 'export type WorkerReply'),
      ],
    },
    {
      id: 'action-price',
      title: 'Quote and charge share one price',
      summary: 'Political cost is calculated in one engine function and reused both when previewing a decision and when applying it.',
      locations: [
        at('packages/engine/src/actions/apply.ts', 'export function politicalCostOfAction'),
        at('packages/observation/src/observe.ts', 'politicalCostOfAction'),
      ],
    },
    {
      id: 'rng-substreams',
      title: 'Randomness is isolated by subsystem',
      summary: 'Each step receives a seed, step-name, and tick substream, so a new draw in one subsystem does not shift another.',
      locations: [
        at('packages/engine/src/pipeline/pipeline.ts', 'rngFor'),
        at('packages/engine/src/rng/rng.ts', 'export function rngFor'),
      ],
    },
  ]
}

function buildPipeline(
  moduleById: Map<string, ScannedModule>,
  absoluteToId: Map<string, string>,
  packageByName: Map<string, WorkspacePackage>,
): PipelineStep[] {
  const pipelinePath = 'packages/engine/src/pipeline/pipeline.ts'
  const pipelineModule = moduleById.get(pipelinePath)
  if (!pipelineModule) throw new Error(`Missing ${pipelinePath}`)

  const importMap = new Map<string, string>()
  for (const statement of pipelineModule.sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const target = resolveImport(pipelineModule.absolutePath, statement.moduleSpecifier.text, packageByName)
    const targetId = target ? absoluteToId.get(target) : undefined
    if (!targetId) continue
    const bindings = statement.importClause.namedBindings
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) importMap.set(element.name.text, targetId)
    }
  }

  let orderArray: ts.ArrayLiteralExpression | undefined
  for (const statement of pipelineModule.sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'TICK_ORDER' && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) {
        orderArray = declaration.initializer
      }
    }
  }
  if (!orderArray) throw new Error('Could not locate TICK_ORDER array')

  const sourceLines = pipelineModule.sourceText.split(/\r?\n/)
  return orderArray.elements.map((element, index) => {
    if (!ts.isIdentifier(element)) throw new Error('TICK_ORDER must contain named step identifiers')
    const moduleId = importMap.get(element.text)
    const module = moduleId ? moduleById.get(moduleId) : undefined
    if (!moduleId || !module) throw new Error(`Could not resolve pipeline step ${element.text}`)
    const line = lineAt(pipelineModule.sourceFile, element)
    const description = sourceLines[line - 1]?.match(/\/\/\s*(.+)$/)?.[1]?.trim() ?? module.summary
    return {
      order: index + 1,
      name: element.text,
      description,
      moduleId,
      summary: module.summary,
      stateAreas: stateAreasFor(module.sourceFile, element.text),
      dependencies: module.imports.filter((dependency) => dependency !== pipelinePath),
      exports: module.exports,
      path: moduleId,
      line: module.exports.find((symbol) => symbol.name === element.text)?.line ?? 1,
    }
  })
}

export function analyzeRepo(repoRootInput: string): ArchitectureSnapshot {
  const repoRoot = resolve(repoRootInput)
  const packages = workspacePackages(repoRoot)
  const packageByName = new Map(packages.map((pkg) => [pkg.name, pkg]))
  const scanned = packages.flatMap((pkg) =>
    walkTypeScript(pkg.directory).map((absolutePath): ScannedModule => {
      const sourceText = readFileSync(absolutePath, 'utf8')
      const repoPath = posixPath(relative(repoRoot, absolutePath))
      const sourceFile = ts.createSourceFile(
        absolutePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        absolutePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      )
      return {
        id: repoPath,
        label: basename(absolutePath).replace(/\.tsx?$/, ''),
        packageId: pkg.id,
        category: categoryFor(pkg.id, repoPath),
        summary: leadingSummary(sourceText),
        lines: sourceText.split(/\r?\n/).length,
        exports: scanExports(sourceFile, repoPath),
        imports: [],
        importedBy: [],
        path: repoPath,
        line: 1,
        absolutePath,
        importSpecifiers: scanImportSpecifiers(sourceFile),
        sourceFile,
        sourceText,
      }
    }),
  )

  const absoluteToId = new Map(scanned.map((module) => [module.absolutePath, module.id]))
  const moduleById = new Map(scanned.map((module) => [module.id, module]))
  const moduleEdges: ModuleEdge[] = []

  for (const module of scanned) {
    for (const imported of module.importSpecifiers) {
      const absoluteTarget = resolveImport(module.absolutePath, imported.specifier, packageByName)
      const target = absoluteTarget ? absoluteToId.get(absoluteTarget) : undefined
      if (!target || target === module.id) continue
      moduleEdges.push({ source: module.id, target, typeOnly: imported.typeOnly })
    }
  }

  const uniqueEdges = [...new Map(moduleEdges.map((edge) => [`${edge.source}|${edge.target}|${edge.typeOnly}`, edge])).values()]
    .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target))
  for (const edge of uniqueEdges) {
    moduleById.get(edge.source)?.imports.push(edge.target)
    moduleById.get(edge.target)?.importedBy.push(edge.source)
  }

  const packageEdgeMap = new Map<string, PackageEdge>()
  for (const edge of uniqueEdges) {
    const source = moduleById.get(edge.source)?.packageId
    const target = moduleById.get(edge.target)?.packageId
    if (!source || !target || source === target) continue
    const key = `${source}|${target}`
    const existing = packageEdgeMap.get(key) ?? { source, target, count: 0, typeOnlyCount: 0 }
    existing.count += 1
    if (edge.typeOnly) existing.typeOnlyCount += 1
    packageEdgeMap.set(key, existing)
  }

  const moduleNodes: ModuleNode[] = scanned
    .map((module) => ({
      id: module.id,
      label: module.label,
      packageId: module.packageId,
      category: module.category,
      summary: module.summary,
      lines: module.lines,
      exports: module.exports,
      imports: [...module.imports].sort(),
      importedBy: [...module.importedBy].sort(),
      path: module.path,
      line: module.line,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const packageNodes: PackageNode[] = packages.map((pkg) => {
    const owned = moduleNodes.filter((module) => module.packageId === pkg.id)
    return {
      id: pkg.id,
      name: pkg.name,
      description: PACKAGE_DESCRIPTIONS[pkg.id] ?? 'Workspace package.',
      moduleCount: owned.length,
      lines: owned.reduce((total, module) => total + module.lines, 0),
    }
  })

  const revision = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim()
  return {
    version: 1,
    revision,
    repoRoot: '../..',
    packages: packageNodes,
    modules: moduleNodes,
    moduleEdges: uniqueEdges,
    packageEdges: [...packageEdgeMap.values()].sort(
      (a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target),
    ),
    pipeline: buildPipeline(moduleById, absoluteToId, packageByName),
    seams: buildSeams(moduleById),
  }
}
