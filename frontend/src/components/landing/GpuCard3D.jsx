import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Edges } from '@react-three/drei';

function GpuMesh({ progressRef }) {
  const group = useRef();

  useFrame(() => {
    if (!group.current) return;
    const p = progressRef.current;
    group.current.rotation.y = p * Math.PI * 0.25;
    group.current.rotation.x = p * 0.15;
  });

  return (
    <group ref={group}>
      <RoundedBox args={[2.4, 0.35, 1.1]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color="#14141e" metalness={0.6} roughness={0.35} />
        <Edges color="#145aff" threshold={15} />
      </RoundedBox>
      <RoundedBox args={[2.0, 0.08, 0.9]} radius={0.02} position={[0, 0.22, 0]}>
        <meshStandardMaterial color="#020520" metalness={0.8} roughness={0.2} emissive="#145aff" emissiveIntensity={0.15} />
      </RoundedBox>
      {/* Fan vents */}
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} position={[x, -0.05, 0.56]}>
          <boxGeometry args={[0.35, 0.2, 0.02]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function GpuCard3D({ scrollProgress = 0, className = '' }) {
  const progressRef = useRef(scrollProgress);
  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  return (
    <div className={`lp-gpu-canvas ${className}`}>
      <Canvas
        camera={{ position: [0, 0.5, 3.2], fov: 42 }}
        dpr={[1, 2]}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#f7f9ff" />
        <pointLight position={[-2, 1, 2]} intensity={0.6} color="#145aff" />
        <GpuMesh progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
