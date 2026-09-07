/**
 * The scanner's public face: one snapshot of the repository, and the shapes it
 * is made of.
 *
 * The atlas that PAINTS this lives in the game (`ui/src/panels/AtlasOverlay`),
 * which is why this package exports data and types and nothing else. The
 * snapshot is checked in so the game builds without running a TypeScript scan,
 * and `pnpm architecture:check` is what stops the checked-in copy drifting away
 * from the repository it claims to describe.
 */

export { architecture } from './generated/architecture'
export type {
  ArchitectureSeam,
  ArchitectureSnapshot,
  ModuleEdge,
  ModuleNode,
  PackageEdge,
  PackageNode,
  PipelineStep,
  SourceLocation,
  SourceSymbol,
} from './model'
