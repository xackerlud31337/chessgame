import { memo } from 'react'
import type { PieceCode } from '../lib/fen'
import type { Square as SquareName } from '../lib/squares'
import { Piece } from './Piece'

export type Highlight = 'correct' | 'wrong' | 'hint' | 'selected'

interface Props {
  square: SquareName
  light: boolean
  piece?: PieceCode
  highlight?: Highlight
  /** File letter to draw in the corner (bottom row only). */
  fileLabel?: string
  /** Rank digit to draw in the corner (left column only). */
  rankLabel?: string
  /** Heatmap colour; when set the square is non-interactive. */
  heat?: string
  heatLabel?: string
  interactive: boolean
  onClick?: (square: SquareName) => void
}

export const Square = memo(function Square({
  square,
  light,
  piece,
  highlight,
  fileLabel,
  rankLabel,
  heat,
  heatLabel,
  interactive,
  onClick,
}: Props) {
  const classes = ['square', light ? 'light' : 'dark', interactive ? '' : 'static', heat ? 'heat' : ''].filter(Boolean).join(' ')
  const content = (
    <>
      {rankLabel && <span className="coord rank">{rankLabel}</span>}
      {fileLabel && <span className="coord file">{fileLabel}</span>}
      {piece && <Piece code={piece} />}
      {heatLabel && <span className="heat-label">{heatLabel}</span>}
    </>
  )
  const style = heat ? ({ '--heat': heat } as React.CSSProperties) : undefined
  if (!interactive) {
    return (
      <div className={classes} data-hl={highlight} data-square={square} aria-label={square} role="img" style={style}>
        {content}
      </div>
    )
  }
  return (
    <button
      type="button"
      className={classes}
      data-hl={highlight}
      data-square={square}
      aria-label={square}
      style={style}
      onClick={() => onClick?.(square)}
    >
      {content}
    </button>
  )
})
