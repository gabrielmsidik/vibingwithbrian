'use client'
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
      uRadius: { value: Math.max(0.02, Math.min(0.2, (props.cursorSize ?? 80) / Math.min(width, height))) },
      uHighlight: { value: 0.16 },
      uAmp: { value: 0.75 },
      uFlow: { value: 0.42 },
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
        uniform float uAmp;
        uniform float uFlow;
        uniform vec3 uColors[3];
        varying vec2 vUv;

        mat2 rot(float a){ float s = sin(a), c = cos(a); return mat2(c,-s,s,c); }

        void main() {
          vec2 uv = vUv;
          float t = uTime;
          vec2 p = uv - 0.5;
          p *= rot(sin(t*0.25)*0.5);
          for(int i=0;i<4;i++){
            p += uAmp * 0.12 * sin( (p.yx*6.0 + float(i)*1.7) + t*0.9 );
            p *= rot(0.7 + float(i)*0.35);
          }
          vec2 q = p + 0.5;

          vec3 col = mix(uColors[0], uColors[1], clamp(q.x, 0.0, 1.0));
          col = mix(col, uColors[2], clamp(q.y, 0.0, 1.0));
          float flow = sin(q.x*10.0 + t*0.9) + cos(q.y*11.0 - t*1.1) + sin((q.x+q.y)*8.0 + t*0.7);
          flow = 0.5 + 0.5*sin(flow);
          col = mix(col, vec3(1.0) - col, flow * uFlow);

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
      if (props.autoDemo) {
        const seconds = uniforms.uTime.value
        const cx = width * 0.5
        const cy = height * 0.5
        const r = Math.min(width, height) * 0.25 * (props.autoIntensity ?? 2.2) * 0.18
        const spd = (props.autoSpeed ?? 0.5) * 0.8
        const x = cx + Math.cos(seconds * spd) * r
        const y = cy + Math.sin(seconds * spd * 1.1) * r
        uniforms.uMouse.value.set(x, y)
      }
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

  return <div ref={mountRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }} />
}


