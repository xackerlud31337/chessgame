import { useMemo } from 'react'
import type { Placement } from '../lib/fen'
import { displayOrder, isLightSquare, type Orientation, type Square as SquareName } from '../lib/squares'
import { Square, type Highlight } from './Square'

export interface BoardProps {
  orientation: Orientation
  showCoordinates: boolean
  pieces?: Placement
  highlights?: Partial<Record<SquareName, Highlight>>
  /** Per-square heatmap colours (CSS color strings). */
  heat?: Partial<Record<SquareName, { color: string; label?: string }>>
  onSquareClick?: (square: SquareName) => void
  /** Accessible name for the whole board. */
  label?: string
}

export function Board({ orientation, showCoordinates, pieces, highlights, heat, onSquareClick, label }: BoardProps) {
  const squares = useMemo(() => displayOrder(orientation), [orientation])
  const interactive = Boolean(onSquareClick)

  return (
    <div className="board-wrap">
      <div className="board" role={interactive ? 'group' : 'img'} aria-label={label ?? `Chess board, ${orientation} at the bottom`}>
        {squares.map((sq, i) => {
          const col = i % 8
          const row = Math.floor(i / 8)
          const showFile = showCoordinates && row === 7
          const showRank = showCoordinates && col === 0
          const h = heat?.[sq]
          return (
            <Square
              key={sq}
              square={sq}
              light={isLightSquare(sq)}
              piece={pieces?.[sq]}
              highlight={highlights?.[sq]}
              fileLabel={showFile ? sq[0] : undefined}
              rankLabel={showRank ? sq[1] : undefined}
              heat={h?.color}
              heatLabel={h?.label}
              interactive={interactive}
              onClick={onSquareClick}
            />
          )
        })}
      </div>
    </div>
  )
}
