import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function MeterRing({ fill = 0 }) {
  const ring = useRef();
  const arc = Math.PI * 1.5 * fill;

  useFrame(() => {
    if (ring.current) ring.current.rotation.z = -Math.PI * 0.75;
  });

  return (
    <group ref={ring}>
      <mesh>
        <torusGeometry args={[1.1, 0.06, 16, 64, Math.PI * 1.5]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.8} />
      </mesh>
      {fill > 0.01 && (
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[1.1, 0.08, 16, 64, arc]} />
          <meshStandardMaterial color="#145aff" metalness={0.4} roughness={0.3} emissive="#145aff" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  );
}

export default function PricingMeter({ fill = 0, className = '' }) {
  return (
    <div className={`lp-pricing-meter ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        dpr={[1, 2]}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1} />
        <MeterRing fill={fill} />
      </Canvas>
    </div>
  );
}
