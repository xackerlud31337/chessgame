import type { PieceCode } from '../lib/fen'
import { describePiece } from '../lib/fen'
import wK from '../assets/pieces/wK.svg'
import wQ from '../assets/pieces/wQ.svg'
import wR from '../assets/pieces/wR.svg'
import wB from '../assets/pieces/wB.svg'
import wN from '../assets/pieces/wN.svg'
import wP from '../assets/pieces/wP.svg'
import bK from '../assets/pieces/bK.svg'
import bQ from '../assets/pieces/bQ.svg'
import bR from '../assets/pieces/bR.svg'
import bB from '../assets/pieces/bB.svg'
import bN from '../assets/pieces/bN.svg'
import bP from '../assets/pieces/bP.svg'

export const PIECE_SRC: Record<PieceCode, string> = { wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, bN, bP }

export function Piece({ code, className }: { code: PieceCode; className?: string }) {
  return <img className={className ?? 'piece'} src={PIECE_SRC[code]} alt={describePiece(code)} draggable={false} />
}
