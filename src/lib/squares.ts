export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

export type File = (typeof FILES)[number]
export type Rank = (typeof RANKS)[number]
export type Square = `${File}${Rank}`
export type Orientation = 'white' | 'black'

/** All 64 squares, a1..h1, a2..h2, ... a8..h8 */
export const ALL_SQUARES: readonly Square[] = RANKS.flatMap((r) =>
  FILES.map((f) => `${f}${r}` as Square),
)

export function isValidSquare(s: string): s is Square {
  return /^[a-h][1-8]$/.test(s)
}

/** 0-based file (a=0) and rank (1=0) indices. */
export function squareToCoords(sq: Square): { file: number; rank: number } {
  return { file: sq.charCodeAt(0) - 97, rank: sq.charCodeAt(1) - 49 }
}

export function coordsToSquare(file: number, rank: number): Square {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new RangeError(`Out of board: file=${file} rank=${rank}`)
  }
  return `${FILES[file]}${RANKS[rank]}` as Square
}

/** a1 is dark; squares where file+rank is odd are light. */
export function isLightSquare(sq: Square): boolean {
  const { file, rank } = squareToCoords(sq)
  return (file + rank) % 2 === 1
}

/**
 * Display index (0 = top-left, 63 = bottom-right) of a square for a given
 * orientation. White: a8 is 0, h1 is 63. Black: h1 is 0, a8 is 63.
 */
export function squareToIndex(sq: Square, orientation: Orientation): number {
  const { file, rank } = squareToCoords(sq)
  const row = orientation === 'white' ? 7 - rank : rank
  const col = orientation === 'white' ? file : 7 - file
  return row * 8 + col
}

export function indexToSquare(index: number, orientation: Orientation): Square {
  if (index < 0 || index > 63) throw new RangeError(`Bad index ${index}`)
  const row = Math.floor(index / 8)
  const col = index % 8
  const rank = orientation === 'white' ? 7 - row : row
  const file = orientation === 'white' ? col : 7 - col
  return coordsToSquare(file, rank)
}

/** The 64 squares in render order (top-left to bottom-right). */
export function displayOrder(orientation: Orientation): Square[] {
  return Array.from({ length: 64 }, (_, i) => indexToSquare(i, orientation))
}

/** File letters in display order, left to right. */
export function fileLabels(orientation: Orientation): File[] {
  return orientation === 'white' ? [...FILES] : [...FILES].reverse()
}

/** Rank digits in display order, top to bottom. */
export function rankLabels(orientation: Orientation): Rank[] {
  return orientation === 'white' ? [...RANKS].reverse() : [...RANKS]
}
