import { useMemo } from 'react'
import { Image } from '@react-three/drei'
import CharacterWithResponsivePosition from '../components/CharacterWithResponsivePosition'

const halfCake = process.env.PUBLIC_URL + '/images/half_healthv2.png';
const fullCake = process.env.PUBLIC_URL + '/images/healthv2.png';

export default function SkeletonWithHP({ model, position, rotationY, hp, scale }) {
    const cakes = useMemo(() => {
        const images = [];
        let remaining = hp;
        for (let i = 0; remaining > 0; i++) {
            const texture = remaining >= 10 ? fullCake : halfCake;
            images.push({ texture, x: i });
            remaining -= 10;
        }
        return images;
    }, [hp]);

    return (
        <group>
            <CharacterWithResponsivePosition
                model={model}
                position={position}
                rotationY={rotationY}
                scale={scale}
            />
            {cakes.map((cake, i) => (
                <Image
                    key={i}
                    url={cake.texture}
                    scale={[0.6, 0.6, 0.6]}
                    position={[position[0] + i * 0.7, position[1] - 2.5, position[2]]}
                    transparent
                    toneMapped={false}
                    renderOrder={999}
                    depthTest={false}
                />
            ))}
        </group>

    )
} 