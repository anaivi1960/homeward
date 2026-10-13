'use client';

import { ContactShadows, OrthographicCamera, useAnimations, useGLTF } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// One how-it-works tile. Models are authored in Blender: assets/homeward-scene.blend.
function Tile({ model, still }: { model: string; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(model);
  const { mixer, actions, names } = useAnimations(animations, group);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;

  useMemo(() => {
    // Blender emission strengths blow out to white here; keep the glow but hold the colour.
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m?.emissiveIntensity) m.emissiveIntensity = Math.min(m.emissiveIntensity, 0.55);
    });
  }, [scene]);

  useEffect(() => {
    const all = names.map((n) => actions[n]).filter((x): x is THREE.AnimationAction => Boolean(x));
    for (const action of all) {
      action.reset().play();
      if (still) {
        action.paused = true;
        action.time = Math.min(2.4, action.getClip().duration);
      }
    }
    if (still) mixer.update(0);
    return () => all.forEach((action) => void action.stop());
  }, [actions, names, mixer, still]);

  useEffect(() => {
    camera.zoom = Math.min(size.width / 5.2, size.height / 4.3);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function MiniScene({ model }: { model: string }) {
  const still = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  return (
    <Canvas flat dpr={[1, 2]} gl={{ antialias: true, alpha: true }} aria-hidden>
      <OrthographicCamera
        makeDefault
        position={[12, 12, 12]}
        zoom={50}
        near={0.1}
        far={100}
        onUpdate={(c) => c.lookAt(0, 0.7, 0)}
      />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 12, 9]} intensity={1.7} />
      <directionalLight position={[-6, 6, -4]} intensity={0.5} />
      <Tile model={model} still={still} />
      <ContactShadows position={[0, -0.27, 0]} scale={9} blur={2.4} opacity={0.22} far={4} />
    </Canvas>
  );
}
