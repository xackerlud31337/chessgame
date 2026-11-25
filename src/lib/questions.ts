import { Chess } from 'chess.js'
import { boardPartOf, describePiece, parseBoardPart, type PieceCode, type PieceColor, type PieceType, type Placement } from './fen'
import { pickRandom, sample, shuffle, type Rng } from './random'
import { ALL_SQUARES, isLightSquare, isValidSquare, type Square } from './squares'

export type PieceAnswer = PieceCode | 'empty'

export type Question =
  | { kind: 'piece-on'; text: string; square: Square; answer: PieceAnswer; choices: PieceAnswer[] }
  | { kind: 'in-check'; text: string; square: Square; answer: boolean }
  | { kind: 'king-square'; text: string; color: PieceColor; answer: Square }
  | { kind: 'count'; text: string; color: PieceColor; type: PieceType; answer: number; choices: number[] }
  | { kind: 'castle'; text: string; color: PieceColor; side: 'kingside' | 'queenside'; answer: boolean }
  | { kind: 'square-color'; text: string; square: Square; answer: 'light' | 'dark' }
  | { kind: 'turn'; text: string; answer: 'white' | 'black' }

export type QuestionKind = Question['kind']

const COLOR_NAME: Record<PieceColor, string> = { w: 'white', b: 'black' }

function kingSquare(placement: Placement, color: PieceColor): Square {
  const sq = (Object.keys(placement) as Square[]).find((s) => placement[s] === `${color}K`)
  if (!sq) throw new Error('no king')
  return sq
}

const ALL_PIECES: PieceCode[] = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP']

/** Generate one blindfold question for a FEN. Pure given the rng. */
export function generateQuestion(fen: string, rng: Rng = Math.random, kinds?: QuestionKind[]): Question {
  const parsed = parseBoardPart(boardPartOf(fen))
  if (!parsed.ok) throw new Error('bad fen')
  const placement = parsed.placement
  const chess = new Chess(fen)
  const turn = chess.turn()
  const occupied = Object.keys(placement) as Square[]
  const pool: QuestionKind[] = kinds ?? ['piece-on', 'piece-on', 'in-check', 'king-square', 'count', 'castle', 'square-color', 'turn']
  const kind = pickRandom(pool, undefined, rng)

  switch (kind) {
    case 'piece-on': {
      // Mostly occupied squares, sometimes an empty one to keep the player honest.
      const askEmpty = rng() < 0.2
      const square = askEmpty
        ? pickRandom(ALL_SQUARES.filter((s) => !placement[s]), undefined, rng)
        : pickRandom(occupied, undefined, rng)
      const answer: PieceAnswer = placement[square] ?? 'empty'
      const others = ALL_PIECES.filter((p) => p !== answer)
      const choices = shuffle([answer, ...sample(others, 3, undefined, rng)], rng)
      if (!choices.includes('empty') && rng() < 0.5) choices[choices.findIndex((c) => c !== answer)] = 'empty'
      return { kind, text: `What is on ${square}?`, square, answer, choices }
    }
    case 'in-check': {
      return {
        kind,
        text: `Is the ${COLOR_NAME[turn]} king in check?`,
        square: kingSquare(placement, turn),
        answer: chess.inCheck(),
      }
    }
    case 'king-square': {
      const color: PieceColor = rng() < 0.5 ? 'w' : 'b'
      return { kind, text: `Which square is the ${COLOR_NAME[color]} king on?`, color, answer: kingSquare(placement, color) }
    }
    case 'count': {
      const color: PieceColor = rng() < 0.5 ? 'w' : 'b'
      const types: PieceType[] = ['P', 'N', 'B', 'R', 'Q']
      const type = pickRandom(types, undefined, rng)
      const answer = occupied.filter((s) => placement[s] === `${color}${type}`).length
      const lo = Math.max(0, answer - 2)
      const choices = [lo, lo + 1, lo + 2, lo + 3]
      const plural = type === 'P' ? 'pawns' : type === 'N' ? 'knights' : type === 'B' ? 'bishops' : type === 'R' ? 'rooks' : 'queens'
      return { kind, text: `How many ${plural} does ${COLOR_NAME[color]} have?`, color, type, answer, choices }
    }
    case 'castle': {
      const color: PieceColor = rng() < 0.5 ? 'w' : 'b'
      const side = rng() < 0.5 ? 'kingside' : 'queenside'
      const rights = chess.getCastlingRights(color)
      const answer = side === 'kingside' ? rights.k : rights.q
      return { kind, text: `Can ${COLOR_NAME[color]} still castle ${side}?`, color, side, answer }
    }
    case 'square-color': {
      const square = pickRandom(occupied, undefined, rng)
      const piece = placement[square]!
      return {
        kind,
        text: `Is the ${describePiece(piece)} on ${square} standing on a light or a dark square?`,
        square,
        answer: isLightSquare(square) ? 'light' : 'dark',
      }
    }
    case 'turn':
      return { kind, text: 'Whose move is it?', answer: turn === 'w' ? 'white' : 'black' }
  }
}

/** Normalise a user answer and compare it with the question's answer. */
export function checkAnswer(q: Question, given: string | boolean | number): boolean {
  switch (q.kind) {
    case 'piece-on':
    case 'square-color':
    case 'turn':
      return given === q.answer
    case 'in-check':
    case 'castle':
      return typeof given === 'boolean' ? given === q.answer : String(given).toLowerCase() === String(q.answer)
    case 'king-square': {
      const s = String(given).trim().toLowerCase()
      return isValidSquare(s) && s === q.answer
    }
    case 'count':
      return Number(given) === q.answer
  }
}

/** Square to highlight when revealing the board after the answer. */
export function revealSquare(q: Question): Square | null {
  switch (q.kind) {
    case 'piece-on':
    case 'in-check':
    case 'square-color':
      return q.square
    case 'king-square':
      return q.answer
    default:
      return null
  }
}

/** Short explanation shown with the reveal. */
export function explain(q: Question): string {
  switch (q.kind) {
    case 'piece-on':
      return q.answer === 'empty' ? `${q.square} is empty.` : `${q.square} has the ${describePiece(q.answer)}.`
    case 'in-check':
      return q.answer ? `Yes, the king on ${q.square} is in check.` : `No, the king on ${q.square} is safe.`
    case 'king-square':
      return `The ${COLOR_NAME[q.color]} king is on ${q.answer}.`
    case 'count':
      return `${COLOR_NAME[q.color][0].toUpperCase() + COLOR_NAME[q.color].slice(1)} has ${q.answer}.`
    case 'castle':
      return q.answer
        ? `Yes. The castling field still contains ${q.color === 'w' ? (q.side === 'kingside' ? 'K' : 'Q') : q.side === 'kingside' ? 'k' : 'q'}.`
        : `No. That right is missing from the castling field.`
    case 'square-color':
      return `${q.square} is a ${q.answer} square.`
    case 'turn':
      return `The field after the board part is "${q.answer[0]}", so it is ${q.answer} to move.`
  }
}
