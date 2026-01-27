import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Html,
  Environment,
  SoftShadows,
  Stars,
  Cloud,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { animated, useSpring } from '@react-spring/three';
import gsap from 'gsap';

// Island data type
interface IslandData {
  id: string;
  level: string;
  position: [number, number, number];
  color: string;
  lessonTitle: string;
  progress: number;
  hskLevel: number;
}

// Islands configuration - repositioned for better view
const islands: IslandData[] = [
  {
    id: 'hsk1',
    level: 'HSK 1',
    position: [-8, 0, 3],
    color: '#FFB84D',
    lessonTitle: 'Basic Greetings',
    progress: 85,
    hskLevel: 1,
  },
  {
    id: 'hsk2',
    level: 'HSK 2',
    position: [-3, 1.5, 0],
    color: '#FF8C42',
    lessonTitle: 'Daily Conversations',
    progress: 60,
    hskLevel: 2,
  },
  {
    id: 'hsk3',
    level: 'HSK 3',
    position: [3, 1, -2],
    color: '#FF6B35',
    lessonTitle: 'Complex Expressions',
    progress: 30,
    hskLevel: 3,
  },
  {
    id: 'hsk4',
    level: 'HSK 4',
    position: [-6, 0, -5],
    color: '#D9903F',
    lessonTitle: 'Advanced Reading',
    progress: 15,
    hskLevel: 4,
  },
  {
    id: 'hsk5',
    level: 'HSK 5',
    position: [7, 0.5, -4],
    color: '#C97132',
    lessonTitle: 'Professional Chinese',
    progress: 5,
    hskLevel: 5,
  },
];

// Floating Island Component
const FloatingIsland: React.FC<{
  data: IslandData;
  onIslandClick: (data: IslandData) => void;
  isSelected: boolean;
}> = ({ data, onIslandClick, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Animated properties using react-spring
  const { scale, emissiveIntensity } = useSpring({
    scale: hovered ? 1.15 : isSelected ? 1.2 : 1,
    emissiveIntensity: hovered ? 0.4 : isSelected ? 0.6 : 0.15,
    config: { tension: 300, friction: 20 },
  });

  // Floating animation
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = data.position[1] + Math.sin(time * 0.8 + data.hskLevel) * 0.2;

      // Gentle rotation
      groupRef.current.rotation.y += 0.003;
    }

    // Pulse effect when hovered
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.015;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onIslandClick(data);
  };

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  return (
    <group
      ref={groupRef}
      position={[data.position[0], data.position[1], data.position[2]]}
    >
      {/* Main Island Mesh - Low Poly Style */}
      <animated.mesh
        ref={meshRef}
        scale={scale}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1.2, 0]} />
        <animated.meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.2}
          flatShading
        />
      </animated.mesh>

      {/* Base platform */}
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.6, 0.4, 6]} />
        <meshStandardMaterial
          color={data.color}
          roughness={0.7}
          flatShading
        />
      </mesh>

      {/* Small decorative crystals */}
      {[...Array(4)].map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const radius = 1;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              0.2,
              Math.sin(angle) * radius,
            ]}
            castShadow
          >
            <coneGeometry args={[0.12, 0.4, 4]} />
            <meshStandardMaterial
              color="#FFE5B4"
              emissive="#FFD700"
              emissiveIntensity={hovered ? 0.8 : 0.4}
              flatShading
            />
          </mesh>
        );
      })}

      {/* Floating label with lesson info */}
      <Html
        position={[0, 2.5, 0]}
        center
        distanceFactor={10}
        occlude
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            background: 'rgba(10, 6, 4, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '16px 24px',
            borderRadius: '20px',
            border: `3px solid ${hovered || isSelected ? '#FFB84D' : 'rgba(217, 144, 63, 0.4)'}`,
            minWidth: '220px',
            textAlign: 'center',
            transform: hovered || isSelected ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.3s ease',
            boxShadow: hovered || isSelected
              ? '0 8px 32px rgba(217, 144, 63, 0.4)'
              : '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{
            color: '#FFB84D',
            fontSize: '22px',
            fontWeight: 'bold',
            marginBottom: '6px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            {data.level}
          </div>
          <div style={{
            color: '#FFF',
            fontSize: '15px',
            marginBottom: '10px',
            opacity: 0.9,
          }}>
            {data.lessonTitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div
                style={{
                  width: `${data.progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #D9903F, #FFB84D)',
                  borderRadius: '4px',
                  transition: 'width 1s ease',
                  boxShadow: '0 0 10px rgba(217, 144, 63, 0.5)',
                }}
              />
            </div>
            <div style={{
              color: '#FFB84D',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '45px',
            }}>
              {data.progress}%
            </div>
          </div>
        </div>
      </Html>

      {/* Glow effect when hovered or selected */}
      {(hovered || isSelected) && (
        <>
          <pointLight
            position={[0, 1, 0]}
            intensity={2}
            distance={8}
            color={data.color}
            castShadow
          />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2, 16, 16]} />
            <meshBasicMaterial
              color={data.color}
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
        </>
      )}

      {/* Particle ring around selected island */}
      {isSelected && (
        <Particles color={data.color} />
      )}
    </group>
  );
};

// Particle effect for selected island
const Particles: React.FC<{ color: string }> = ({ color }) => {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.01;
    }
  });

  const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 2 + Math.random() * 0.5;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.random() * 2 - 1;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Camera controller with smooth transitions
const CameraController: React.FC<{
  selectedIsland: IslandData | null;
  orbitControlsRef: any;
}> = ({ selectedIsland, orbitControlsRef }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (selectedIsland) {
      // Disable orbit controls during animation
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }

      // Smooth camera zoom using GSAP
      const targetPosition = {
        x: selectedIsland.position[0] * 0.7,
        y: selectedIsland.position[1] + 3,
        z: selectedIsland.position[2] + 5,
      };

      const targetLookAt = {
        x: selectedIsland.position[0],
        y: selectedIsland.position[1],
        z: selectedIsland.position[2],
      };

      gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(targetLookAt.x, targetLookAt.y, targetLookAt.z);
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
          }
        },
        onComplete: () => {
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true;
          }
        },
      });
    } else {
      // Return to overview position
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }

      gsap.to(camera.position, {
        x: 0,
        y: 12,
        z: 18,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
          if (orbitControlsRef.current) {
            orbitControlsRef.current.target.set(0, 0, 0);
          }
        },
        onComplete: () => {
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true;
          }
        },
      });
    }
  }, [selectedIsland, camera, orbitControlsRef]);

  return null;
};

// Connection paths between islands
const ConnectionPath: React.FC<{ from: [number, number, number]; to: [number, number, number] }> = ({ from, to }) => {
  const points = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 2;
    const z = from[2] + (to[2] - from[2]) * t;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, 40, 0.05, 8, false);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial
        color="#FFB84D"
        emissive="#D9903F"
        emissiveIntensity={0.3}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
};

// Main Scene Component
const Scene: React.FC = () => {
  const [selectedIsland, setSelectedIsland] = useState<IslandData | null>(null);
  const orbitControlsRef = useRef<any>(null);

  const handleIslandClick = (island: IslandData) => {
    setSelectedIsland(selectedIsland?.id === island.id ? null : island);
  };

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 12, 18]} fov={60} />
      <CameraController selectedIsland={selectedIsland} orbitControlsRef={orbitControlsRef} />

      {/* Orbit Controls for manual camera control */}
      <OrbitControls
        ref={orbitControlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0, 0]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[15, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight position={[-15, 8, -10]} intensity={0.8} color="#FFB84D" />
      <pointLight position={[15, 5, 10]} intensity={0.5} color="#FF6B35" />

      {/* Soft Shadows for AAA look */}
      <SoftShadows size={50} samples={20} focus={0.5} />

      {/* Environment map for realistic reflections */}
      <Environment preset="sunset" />

      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={7000}
        factor={5}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Floating clouds */}
      <Cloud position={[-15, 6, -12]} speed={0.2} opacity={0.25} />
      <Cloud position={[15, 8, -8]} speed={0.15} opacity={0.2} />
      <Cloud position={[0, 10, -20]} speed={0.1} opacity={0.3} />

      {/* Connection paths between islands */}
      {islands.slice(0, -1).map((island, i) => (
        <ConnectionPath
          key={`path-${i}`}
          from={island.position}
          to={islands[i + 1].position}
        />
      ))}

      {/* Islands */}
      {islands.map((island) => (
        <FloatingIsland
          key={island.id}
          data={island}
          onIslandClick={handleIslandClick}
          isSelected={selectedIsland?.id === island.id}
        />
      ))}

      {/* Ground plane with subtle gradient */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          color="#0a0604"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Grid helper for depth perception */}
      <gridHelper args={[100, 20, '#D9903F', '#1a1410']} position={[0, -5.9, 0]} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0604', 15, 60]} />
    </>
  );
};

// Main Component Export
const LanguageLearningMap: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0a0604', position: 'relative' }}>
      {/* Instructions overlay */}
      {showInstructions && (
        <div
          style={{
            position: 'absolute',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(26, 20, 16, 0.95)',
            backdropFilter: 'blur(15px)',
            padding: '20px 40px',
            borderRadius: '20px',
            border: '2px solid rgba(217, 144, 63, 0.6)',
            color: '#FFF',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease',
            maxWidth: '600px',
          }}
        >
          <h2 style={{ margin: 0, color: '#FFB84D', fontSize: '28px', marginBottom: '12px' }}>
            🎮 Journey of Words - 3D Learning Map
          </h2>
          <p style={{ margin: 0, fontSize: '16px', color: '#D9903F', lineHeight: '1.6' }}>
            <strong>Click</strong> islands to zoom in • <strong>Drag</strong> to rotate • <strong>Scroll</strong> to zoom • <strong>Hover</strong> for details
          </p>
          <button
            onClick={() => setShowInstructions(false)}
            style={{
              marginTop: '12px',
              padding: '8px 24px',
              background: '#D9903F',
              border: 'none',
              borderRadius: '10px',
              color: '#FFF',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Got it!
          </button>
        </div>
      )}

      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10,
          background: 'rgba(26, 20, 16, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '12px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(217, 144, 63, 0.3)',
          color: '#FFB84D',
          fontSize: '14px',
        }}
      >
        🖱️ <strong>Drag</strong>: Rotate • 🔍 <strong>Scroll</strong>: Zoom • 👆 <strong>Click</strong>: Select Island
      </div>

      <Canvas shadows gl={{ antialias: true, alpha: false }} dpr={[1, 2]}>
        <Scene />
      </Canvas>
    </div>
  );
};

export default LanguageLearningMap;
