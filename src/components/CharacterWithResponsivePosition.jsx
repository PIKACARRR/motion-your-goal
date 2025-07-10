import { useRef, useEffect } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { AnimationMixer } from 'three'
import * as THREE from 'three'
export default function CharacterWithResponsivePosition({ model = 'v3', position = [0, 0, 0] , rotationY =  Math.PI / 1.5 ,scale = [0.03, 0.03, 0.03] }) {
  const group = useRef()
  const mixer = useRef()
  const gltf = useLoader(GLTFLoader, `/models/${model}.glb`)
  
  useEffect(() => {
    console.log("載入模型", model, gltf.scene)
    if (gltf.animations && gltf.animations.length > 0) {
      mixer.current = new AnimationMixer(gltf.scene)
      const action = mixer.current.clipAction(gltf.animations[0])
  
      if (model === 'Light_Punching') {
        action.setLoop(THREE.LoopOnce)
        action.clampWhenFinished = true
      } else {
        action.setLoop(THREE.LoopRepeat)
        action.clampWhenFinished = false
      }
  
      action.reset().play()
  
      // ✅ 只在第一次 running 時設定一次 timeout
      
    }
  }, [gltf, model])
  

  useFrame((_, delta) => {
    // 強制每一幀修正位置
    if (group.current) {
      group.current.position.set(...position)
    }
    mixer.current?.update(delta)
  })

  return (
    <group
      ref={group}
      position={position} // ✅ 使用 props 傳進來的位置
      
      rotation={[0, rotationY, 0]} // ← 用 props 傳進來的角度
      scale={scale}
    >
      <primitive object={gltf.scene} />
    </group>
  )
} 