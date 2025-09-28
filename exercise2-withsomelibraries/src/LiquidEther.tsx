import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type LiquidEtherProps = {
  colors?: string[]
  mouseForce?: number
  cursorSize?: number
  isViscous?: boolean
  viscous?: number
  iterationsViscous?: number
  iterationsPoisson?: number
  resolution?: number
  isBounce?: boolean
  autoDemo?: boolean
  autoSpeed?: number
  autoIntensity?: number
  takeoverDuration?: number
  autoResumeDelay?: number
  autoRampDuration?: number
}

// Lightweight adaptation matching reactbits LiquidEther API signature.
// This is a simplified placeholder that renders a gradient plane and
// responds to mouse with subtle shader distortion.
export default function LiquidEther(props: LiquidEtherProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const requestRef = useRef<number | null>(null)

  useEffect(() => {
    const container = mountRef.current!
    const fallback = () => ({ w: container.clientWidth || container.offsetWidth || window.innerWidth, h: container.clientHeight || container.offsetHeight || window.innerHeight })
    let { w: width, h: height } = fallback()

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      10
    )
    camera.position.z = 1

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uMouse: { value: new THREE.Vector2(-10, -10) },
      uRadius: { value: Math.max(0.03, Math.min(0.25, (props.cursorSize ?? 80) / Math.min(width, height))) },
      uHighlight: { value: 0.12 },
      uColors: {
        value: (props.colors || ['#5227FF', '#FF9FFC', '#B19EEF']).map(
          (c) => new THREE.Color(c)
        ),
      },
    }

    const geometry = new THREE.PlaneGeometry(width, height, 1, 1)
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uRadius;
        uniform float uHighlight;
        uniform vec3 uColors[3];
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          // wobble mix
          float w = sin(uTime * 0.5 + uv.x * 6.283) * 0.12 + cos(uTime * 0.8 + uv.y * 6.283) * 0.10;
          vec3 col = mix(uColors[0], uColors[1], uv.x + w);
          col = mix(col, uColors[2], uv.y - w);

          // mouse highlight (soft, smaller)
          vec2 m = uMouse / uResolution;
          float d = distance(uv, m);
          float feather = uRadius * 0.35;
          float edge = smoothstep(uRadius - feather, uRadius, d);
          float hi = (1.0 - edge) * uHighlight;
          col += vec3(hi);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const onPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      uniforms.uMouse.value.set(x, height - y)
    }

    window.addEventListener('pointermove', onPointer)

    let start = performance.now()
    const animate = () => {
      const t = performance.now()
      uniforms.uTime.value = (t - start) / 1000
      renderer.render(scene, camera)
      requestRef.current = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      const dim = fallback()
      const w = dim.w
      const h = dim.h
      renderer.setSize(w, h, false)
      camera.left = -w / 2
      camera.right = w / 2
      camera.top = h / 2
      camera.bottom = -h / 2
      camera.updateProjectionMatrix()
      uniforms.uResolution.value.set(w, h)
      uniforms.uRadius.value = Math.max(0.03, Math.min(0.25, (props.cursorSize ?? 80) / Math.min(w, h)))
      mesh.geometry.dispose()
      mesh.geometry = new THREE.PlaneGeometry(w, h, 1, 1)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      container.innerHTML = ''
    }
  }, [props.colors])

  return <div ref={mountRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }} />
}


