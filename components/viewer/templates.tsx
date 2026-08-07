"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { TemplateId } from "@/lib/taxonomy";
import type { ViewerColors } from "@/lib/viewerThemes";

function useCellMaterial(colors: ViewerColors) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.cell),
        emissive: new THREE.Color(colors.emissive),
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.1,
      }),
    [colors.cell, colors.emissive]
  );
}

function Coccus({
  position,
  material,
  scale = 1,
}: {
  position: [number, number, number];
  material: THREE.Material;
  scale?: number;
}) {
  return (
    <mesh position={position} material={material} scale={scale} castShadow>
      <sphereGeometry args={[0.5, 48, 48]} />
    </mesh>
  );
}

function Rod({
  position,
  rotation = [0, 0, 0],
  material,
  length = 1.4,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material;
  length?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow>
      <capsuleGeometry args={[0.32, length, 16, 32]} />
    </mesh>
  );
}

function TubeFromCurve({
  points,
  radius,
  material,
}: {
  points: THREE.Vector3[];
  radius: number;
  material: THREE.Material;
}) {
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
    return new THREE.TubeGeometry(curve, 80, radius, 24, false);
  }, [points, radius]);
  return <mesh geometry={geom} material={material} castShadow />;
}

export function TemplateMeshes({
  templateId,
  colors,
}: {
  templateId: TemplateId;
  colors: ViewerColors;
}) {
  const material = useCellMaterial(colors);

  switch (templateId) {
    case "cocci_single":
      return <Coccus position={[0, 0, 0]} material={material} />;

    case "cocci_pair":
      return (
        <group>
          <Coccus position={[-0.46, 0, 0]} material={material} />
          <Coccus position={[0.46, 0, 0]} material={material} />
        </group>
      );

    case "cocci_chain":
      return (
        <group>
          {[-2, -1.2, -0.4, 0.4, 1.2, 2].map((x, i) => (
            <Coccus
              key={i}
              position={[x, Math.sin(i * 1.1) * 0.12, Math.cos(i * 0.7) * 0.1]}
              material={material}
            />
          ))}
        </group>
      );

    case "cocci_cluster":
      return (
        <group>
          {CLUSTER_POS.map((p, i) => (
            <Coccus key={i} position={p} material={material} scale={0.8 + (i % 3) * 0.12} />
          ))}
        </group>
      );

    case "bacillus_single":
      return <Rod position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={material} />;

    case "bacillus_cluster":
      return (
        <group>
          {ROD_CLUSTER.map((r, i) => (
            <Rod
              key={i}
              position={r.pos}
              rotation={r.rot}
              material={material}
              length={1.1}
            />
          ))}
        </group>
      );

    case "vibrio_single":
      return <VibrioMesh material={material} />;

    case "spirillum_single":
      return <SpirillumMesh material={material} />;

    case "mixed_bacteria_scene":
      return (
        <group>
          <Coccus position={[-1.5, 0.6, 0]} material={material} scale={0.85} />
          <Coccus position={[-1.0, -0.5, 0.3]} material={material} scale={0.75} />
          <Rod position={[1.0, 0.4, 0]} rotation={[0, 0, Math.PI / 3]} material={material} length={1.1} />
          <Rod position={[0.6, -0.7, -0.2]} rotation={[0, 0, -Math.PI / 5]} material={material} length={1.0} />
        </group>
      );

    case "generic_bacteria":
    default:
      return (
        <group>
          <Coccus position={[-0.7, 0, 0]} material={material} scale={0.9} />
          <Rod position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2.4]} material={material} length={1.0} />
        </group>
      );
  }
}

function VibrioMesh({ material }: { material: THREE.Material }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    // Comma / C-shaped curved rod.
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const a = (-Math.PI / 2.2) + t * (Math.PI * 1.05);
      pts.push(new THREE.Vector3(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0));
    }
    return pts;
  }, []);
  return <TubeFromCurve points={points} radius={0.33} material={material} />;
}

function SpirillumMesh({ material }: { material: THREE.Material }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 2.6;
    const amp = 0.7;
    const length = 3.6;
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2 * turns;
      pts.push(
        new THREE.Vector3(t * length - length / 2, Math.sin(angle) * amp, Math.cos(angle) * amp)
      );
    }
    return pts;
  }, []);
  return <TubeFromCurve points={points} radius={0.24} material={material} />;
}

// Deterministic grape-like cluster positions.
const CLUSTER_POS: [number, number, number][] = [
  [0, 0, 0],
  [0.7, 0.4, 0.2],
  [-0.6, 0.5, -0.2],
  [0.5, -0.6, 0.3],
  [-0.5, -0.5, 0.2],
  [0.1, 0.8, -0.4],
  [-0.2, -0.9, -0.3],
  [0.9, -0.1, -0.4],
  [-0.9, -0.1, 0.4],
  [0.2, 0.1, 0.7],
];

const ROD_CLUSTER: { pos: [number, number, number]; rot: [number, number, number] }[] = [
  { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2] },
  { pos: [0.5, 0.5, 0.2], rot: [0, 0, Math.PI / 3] },
  { pos: [-0.5, 0.4, -0.2], rot: [0, 0, -Math.PI / 4] },
  { pos: [0.3, -0.6, 0.3], rot: [0, 0, Math.PI / 5] },
  { pos: [-0.4, -0.5, -0.3], rot: [0.3, 0.2, -Math.PI / 2.5] },
];
