import Stage from './components/Stage'

export default function App() {
  return (
    <main className="app">
      <header>
        <h1>
          Sky<span>Ink</span>
        </h1>
        <p>Draw in the air. Pinch to paint, release to lift. Everything runs in your browser and no video leaves your device.</p>
      </header>
      <Stage />
    </main>
  )
}
