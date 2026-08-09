export interface SourceLocation {
  path: string
  line: number
}

export interface SourceSymbol extends SourceLocation {
  name: string
  kind: string
}

export interface PackageNode {
  id: string
  name: string
  description: string
  moduleCount: number
  lines: number
}

export interface ModuleNode extends SourceLocation {
  id: string
  label: string
  packageId: string
  category: string
  summary: string
  lines: number
  exports: SourceSymbol[]
  imports: string[]
  importedBy: string[]
}

export interface ModuleEdge {
  source: string
  target: string
  typeOnly: boolean
}

export interface PackageEdge {
  source: string
  target: string
  count: number
  typeOnlyCount: number
}

export interface PipelineStep extends SourceLocation {
  order: number
  name: string
  description: string
  moduleId: string
  summary: string
  stateAreas: string[]
  dependencies: string[]
  exports: SourceSymbol[]
}

export interface ArchitectureSeam {
  id: string
  title: string
  summary: string
  locations: SourceLocation[]
}

export interface ArchitectureSnapshot {
  version: 1
  revision: string
  repoRoot: string
  packages: PackageNode[]
  modules: ModuleNode[]
  moduleEdges: ModuleEdge[]
  packageEdges: PackageEdge[]
  pipeline: PipelineStep[]
  seams: ArchitectureSeam[]
}
