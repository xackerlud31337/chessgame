import { Chess, validateFen } from 'chess.js'
import { writeFileSync } from 'node:fs'

// Deterministic PRNG so the file is reproducible.
let seed = 20261125
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 2 ** 32
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const FILES = 'abcdefgh'
const squares = []
for (let r = 1; r <= 8; r++) for (const f of FILES) squares.push(`${f}${r}`)

const named = [
  ['Starting position', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'],
  ['After 1.e4', 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'],
  ['After 1.e4 e5', 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'],
  ['After 1.e4 c5 (Sicilian)', 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'],
  ['After 1.e4 e6 (French)', 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'],
  ['After 1.d4 d5 2.c4 (Queen\'s Gambit)', 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2'],
  ['Ruy Lopez', 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'],
  ['Italian Game', 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'],
  ['King\'s Indian setup', 'rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3'],
  ['Scholar\'s mate', 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4'],
  ['Scandinavian', 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2'],
  ['Caro-Kann', 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'],
  ['Pirc', 'rnbqkbnr/ppp1pppp/3p4/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'],
  ['London System', 'rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 2 2'],
  ['English Opening', 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1'],
]

function sideNotToMoveSafe(chess) {
  const turn = chess.turn()
  const other = turn === 'w' ? 'b' : 'w'
  const kingSq = chess.findPiece({ type: 'k', color: other })[0]
  return kingSq && !chess.isAttacked(kingSq, turn)
}

function randomPosition(pieceCount, allowPawns) {
  for (let tries = 0; tries < 200; tries++) {
    const chess = new Chess()
    chess.clear()
    const used = new Set()
    const place = (type, color) => {
      for (let i = 0; i < 100; i++) {
        const sq = pick(squares)
        if (used.has(sq)) continue
        if (type === 'p' && (sq[1] === '1' || sq[1] === '8')) continue
        used.add(sq)
        chess.put({ type, color }, sq)
        return
      }
    }
    place('k', 'w')
    place('k', 'b')
    const pool = allowPawns ? ['q', 'r', 'r', 'b', 'b', 'n', 'n', 'p', 'p', 'p', 'p', 'p'] : ['q', 'r', 'b', 'n']
    for (let i = 0; i < pieceCount - 2; i++) place(pick(pool), rnd() < 0.5 ? 'w' : 'b')
    // random side to move
    let fen = chess.fen().split(' ')
    fen[1] = rnd() < 0.5 ? 'w' : 'b'
    fen[2] = '-'
    fen[3] = '-'
    fen = fen.join(' ')
    if (!validateFen(fen).ok) continue
    const c = new Chess(fen)
    if (!sideNotToMoveSafe(c)) continue
    if (c.isGameOver()) continue
    return fen
  }
  throw new Error('could not generate')
}

const positions = []
let id = 1
// easy: 3-4 pieces, no pawns
for (let i = 0; i < 35; i++) positions.push({ id: id++, difficulty: 'easy', fen: randomPosition(3 + (i % 2), false) })
// medium: 5-9 pieces, pawns allowed
for (let i = 0; i < 35; i++) positions.push({ id: id++, difficulty: 'medium', fen: randomPosition(5 + (i % 5), true) })
// hard: named openings + 12-18 piece random positions
for (const [name, fen] of named) {
  if (!validateFen(fen).ok) throw new Error('bad named fen ' + name)
  const c = new Chess(fen)
  if (!sideNotToMoveSafe(c)) throw new Error('side not to move in check: ' + name)
  positions.push({ id: id++, difficulty: 'hard', name, fen })
}
for (let i = 0; i < 20; i++) positions.push({ id: id++, difficulty: 'hard', fen: randomPosition(12 + (i % 7), true) })

const unique = new Set(positions.map((p) => p.fen))
if (unique.size !== positions.length) throw new Error('duplicate fen')
writeFileSync('src/data/positions.json', JSON.stringify(positions, null, 2) + '\n')
console.log(positions.length, 'positions', { easy: 35, medium: 35, hard: positions.length - 70 })
