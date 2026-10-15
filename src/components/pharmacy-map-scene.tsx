'use client';

import { OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { enuguOutline } from '@/lib/enugu-outline';
import { enuguAreas, enuguRoads, type WellaPharmacy } from '@/lib/wella-enugu';

// Palette of the Blender dioramas (assets/homeward-scene.blend), in sRGB.
const SLAB = '#d3d8e2';
const GROUND = '#ead3ae';
const PLATE = '#d8bd93';
const ROAD = '#f6ecda';
const SHOP = '#fbf6ec';
const GREEN = '#00c36a';
const INK = '#0a0b0d';

// The state is drawn to scale, but Enugu city is not: its neighbourhoods are a few kilometres
// apart in a state 130 km long, so the city is blown up to fill the middle of the state.
const UNITS_PER_KM = 0.3;
const CITY_UNITS_PER_KM = 1.8;
const CITY_AT = { x: -3, z: 0 };
// Shops and plates are this many times the size of the ones in the Blender tiles.
const SHOP_SCALE = 2.8;

const cityAreas = Object.values(enuguAreas).filter((a) => a.inCity);
const mid = (values: number[]) => (Math.min(...values) + Math.max(...values)) / 2;
const ORIGIN = { lat: mid(cityAreas.map((a) => a.lat)), lon: mid(cityAreas.map((a) => a.lon)) };
const KM_PER_DEGREE = 110.6;
// Kilometres east and south of the middle of Enugu city.
const km = (lat: number, lon: number) => ({
  x: (lon - ORIGIN.lon) * KM_PER_DEGREE * Math.cos((ORIGIN.lat * Math.PI) / 180),
  z: -(lat - ORIGIN.lat) * KM_PER_DEGREE,
});

const outline = enuguOutline.map(([lon, lat]) => {
  const at = km(lat, lon);
  return { x: at.x * UNITS_PER_KM, z: at.z * UNITS_PER_KM };
});
// The outline as the isometric camera sees it: u runs across the screen, v up it (before the
// 0.577 foreshortening). Used to fit the state to the canvas.
const us = outline.map((p) => (p.x - p.z) / Math.SQRT2);
const vs = outline.map((p) => (p.x + p.z) / Math.SQRT2);
const STATE = {
  x: (mid(us) + mid(vs)) / Math.SQRT2,
  z: (mid(vs) - mid(us)) / Math.SQRT2,
  across: Math.max(...us) - Math.min(...us),
  tall: (Math.max(...vs) - Math.min(...vs)) * 0.577,
};

function inState(x: number, z: number) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i];
    const b = outline[j];
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

type Plate = { area: string; x: number; z: number; radius: number };
type Placed = { pharmacy: WellaPharmacy; x: number; z: number };
type Labels = RefObject<Record<string, HTMLElement | null>>;

const ringOf = (count: number) => (count === 1 ? 0 : (0.3 + 0.14 * count) * SHOP_SCALE);

// Shops stand in a ring on their area's plate; the plate grows with the ring.
function layout(pharmacies: WellaPharmacy[]) {
  const plates: Plate[] = [];
  for (const [area, where] of Object.entries(enuguAreas)) {
    const count = pharmacies.filter((p) => p.area === area).length;
    if (count === 0) continue;
    const at = km(where.lat, where.lon);
    const scale = where.inCity ? CITY_UNITS_PER_KM : UNITS_PER_KM;
    plates.push({
      area,
      x: (where.inCity ? CITY_AT.x : 0) + at.x * scale,
      z: (where.inCity ? CITY_AT.z : 0) + at.z * scale,
      radius: Math.max(0.7 * SHOP_SCALE, ringOf(count) + 0.5 * SHOP_SCALE),
    });
  }

  // Nudge overlapping plates apart, and pull any that hang over the border back inside.
  const fits = (p: Plate) =>
    Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6).every((angle) =>
      inState(p.x + Math.cos(angle) * (p.radius + 0.3), p.z + Math.sin(angle) * (p.radius + 0.3)),
    );
  for (let pass = 0; pass < 200; pass++) {
    for (const a of plates) {
      for (const b of plates) {
        if (a === b) continue;
        const gap = Math.hypot(b.x - a.x, b.z - a.z);
        const push = (a.radius + b.radius + 0.5 - gap) / 2;
        if (push <= 0) continue;
        a.x -= ((b.x - a.x) / gap) * push;
        a.z -= ((b.z - a.z) / gap) * push;
      }
    }
    for (const a of plates) {
      if (fits(a)) continue;
      a.x += (CITY_AT.x - a.x) * 0.06;
      a.z += (CITY_AT.z - a.z) * 0.06;
    }
  }

  const placed: Placed[] = [];
  for (const plate of plates) {
    const here = pharmacies.filter((p) => p.area === plate.area);
    here.forEach((pharmacy, i) => {
      const angle = (i / here.length) * Math.PI * 2 + Math.PI / 4;
      placed.push({
        pharmacy,
        x: plate.x + Math.cos(angle) * ringOf(here.length),
        z: plate.z + Math.sin(angle) * ringOf(here.length),
      });
    });
  }
  return { plates, placed };
}

// Fits the state at any size and pins the HTML labels to their points in the scene.
function Stage({ labels, points }: { labels: Labels; points: Record<string, THREE.Vector3> }) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const projected = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    camera.zoom = Math.min(size.width / (STATE.across * 1.05), size.height / (STATE.tall + 7));
    camera.position.set(STATE.x + 150, 150, STATE.z + 150);
    camera.lookAt(STATE.x, 0, STATE.z);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useFrame(() => {
    for (const [key, point] of Object.entries(points)) {
      const el = labels.current[key];
      if (!el) continue;
      projected.copy(point).project(camera);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      el.style.opacity = '1';
    }
  });
  return null;
}

function Shop({ at, index, selected, still, onSelect }: { at: Placed; index: number; selected: boolean; still: boolean; onSelect: (code: string) => void }) {
  const pin = useRef<THREE.Mesh>(null);
  const height = selected ? 1.25 : 0.95;
  useFrame(({ clock }) => {
    if (!pin.current || still) return;
    pin.current.position.y = height + Math.sin(clock.elapsedTime * 2 + index) * 0.05;
    pin.current.rotation.y = clock.elapsedTime * (selected ? 2 : 0.8) + index;
  });

  return (
    <group
      position={[at.x, 0.1, at.z]}
      scale={SHOP_SCALE}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(at.pharmacy.code);
      }}
      onPointerOver={() => void (document.body.style.cursor = 'pointer')}
      onPointerOut={() => void (document.body.style.cursor = '')}
    >
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.34, 0.32, 0.34]} />
        <meshStandardMaterial color={SHOP} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.4, 0.07, 0.4]} />
        <meshStandardMaterial color={selected ? INK : GREEN} roughness={0.5} />
      </mesh>
      <mesh ref={pin} position={[0, height, 0]} scale={selected ? [1.5, 2.4, 1.5] : [1, 1.7, 1]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={selected ? 0.55 : 0.25} roughness={0.25} flatShading />
      </mesh>
    </group>
  );
}

function Road({ a, b }: { a: Plate; b: Plate }) {
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  return (
    <mesh position={[(a.x + b.x) / 2, 0.05, (a.z + b.z) / 2]} rotation={[0, -Math.atan2(b.z - a.z, b.x - a.x), 0]}>
      <boxGeometry args={[length, 0.04, 0.5]} />
      <meshStandardMaterial color={ROAD} roughness={0.9} />
    </mesh>
  );
}

// The state, cut to its real boundary. Drawn flat with north as +y, then laid down.
function StateSlab() {
  const shape = useMemo(() => new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, -p.z))), []);
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, -1.5]}>
        <extrudeGeometry args={[shape, { depth: 1.2, bevelEnabled: false }]} />
        <meshStandardMaterial color={SLAB} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, -0.3]}>
        <extrudeGeometry args={[shape, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color={GROUND} roughness={0.9} />
      </mesh>
      {/* Flat shadow under the slab. */}
      <mesh position={[0.5, -0.5, -2.6]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color={INK} transparent opacity={0.07} />
      </mesh>
    </group>
  );
}

export default function PharmacyMapScene({
  pharmacies,
  selected,
  onSelect,
}: {
  pharmacies: WellaPharmacy[];
  selected: string | undefined;
  onSelect: (code: string) => void;
}) {
  const still = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const { plates, placed } = useMemo(() => layout(pharmacies), [pharmacies]);
  const chosen = placed.find((at) => at.pharmacy.code === selected);
  const labels = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => () => void (document.body.style.cursor = ''), []);

  const points = useMemo(() => {
    const all: Record<string, THREE.Vector3> = {};
    // Area names sit on the near edge of their plate.
    for (const p of plates) all[p.area] = new THREE.Vector3(p.x + p.radius * 0.8, 0.1, p.z + p.radius * 0.8);
    if (chosen) all.chosen = new THREE.Vector3(chosen.x, 5.6, chosen.z);
    return all;
  }, [plates, chosen]);

  return (
    <div className="relative size-full overflow-hidden rounded-[inherit]">
      <Canvas flat dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <OrthographicCamera makeDefault position={[150, 150, 150]} zoom={15} near={1} far={1000} />
        <Stage labels={labels} points={points} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[4, 12, 9]} intensity={1.7} />
        <directionalLight position={[-6, 6, -4]} intensity={0.5} />

        <StateSlab />
        {enuguRoads.map(([from, to]) => {
          const a = plates.find((p) => p.area === from);
          const b = plates.find((p) => p.area === to);
          return a && b && <Road key={`${from}-${to}`} a={a} b={b} />;
        })}
        {plates.map((plate) => (
          <mesh key={plate.area} position={[plate.x, 0.07, plate.z]}>
            <cylinderGeometry args={[plate.radius, plate.radius, 0.08, 40]} />
            <meshStandardMaterial color={PLATE} roughness={0.9} />
          </mesh>
        ))}
        {placed.map((at, index) => (
          <Shop key={at.pharmacy.code} at={at} index={index} still={still} selected={selected === at.pharmacy.code} onSelect={onSelect} />
        ))}
      </Canvas>

      {plates.map((plate) => (
        <span
          key={plate.area}
          ref={(el) => void (labels.current[plate.area] = el)}
          className="label pointer-events-none absolute top-0 left-0 w-max rounded-full bg-surface/85 px-1.5 text-[10px]! text-text-muted opacity-0"
        >
          {plate.area}
        </span>
      ))}
      {chosen && (
        <span
          ref={(el) => void (labels.current.chosen = el)}
          className="pointer-events-none absolute top-0 left-0 w-max max-w-[220px] rounded-full bg-primary px-3 py-1.5 text-center text-xs font-medium text-on-primary opacity-0 shadow-sm"
        >
          {chosen.pharmacy.name}
        </span>
      )}
    </div>
  );
}
