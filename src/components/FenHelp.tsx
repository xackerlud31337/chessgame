export function FenHelp() {
  return (
    <details className="help">
      <summary>How FEN works</summary>
      <ul>
        <li>
          The first field is the <strong>piece placement</strong>: ranks from <strong>8 down to 1</strong>, separated by{' '}
          <code>/</code>. Inside a rank, squares run from file <strong>a to h</strong>.
        </li>
        <li>
          <strong>Uppercase</strong> letters are white pieces (<code>K Q R B N P</code>), <strong>lowercase</strong> are black (
          <code>k q r b n p</code>).
        </li>
        <li>
          A <strong>digit</strong> is that many empty squares in a row. <code>8</code> is an empty rank; <code>4P3</code> is four
          empties, a white pawn, three empties.
        </li>
        <li>
          Then: <strong>side to move</strong> (<code>w</code> or <code>b</code>), <strong>castling rights</strong> (<code>KQkq</code> or{' '}
          <code>-</code>), <strong>en passant</strong> target square (or <code>-</code>), the <strong>halfmove clock</strong> and the{' '}
          <strong>fullmove number</strong>.
        </li>
        <li>
          Starting position: <code>rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1</code>
        </li>
      </ul>
    </details>
  )
}
