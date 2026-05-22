import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles() {
  const groupRef = useRef<THREE.Group>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })

  const count = 120
  const boxSize = { x: 20, y: 12, z: 5 }

  const { positions, velocities } = useMemo(() => {
    const pos: THREE.Vector3[] = []
    const vel: THREE.Vector3[] = []
    for (let i = 0; i < count; i++) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * boxSize.x,
          (Math.random() - 0.5) * boxSize.y,
          (Math.random() - 0.5) * boxSize.z
        )
      )
      vel.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.002
        )
      )
    }
    return { positions: pos, velocities: vel }
  }, [])

  const [lines, setLines] = useState<{ start: THREE.Vector3; end: THREE.Vector3 }[]>([])

  useFrame(() => {
    for (let i = 0; i < count; i++) {
      positions[i].add(velocities[i])
      if (Math.abs(positions[i].x) > boxSize.x / 2) positions[i].x *= -0.95
      if (Math.abs(positions[i].y) > boxSize.y / 2) positions[i].y *= -0.95
      if (Math.abs(positions[i].z) > boxSize.z / 2) positions[i].z *= -0.95
    }

    const newLines: { start: THREE.Vector3; end: THREE.Vector3 }[] = []
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (positions[i].distanceTo(positions[j]) < 3.5) {
          newLines.push({ start: positions[i].clone(), end: positions[j].clone() })
        }
      }
    }
    setLines(newLines)

    if (groupRef.current) {
      const targetY = mouse.current.x * 0.03
      const targetX = mouse.current.y * -0.02
      currentRotation.current.x += (targetX - currentRotation.current.x) * 0.05
      currentRotation.current.y += (targetY - currentRotation.current.y) * 0.05
      groupRef.current.rotation.x = currentRotation.current.x
      groupRef.current.rotation.y = currentRotation.current.y
    }
  })

  const handlePointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove)
    return () => window.removeEventListener('mousemove', handlePointerMove)
  }, [handlePointerMove])

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh key={`node-${i}`} position={pos}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#7C3AED" transparent opacity={0.7} />
        </mesh>
      ))}
      {lines.map((line, i) => {
        const points = [line.start, line.end]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return (
          <line key={`line-${i}`} geometry={geometry}>
            <lineBasicMaterial color="#7C3AED" transparent opacity={0.15} />
          </line>
        )
      })}
    </group>
  )
}

export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <fog attach="fog" args={['#08080E', 8, 25]} />
        <Particles />
      </Canvas>
    </div>
  )
}
