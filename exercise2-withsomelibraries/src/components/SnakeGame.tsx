import { useEffect, useRef, useState } from 'react'

type Point = { x: number; y: number }

const GRID_SIZE = 20
const TICK_MS_DEFAULT = 120
const MIN_TICK_MS = 70
const SPEEDUP_EVERY = 5
const SPEEDUP_DELTA = 5

const Keys: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 },
}

function randInt(max: number) { return Math.floor(Math.random() * max) }
function coordsEq(a: Point, b: Point) { return a.x === b.x && a.y === b.y }
function withinBounds(x: number, y: number) { return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE }

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [status, setStatus] = useState<string>('Press Arrow Keys or WASD to start')
  const startedRef = useRef(false)
  const pausedRef = useRef(false)
  const gameOverRef = useRef(false)
  const tickRef = useRef<number>(TICK_MS_DEFAULT)
  const timerRef = useRef<number | null>(null)
  const dirRef = useRef<Point>({ x: 1, y: 0 })
  const nextDirRef = useRef<Point>({ x: 1, y: 0 })
  const snakeRef = useRef<Point[]>([])
  const foodRef = useRef<Point>({ x: 10, y: 10 })

  useEffect(() => {
    try {
      const v = localStorage.getItem('snake.best')
      setBest(v ? Math.max(0, Number(v) || 0) : 0)
    } catch {}
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const setupCanvas = () => {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
      const logical = Math.min(canvas.clientWidth || 480, 560 - 20)
      const size = Math.round(logical)
      const cell = Math.floor(size / GRID_SIZE)
      const renderSize = cell * GRID_SIZE
      canvas.width = renderSize * dpr
      canvas.height = renderSize * dpr
      canvas.style.width = renderSize + 'px'
      canvas.style.height = renderSize + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const resetGame = () => {
      startedRef.current = false
      pausedRef.current = false
      gameOverRef.current = false
      setScore(0)
      tickRef.current = TICK_MS_DEFAULT
      nextDirRef.current = { x: 1, y: 0 }
      dirRef.current = { x: 1, y: 0 }
      const mid = Math.floor(GRID_SIZE / 2)
      snakeRef.current = [ { x: mid - 1, y: mid }, { x: mid - 2, y: mid } ]
      spawnFood()
      setStatus('Press Arrow Keys or WASD to start')
    }

    const spawnFood = () => {
      let x = 0, y = 0
      const snake = snakeRef.current
      const snakeIncludes = (xi: number, yi: number) => snake.some(s => s.x === xi && s.y === yi)
      do {
        x = randInt(GRID_SIZE)
        y = randInt(GRID_SIZE)
      } while (snakeIncludes(x, y))
      foodRef.current = { x, y }
    }

    const startIfNeeded = () => {
      if (!startedRef.current && !gameOverRef.current) {
        startedRef.current = true
        setStatus('')
        startLoop()
      }
    }

    const maybeSpeedUp = () => {
      const sc = scoreRef.current
      if (sc > 0 && sc % SPEEDUP_EVERY === 0) {
        const next = Math.max(MIN_TICK_MS, tickRef.current - SPEEDUP_DELTA)
        if (next !== tickRef.current) {
          tickRef.current = next
          if (!pausedRef.current && !gameOverRef.current) startLoop()
        }
      }
    }

    const scoreRef = { current: 0 } as { current: number }
    const setScoreAndRefs = (v: number) => {
      scoreRef.current = v
      setScore(v)
    }

    const saveBest = () => {
      if (scoreRef.current > best) {
        const b = scoreRef.current
        setBest(b)
        try { localStorage.setItem('snake.best', String(b)) } catch {}
      }
    }

    const tick = () => {
      if (pausedRef.current || gameOverRef.current) return
      dirRef.current = nextDirRef.current
      const snake = snakeRef.current
      const head = { x: snake[0].x + dirRef.current.x, y: snake[0].y + dirRef.current.y }
      const snakeIncludes = (xi: number, yi: number) => snake.some(s => s.x === xi && s.y === yi)

      if (!withinBounds(head.x, head.y) || snakeIncludes(head.x, head.y)) {
        gameOverRef.current = true
        stopLoop()
        saveBest()
        setStatus('Game Over — Press R to restart')
        draw()
        return
      }

      const ate = coordsEq(head, foodRef.current)
      snake.unshift(head)
      if (ate) {
        setScoreAndRefs(scoreRef.current + 1)
        spawnFood()
        maybeSpeedUp()
      } else {
        snake.pop()
      }

      draw()
    }

    const startLoop = () => {
      stopLoop()
      timerRef.current = window.setInterval(tick, tickRef.current)
    }
    const stopLoop = () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }

    const draw = () => {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
      const size = canvas.width / dpr
      const cell = Math.floor(size / GRID_SIZE)
      const w = cell * GRID_SIZE
      const h = w
      ctx.clearRect(0, 0, w, h)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i <= GRID_SIZE; i++) {
        const p = i * cell + 0.5
        ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke()
      }

      // food
      ctx.fillStyle = getFoodColor()
      roundRectFill(ctx, foodRef.current.x * cell, foodRef.current.y * cell, cell, cell, Math.max(3, Math.floor(cell * 0.25)))

      // snake
      const snake = snakeRef.current
      for (let i = snake.length - 1; i >= 0; i--) {
        const seg = snake[i]
        const isHead = i === 0
        ctx.fillStyle = isHead ? '#34d399' : '#10b981'
        roundRectFill(ctx, seg.x * cell, seg.y * cell, cell, cell, isHead ? Math.max(4, Math.floor(cell * 0.28)) : Math.max(3, Math.floor(cell * 0.22)))
      }
    }

    const getFoodColor = () => {
      const t = Date.now() * 0.004
      const a = Math.sin(t) * 0.25 + 0.75
      return `rgba(245, 158, 11, ${a.toFixed(2)})`
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key
      if (k === ' ' || k === 'p' || k === 'P') {
        e.preventDefault()
        if (!startedRef.current) { startIfNeeded(); return }
        pausedRef.current = !pausedRef.current
        setStatus(pausedRef.current ? 'Paused (Space/P to resume)' : '')
        if (pausedRef.current) stopLoop(); else startLoop()
        return
      }
      if (k === 'r' || k === 'R') { e.preventDefault(); resetGame(); draw(); return }
      if (Keys[k]) {
        e.preventDefault()
        const d = Keys[k]
        const snake = snakeRef.current
        const dir = dirRef.current
        if (snake.length > 1 && (d.x === -dir.x && d.y === -dir.y)) return
        nextDirRef.current = d
        startIfNeeded()
      }
    }

    const init = () => {
      setupCanvas()
      resetGame()
      draw()
    }

    window.addEventListener('resize', () => { setupCanvas(); draw() })
    window.addEventListener('keydown', onKeyDown, { passive: false })
    init()
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      stopLoop()
    }
  }, [])

  return (
    <div className="relative z-10 w-full max-w-[560px] mx-auto grid gap-3">
      <header className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 items-center bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="text-slate-400 select-none">Score: <strong className="text-slate-100">{score}</strong></div>
        <div className="text-slate-400 select-none">Best: <strong className="text-slate-100">{best}</strong></div>
        <div className="justify-self-end inline-flex gap-2">
          <button
            className="border border-emerald-900/60 bg-emerald-900/40 text-slate-100 rounded-lg px-3 py-2 hover:border-emerald-700"
            onClick={() => {
              if (!startedRef.current) return setStatus(''), (startedRef.current = true), void 0
              pausedRef.current = !pausedRef.current
              setStatus(pausedRef.current ? 'Paused (Space/P to resume)' : '')
            }}
          >{pausedRef.current ? 'Resume' : 'Pause'}</button>
          <button
            className="border border-red-900/60 bg-red-900/40 text-red-100 rounded-lg px-3 py-2 hover:border-red-700"
            onClick={() => {
              // triggering reset via key path to reuse logic inside effect would be more complex here; do quick reload of effect state
              const ev = new KeyboardEvent('keydown', { key: 'R' })
              window.dispatchEvent(ev)
            }}
          >Restart</button>
        </div>
      </header>
      <div className="relative bg-slate-950/70 border border-slate-800 rounded-2xl p-2 shadow-[0_14px_45px_rgba(0,0,0,0.35)]">
        <canvas ref={canvasRef} className="w-full h-auto block rounded-xl bg-slate-950" width={480} height={480} aria-label="Snake game board" role="img" />
        {status && (
          <div className="absolute inset-2 grid place-items-center pointer-events-none">
            <span className="bg-black/60 border border-white/10 text-slate-400 text-sm rounded-full px-3 py-2 select-none">{status}</span>
          </div>
        )}
      </div>
      <div className="text-center text-slate-400 text-xs select-none">Keys: Arrows/WASD to move • Space/P to pause • R to restart</div>
    </div>
  )
}

function roundRectFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
  ctx.fill()
}


