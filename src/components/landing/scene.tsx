'use client';

import { ContactShadows, OrthographicCamera, useAnimations, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// Model and animation are authored in Blender: assets/homeward-scene.blend.
const MODEL = '/models/homeward.glb';
// Seconds into the 12s loop: the order lands at the pharmacy, then Mum collects it.
const ARRIVES = 4;
const PICKED_UP = 8.2;

// Where to stop the animation to show each stage of a real order.
const HOLD_AT = [2, 6, 9.5] as const;

export type Stages = { us: string; ng: string }[];
export type Stage = 0 | 1 | 2;

const demoStages: Stages = [
  { us: 'Paying Ndidi Pharmacy · $18.40', ng: 'Order on its way' },
  { us: 'Paid', ng: 'Ready for pickup' },
  { us: 'Mum picked it up · 3:14 PM', ng: 'Picked up' },
];

type Anchors = { us: RefObject<HTMLDivElement | null>; ng: RefObject<HTMLDivElement | null> };

function Diorama({
  still,
  hold,
  anchors,
  onStage,
  onReady,
}: {
  still: boolean;
  hold?: Stage;
  anchors: Anchors;
  onStage: (stage: number) => void;
  onReady?: () => void;
}) {
  // With `hold`, the animation plays once up to that stage and stops there.
  const holdAt = hold === undefined ? undefined : HOLD_AT[hold];
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { mixer, actions, names } = useAnimations(animations, group);
  const stage = useRef(-1);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;

  // Blender exports one clip per animated object; they share the same 12s timeline.
  useEffect(() => {
    const all = names.map((n) => actions[n]).filter((x): x is THREE.AnimationAction => Boolean(x));
    for (const action of all) {
      action.reset().play();
      if (still) {
        // Reduced motion: hold on the stage straight away.
        action.paused = true;
        action.time = Math.min(holdAt ?? 9.5, action.getClip().duration);
      }
    }
    if (still) mixer.update(0);
    return () => all.forEach((action) => void action.stop());
  }, [actions, names, mixer, still, holdAt]);

  // This component only renders once the model has downloaded.
  useEffect(() => onReady?.(), [onReady]);

  // Fit both islands at any width and height.
  useEffect(() => {
    camera.zoom = Math.min(size.width / 20, size.height / 8.8, 64);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  const labels = useMemo(() => {
    // Blender emission strengths blow out to white here; keep the glow but hold the colour.
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m?.emissiveIntensity) m.emissiveIntensity = Math.min(m.emissiveIntensity, 0.55);
    });
    scene.updateMatrixWorld(true);
    const at = (name: string) => scene.getObjectByName(name)?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();
    return { us: at('LabelUS'), ng: at('LabelNG') };
  }, [scene]);

  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    // Pin the HTML labels to their anchor points in the model.
    for (const key of ['us', 'ng'] as const) {
      const el = anchors[key].current;
      if (!el) continue;
      projected.copy(labels[key]).project(camera);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      el.style.opacity = '1';
    }

    const action = actions.Mum ?? actions[names[0]];
    if (!action) return;
    if (holdAt !== undefined && !action.paused && action.time >= holdAt) {
      for (const n of names) {
        const a = actions[n];
        if (!a) continue;
        a.time = Math.min(holdAt, a.getClip().duration);
        a.paused = true;
      }
    }
    const next = still ? (hold ?? 2) : action.time < ARRIVES ? 0 : action.time < PICKED_UP ? 1 : 2;
    if (next !== stage.current) {
      stage.current = next;
      onStage(next);
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

function Label({ anchor, place, text, done }: { anchor: RefObject<HTMLDivElement | null>; place: string; text: string; done: boolean }) {
  return (
    <div ref={anchor} className="pointer-events-none absolute top-0 left-0 flex w-max flex-col items-center gap-1.5 opacity-0">
      <span className="label text-text-muted">{place}</span>
      <span className="flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-sm backdrop-blur">
        <span className={`block size-1.5 rotate-45 ${done ? 'bg-signal' : 'bg-text-muted'}`} />
        {text}
      </span>
    </div>
  );
}

// The Houston-to-Enugu diorama. On the landing page it loops through a demo order; given
// `hold` and `stages` it plays a real order up to where that order has got to, and stops.
export default function Scene({
  onReady,
  hold,
  stages = demoStages,
  places = { us: 'Houston · 9:14 AM', ng: 'Enugu · 3:14 PM' },
}: {
  onReady?: () => void;
  hold?: Stage;
  stages?: Stages;
  places?: { us: string; ng: string };
}) {
  const still = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const [stage, setStage] = useState(0);
  const us = useRef<HTMLDivElement>(null);
  const ng = useRef<HTMLDivElement>(null);
  const anchors = useMemo(() => ({ us, ng }), []);

  return (
    <div className="relative size-full overflow-hidden" aria-hidden>
      <Canvas flat dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <OrthographicCamera
          makeDefault
          position={[12, 12, 12]}
          zoom={50}
          near={0.1}
          far={100}
          onUpdate={(c) => c.lookAt(0, 1.7, 0)}
        />
        <ambientLight intensity={1.15} />
        <directionalLight position={[4, 12, 9]} intensity={1.7} />
        <directionalLight position={[-6, 6, -4]} intensity={0.5} />
        <Diorama still={still} hold={hold} anchors={anchors} onStage={setStage} onReady={onReady} />
        <ContactShadows position={[0, -0.31, 0]} scale={26} blur={2.6} opacity={0.22} far={6} />
      </Canvas>
      <Label anchor={us} place={places.us} text={stages[stage].us} done={stage > 0} />
      <Label anchor={ng} place={places.ng} text={stages[stage].ng} done={stage === 2} />
    </div>
  );
}

useGLTF.preload(MODEL);
