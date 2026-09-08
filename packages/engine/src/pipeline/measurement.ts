/** The one publication clock shared by scalar and vector surveys. */

export const REVISION_DELAYS = [0, 2, 5] as const
export const PUBLICATION_LAGS = [1, 2] as const
export const lagFor = (capacity: number): number => (capacity >= 0.5 ? 1 : 2)
export const noiseScale = (capacity: number): number => 1 - 0.85 * capacity
