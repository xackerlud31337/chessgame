import { ALL_SQUARES, type Square } from './squares'

export type Rng = () => number

/** Pick a random element, optionally excluding one value. */
export function pickRandom<T>(items: readonly T[], exclude?: T, rng: Rng = Math.random): T {
  if (items.length === 0) throw new Error('pickRandom: empty list')
  const pool = exclude === undefined ? items : items.filter((x) => x !== exclude)
  if (pool.length === 0) return items[0]
  return pool[Math.floor(rng() * pool.length)]
}

/** Random square, never equal to `previous`. */
export function randomSquare(previous?: Square, rng: Rng = Math.random): Square {
  return pickRandom(ALL_SQUARES, previous, rng)
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** `count` distinct random items from `items`, excluding `exclude`. */
export function sample<T>(items: readonly T[], count: number, exclude?: T, rng: Rng = Math.random): T[] {
  const pool = exclude === undefined ? items : items.filter((x) => x !== exclude)
  return shuffle(pool, rng).slice(0, count)
}

/**
 * Multiple-choice distractors that resemble the answer: neighbours on the
 * same file/rank and mirrored squares, padded with random ones.
 */
export function squareDistractors(answer: Square, count: number, rng: Rng = Math.random): Square[] {
  const file = answer.charCodeAt(0) - 97
  const rank = answer.charCodeAt(1) - 49
  const near: Square[] = []
  const push = (f: number, r: number) => {
    if (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const sq = `${String.fromCharCode(97 + f)}${r + 1}` as Square
      if (sq !== answer && !near.includes(sq)) near.push(sq)
    }
  }
  push(file + 1, rank)
  push(file - 1, rank)
  push(file, rank + 1)
  push(file, rank - 1)
  push(7 - file, rank)
  push(file, 7 - rank)
  push(rank, file) // transposed (b5 -> e2)
  const chosen = shuffle(near, rng).slice(0, count)
  if (chosen.length < count) {
    const extra = sample(ALL_SQUARES.filter((s) => s !== answer && !chosen.includes(s)), count - chosen.length, undefined, rng)
    chosen.push(...extra)
  }
  return chosen
}

/** Small deterministic PRNG (mulberry32) for reproducible picks from a seed. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}
