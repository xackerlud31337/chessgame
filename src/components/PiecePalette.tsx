import type { PieceCode } from '../lib/fen'
import { describePiece } from '../lib/fen'
import { PIECE_SRC } from './Piece'

export type Tool = PieceCode | 'erase'

const ORDER: PieceCode[] = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP']

interface Props {
  selected: Tool | null
  onSelect: (tool: Tool | null) => void
  disabled?: boolean
}

export function PiecePalette({ selected, onSelect, disabled }: Props) {
  return (
    <div className="palette" role="group" aria-label="Piece palette">
      {ORDER.map((code) => (
        <button
          key={code}
          type="button"
          className="btn"
          aria-pressed={selected === code}
          aria-label={describePiece(code)}
          title={describePiece(code)}
          disabled={disabled}
          onClick={() => onSelect(selected === code ? null : code)}
        >
          <img src={PIECE_SRC[code]} alt="" draggable={false} />
        </button>
      ))}
      <button
        type="button"
        className="btn erase"
        aria-pressed={selected === 'erase'}
        aria-label="Erase"
        title="Erase"
        disabled={disabled}
        onClick={() => onSelect(selected === 'erase' ? null : 'erase')}
      >
        ✕
      </button>
    </div>
  )
}
