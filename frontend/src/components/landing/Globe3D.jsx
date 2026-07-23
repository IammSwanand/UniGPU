import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

/* Nodes positioned ON the sphere surface (radius ≈ 1.6) */
const NODE_POSITIONS = [
  [ 1.52,  0.40,  0.30],
  [-1.40, -0.50,  0.72],
  [ 0.20,  1.55, -0.25],
  [-0.55, -1.48, -0.55],
  [ 0.85, -0.90,  1.20],
  [-1.10,  0.95, -0.70],
  [ 1.30, -0.75, -0.80],
  [ 0.10,  0.60,  1.52],
];

function GlobeGroup({ progressRef }) {
  const group = useRef();

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x = progressRef.current * 0.4 - 0.2;
  });

  return (
    <group ref={group}>
      {/* Wireframe sphere */}
      <mesh>
        <sphereGeometry args={[1.6, 36, 36]} />
        <meshBasicMaterial
          color="#145aff"
          wireframe
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* Glowing dot nodes — rotate with the globe */}
      {NODE_POSITIONS.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshBasicMaterial color="#4d90ff" />
        </mesh>
      ))}
    </group>
  );
}

export default function Globe3D({ scrollProgress = 0, className = '' }) {
  const progressRef = useRef(scrollProgress);
  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  return (
    <div className={`lp-globe-canvas ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <GlobeGroup progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
