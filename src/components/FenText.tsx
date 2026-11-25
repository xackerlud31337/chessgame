import { boardPartOf } from '../lib/fen'

interface Props {
  fen: string
  /** Rank numbers (8..1) to mark as wrong. */
  wrongRanks?: number[]
  /** Mark all ranks not in wrongRanks as ok. */
  showOk?: boolean
  /** Hide the fields after the board part. */
  boardOnly?: boolean
}

/** A FEN string with the board part split into rank spans for highlighting. */
export function FenText({ fen, wrongRanks = [], showOk = false, boardOnly = false }: Props) {
  const board = boardPartOf(fen)
  const rest = fen.trim().slice(board.length)
  const ranks = board.split('/')
  return (
    <div className="fen" aria-label="FEN">
      {ranks.map((r, i) => {
        const rankNo = 8 - i
        const wrong = wrongRanks.includes(rankNo)
        const cls = wrong ? 'rank wrong' : showOk ? 'rank ok' : 'rank'
        return (
          <span key={i}>
            <span className={cls} title={`Rank ${rankNo}`}>
              {r}
            </span>
            {i < 7 && '/'}
          </span>
        )
      })}
      {!boardOnly && <span className="rest">{rest}</span>}
    </div>
  )
}
