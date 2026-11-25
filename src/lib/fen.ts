import { Chess, validateFen } from 'chess.js'
import { FILES, type Square } from './squares'

export type PieceColor = 'w' | 'b'
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'
export type PieceCode = `${PieceColor}${PieceType}`
export type Placement = Partial<Record<Square, PieceCode>>

export const PIECE_NAMES: Record<PieceType, string> = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
  P: 'pawn',
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** FEN letter ('K', 'q', ...) -> piece code ('wK', 'bQ'). */
export function letterToPiece(ch: string): PieceCode | null {
  if (!/^[kqrbnpKQRBNP]$/.test(ch)) return null
  const color: PieceColor = ch === ch.toUpperCase() ? 'w' : 'b'
  return `${color}${ch.toUpperCase() as PieceType}`
}

export function pieceToLetter(code: PieceCode): string {
  const type = code[1]
  return code[0] === 'w' ? type : type.toLowerCase()
}

export function describePiece(code: PieceCode): string {
  return `${code[0] === 'w' ? 'white' : 'black'} ${PIECE_NAMES[code[1] as PieceType]}`
}

/** The piece-placement field of a FEN (everything before the first space). */
export function boardPartOf(fen: string): string {
  return fen.trim().split(/\s+/)[0] ?? ''
}

export type ParseResult = { ok: true; placement: Placement } | { ok: false; error: string; rank?: number }

/**
 * Parse just the board part of a FEN into a square -> piece map.
 * Lenient about digit grouping ("44" == "8") but strict about rank width.
 */
export function parseBoardPart(part: string): ParseResult {
  const ranks = part.trim().split('/')
  if (ranks.length !== 8) {
    return { ok: false, error: `Expected 8 ranks separated by "/", got ${ranks.length}.` }
  }
  const placement: Placement = {}
  for (let i = 0; i < 8; i++) {
    const rankNo = 8 - i
    const text = ranks[i]
    let file = 0
    for (const ch of text) {
      if (/[1-8]/.test(ch)) {
        file += Number(ch)
      } else {
        const piece = letterToPiece(ch)
        if (!piece) return { ok: false, error: `Rank ${rankNo}: "${ch}" is not a piece or a digit.`, rank: rankNo }
        if (file > 7) return { ok: false, error: `Rank ${rankNo} has more than 8 squares.`, rank: rankNo }
        placement[`${FILES[file]}${rankNo}` as Square] = piece
        file++
      }
      if (file > 8) return { ok: false, error: `Rank ${rankNo} has more than 8 squares.`, rank: rankNo }
    }
    if (file !== 8) return { ok: false, error: `Rank ${rankNo} has ${file} squares, needs 8.`, rank: rankNo }
  }
  return { ok: true, placement }
}

/** Build a canonical board part from a placement. */
export function placementToBoardPart(placement: Placement): string {
  const rows: string[] = []
  for (let rank = 8; rank >= 1; rank--) {
    let row = ''
    let empty = 0
    for (const f of FILES) {
      const piece = placement[`${f}${rank}` as Square]
      if (piece) {
        if (empty) row += empty
        empty = 0
        row += pieceToLetter(piece)
      } else {
        empty++
      }
    }
    if (empty) row += empty
    rows.push(row)
  }
  return rows.join('/')
}

/** Expand one rank string into exactly 8 chars ('.' for empty) or null if invalid. */
function expandRank(text: string): string | null {
  let out = ''
  for (const ch of text) {
    if (/[1-8]/.test(ch)) out += '.'.repeat(Number(ch))
    else if (letterToPiece(ch)) out += ch
    else return null
  }
  return out.length === 8 ? out : null
}

export interface BoardComparison {
  equal: boolean
  /** Rank number (8..1) of the first mismatch reading top to bottom, or null. */
  firstWrongRank: number | null
  wrongRanks: number[]
}

/**
 * Compare two board parts rank by rank. Digit grouping differences are
 * ignored ("2p5" == "11p5"); anything unparseable counts as wrong.
 */
export function compareBoardParts(expected: string, actual: string): BoardComparison {
  const exp = expected.trim().split('/')
  const act = actual.trim().split('/')
  const wrongRanks: number[] = []
  for (let i = 0; i < 8; i++) {
    const e = expandRank(exp[i] ?? '')
    const a = act[i] === undefined ? null : expandRank(act[i])
    if (e === null || a === null || e !== a) wrongRanks.push(8 - i)
  }
  if (act.length > 8 && wrongRanks.length === 0) wrongRanks.push(1)
  return { equal: wrongRanks.length === 0, firstWrongRank: wrongRanks[0] ?? null, wrongRanks }
}

/** Per-square diff between an expected placement and the user's. */
export function comparePlacements(
  expected: Placement,
  actual: Placement,
): { correct: Square[]; wrong: Square[]; missing: Square[] } {
  const correct: Square[] = []
  const wrong: Square[] = []
  const missing: Square[] = []
  const squares = new Set<Square>([...Object.keys(expected), ...Object.keys(actual)] as Square[])
  for (const sq of squares) {
    const e = expected[sq]
    const a = actual[sq]
    if (e && a === e) correct.push(sq)
    else if (a && a !== e) wrong.push(sq)
    else if (e && !a) missing.push(sq)
  }
  return { correct, wrong, missing }
}

export function isValidFen(fen: string): boolean {
  return validateFen(fen).ok
}

export function loadChess(fen: string): Chess | null {
  try {
    return new Chess(fen)
  } catch {
    return null
  }
}

export function piecesFromFen(fen: string): Placement {
  const r = parseBoardPart(boardPartOf(fen))
  return r.ok ? r.placement : {}
}
