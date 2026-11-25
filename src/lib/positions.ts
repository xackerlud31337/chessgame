import data from '../data/positions.json'
import { shuffle, type Rng } from './random'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type DifficultyChoice = Difficulty | 'mixed'

export interface Position {
  id: number
  difficulty: Difficulty
  fen: string
  name?: string
}

export const POSITIONS: readonly Position[] = data as Position[]

const ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 }

export function positionsFor(choice: DifficultyChoice): Position[] {
  return choice === 'mixed' ? [...POSITIONS] : POSITIONS.filter((p) => p.difficulty === choice)
}

/** `count` distinct positions. Mixed sets are ordered simple → hard. */
export function pickPositions(count: number, choice: DifficultyChoice, rng: Rng = Math.random): Position[] {
  const pool = positionsFor(choice)
  const chosen = shuffle(pool, rng).slice(0, count)
  if (choice === 'mixed') chosen.sort((a, b) => ORDER[a.difficulty] - ORDER[b.difficulty])
  return chosen
}
