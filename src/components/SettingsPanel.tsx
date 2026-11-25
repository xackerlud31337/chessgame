import { useSettings, type RoundLength, type Side } from '../hooks/useSettings'

interface Props {
  /** Which settings to show. Defaults to all. */
  show?: Array<'side' | 'coordinates' | 'roundLength' | 'sound' | 'nameInput'>
  compact?: boolean
}

export function SettingsPanel({ show, compact }: Props) {
  const { settings, update } = useSettings()
  const has = (k: NonNullable<Props['show']>[number]) => !show || show.includes(k)

  return (
    <div className={`settings${compact ? ' compact' : ''}`}>
      {has('side') && (
        <div className="setting">
          <div>
            <span className="name">Play as</span>
            {!compact && <span className="desc">Board orientation. Random re-rolls every round.</span>}
          </div>
          <div className="seg" role="group" aria-label="Play as">
            {(['white', 'black', 'random'] as Side[]).map((s) => (
              <button key={s} type="button" aria-pressed={settings.side === s} onClick={() => update({ side: s })}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
      {has('roundLength') && (
        <div className="setting">
          <div>
            <span className="name">Round length</span>
            {!compact && <span className="desc">Untimed rounds end when you press Finish.</span>}
          </div>
          <div className="seg" role="group" aria-label="Round length">
            {([30, 60, 0] as RoundLength[]).map((n) => (
              <button key={n} type="button" aria-pressed={settings.roundLength === n} onClick={() => update({ roundLength: n })}>
                {n === 0 ? 'Untimed' : `${n}s`}
              </button>
            ))}
          </div>
        </div>
      )}
      {has('coordinates') && (
        <div className="setting">
          <div>
            <span className="name">Show coordinates</span>
            {!compact && <span className="desc">Turn off for a harder drill.</span>}
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.showCoordinates}
              onChange={(e) => update({ showCoordinates: e.target.checked })}
            />
            <span className="track" />
            <span className="sr-only">Show coordinates</span>
          </label>
        </div>
      )}
      {has('nameInput') && (
        <div className="setting">
          <div>
            <span className="name">Answer by</span>
            {!compact && <span className="desc">Typing is harder; multiple choice is the easy mode.</span>}
          </div>
          <div className="seg" role="group" aria-label="Answer by">
            <button type="button" aria-pressed={settings.nameInput === 'type'} onClick={() => update({ nameInput: 'type' })}>
              Typing
            </button>
            <button type="button" aria-pressed={settings.nameInput === 'choice'} onClick={() => update({ nameInput: 'choice' })}>
              4 choices
            </button>
          </div>
        </div>
      )}
      {has('sound') && (
        <div className="setting">
          <div>
            <span className="name">Sound</span>
            {!compact && <span className="desc">Short beeps on correct and wrong answers.</span>}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={settings.sound} onChange={(e) => update({ sound: e.target.checked })} />
            <span className="track" />
            <span className="sr-only">Sound</span>
          </label>
        </div>
      )}
    </div>
  )
}
