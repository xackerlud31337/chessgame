import { Chess, validateFen, type Square as CjsSquare } from 'chess.js'
import { pieceToLetter, type PieceCode, type PieceColor, type PieceType, type Placement } from './fen'
import { pickRandom, type Rng } from './random'
import { ALL_SQUARES, type Square } from './squares'

export interface VisionPuzzle {
  fen: string
  placement: Placement
  square: Square
  piece: PieceCode
  /** Squares the piece can move to or capture on. */
  targets: Square[]
}

export type VisionDifficulty = 'easy' | 'medium' | 'hard'

const BLOCKERS: Record<VisionDifficulty, [number, number]> = { easy: [0, 1], medium: [2, 4], hard: [5, 8] }

function putPiece(chess: Chess, placement: Placement, code: PieceCode, sq: Square) {
  chess.put({ type: pieceToLetter(code).toLowerCase() as 'k' | 'q' | 'r' | 'b' | 'n' | 'p', color: code[0] as PieceColor }, sq as CjsSquare)
  placement[sq] = code
}

/**
 * Build a random position with one "hero" piece (N, B, R or Q), both kings
 * and some blockers, where the hero is neither pinned nor its king in check,
 * so chess.js move generation gives exactly its attack/move squares.
 */
export function generateVisionPuzzle(difficulty: VisionDifficulty = 'medium', rng: Rng = Math.random): VisionPuzzle {
  const [minB, maxB] = BLOCKERS[difficulty]
  for (let attempt = 0; attempt < 500; attempt++) {
    const chess = new Chess()
    chess.clear()
    const placement: Placement = {}
    const free = () => ALL_SQUARES.filter((s) => !placement[s])
    const color: PieceColor = rng() < 0.5 ? 'w' : 'b'
    const type = pickRandom<PieceType>(['N', 'B', 'R', 'Q'], undefined, rng)
    const square = pickRandom(free(), undefined, rng)
    putPiece(chess, placement, `${color}${type}`, square)
    putPiece(chess, placement, 'wK', pickRandom(free(), undefined, rng))
    putPiece(chess, placement, 'bK', pickRandom(free(), undefined, rng))
    const blockers = minB + Math.floor(rng() * (maxB - minB + 1))
    for (let i = 0; i < blockers; i++) {
      const t = pickRandom<PieceType>(['P', 'P', 'N', 'B', 'R', 'Q'], undefined, rng)
      const c: PieceColor = rng() < 0.5 ? 'w' : 'b'
      const candidates = free().filter((s) => t !== 'P' || (s[1] !== '1' && s[1] !== '8'))
      putPiece(chess, placement, `${c}${t}`, pickRandom(candidates, undefined, rng))
    }
    const parts = chess.fen().split(' ')
    parts[1] = color
    parts[2] = '-'
    parts[3] = '-'
    const fen = parts.join(' ')
    if (!validateFen(fen).ok) continue
    const c = new Chess(fen)
    if (c.inCheck()) continue
    const oppKing = c.findPiece({ type: 'k', color: color === 'w' ? 'b' : 'w' })[0]
    if (!oppKing || c.isAttacked(oppKing, color)) continue
    // Pinned? Remove the hero and see whether its king is now attacked.
    c.remove(square as CjsSquare)
    if (c.inCheck()) continue
    c.put({ type: type.toLowerCase() as 'q' | 'r' | 'b' | 'n', color }, square as CjsSquare)
    const targets = [...new Set(c.moves({ square: square as CjsSquare, verbose: true }).map((m) => m.to as Square))]
    if (targets.length < 2) continue
    return { fen, placement, square, piece: `${color}${type}`, targets }
  }
  throw new Error('could not generate a piece vision puzzle')
}

/** Compare the user's selection with the targets. */
export function gradeSelection(targets: Square[], selected: Square[]): { hit: Square[]; extra: Square[]; missed: Square[]; perfect: boolean } {
  const t = new Set(targets)
  const s = new Set(selected)
  const hit = selected.filter((x) => t.has(x))
  const extra = selected.filter((x) => !t.has(x))
  const missed = targets.filter((x) => !s.has(x))
  return { hit, extra, missed, perfect: extra.length === 0 && missed.length === 0 }
}
