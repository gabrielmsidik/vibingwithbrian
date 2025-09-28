import './App.css'
import LiquidEther from './LiquidEther'
import SnakeGame from './components/SnakeGame'

function App() {
  return (
    <div className="relative min-h-screen w-full text-slate-100 bg-transparent">
      <LiquidEther
            colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.8}
            autoIntensity={3}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
      <main className="relative z-10 py-10 px-4 grid place-items-center">
        <div className="w-full max-w-3xl">
          <h1 className="text-center text-3xl font-semibold tracking-tight mb-6">Snake</h1>
          <SnakeGame />
        </div>
      </main>
    </div>
  )
}

export default App
