import { Menu } from './components/Menu'
import { StatsView } from './components/StatsView'
import { SettingsPanel } from './components/SettingsPanel'
import { hrefFor, useHashRoute } from './hooks/useHashRoute'
import { useKeyboard } from './hooks/useKeyboard'
import { SettingsProvider, useSettings } from './hooks/useSettings'
import { StatsProvider } from './hooks/useStats'
import { FindSquare } from './modes/FindSquare'
import { NameSquare } from './modes/NameSquare'
import { FenToBoard } from './modes/FenToBoard'
import { BoardToFen } from './modes/BoardToFen'
import { Blindfold } from './modes/Blindfold'
import { PieceVision } from './modes/PieceVision'

function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#f0d9b5" />
      <path fill="#b58863" d="M0 0h8v8H0zm16 0h8v8h-8zM8 8h8v8H8zm16 0h8v8h-8zM0 16h8v8H0zm16 0h8v8h-8zM8 24h8v8H8zm16 0h8v8h-8z" />
      <circle cx="16" cy="16" r="5" fill="#2f7d4f" opacity=".9" />
    </svg>
  )
}

function SoundToggle() {
  const { settings, update } = useSettings()
  return (
    <button
      type="button"
      className="btn ghost icon"
      aria-pressed={settings.sound}
      aria-label={settings.sound ? 'Mute sounds' : 'Unmute sounds'}
      title={settings.sound ? 'Mute' : 'Unmute'}
      onClick={() => update({ sound: !settings.sound })}
    >
      {settings.sound ? '🔊' : '🔇'}
    </button>
  )
}

function Shell() {
  const [route, navigate] = useHashRoute()
  const toMenu = () => navigate('menu')
  useKeyboard({ escape: () => route !== 'menu' && toMenu() })

  let page: React.ReactNode
  switch (route) {
    case 'find':
      page = <FindSquare key="find" onMenu={toMenu} />
      break
    case 'name':
      page = <NameSquare key="name" onMenu={toMenu} />
      break
    case 'fen-to-board':
      page = <FenToBoard key="f2b" onMenu={toMenu} />
      break
    case 'board-to-fen':
      page = <BoardToFen key="b2f" onMenu={toMenu} />
      break
    case 'blindfold':
      page = <Blindfold key="bf" onMenu={toMenu} />
      break
    case 'piece-vision':
      page = <PieceVision key="pv" onMenu={toMenu} />
      break
    case 'stats':
      page = <StatsView />
      break
    case 'settings':
      page = (
        <div className="card">
          <h2>Settings</h2>
          <SettingsPanel />
        </div>
      )
      break
    default:
      page = <Menu />
  }

  return (
    <div className="app">
      <header className="header">
        <a className="brand" href={hrefFor('menu')}>
          <Logo />
          <span>Chess Vision</span>
        </a>
        <nav className="nav" aria-label="Main">
          <a className={`btn ghost${route === 'menu' ? ' active' : ''}`} href={hrefFor('menu')}>
            Drills
          </a>
          <a className={`btn ghost${route === 'stats' ? ' active' : ''}`} href={hrefFor('stats')}>
            Stats
          </a>
          <SoundToggle />
        </nav>
      </header>
      <main className="main">{page}</main>
      <footer className="footer">
        Pieces: cburnett set from Lichess (CC BY-SA 3.0). Built with React + Vite.{' '}
        <a href="https://github.com/xackerlud31337/chessgame">Source</a>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <StatsProvider>
        <Shell />
      </StatsProvider>
    </SettingsProvider>
  )
}
