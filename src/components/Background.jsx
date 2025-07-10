import { useLoader, useThree } from '@react-three/fiber'
import { TextureLoader } from 'three'

export default function Background({ position = [0, 0, -1] }) {
  const texture = useLoader(TextureLoader, '/images/bgv2.png')
  const { size, viewport } = useThree()

  // 取得 viewport 寬高（以世界單位表示）
  const { width, height } = viewport

  return (
    <mesh position={position} scale={[width, height, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
} 