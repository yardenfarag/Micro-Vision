"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { TemplateId } from "@/lib/taxonomy";
import type { ViewerColors } from "@/lib/viewerThemes";
import type { ViewerPartId } from "@/lib/content/parts";
import { hasArrangementPart } from "@/lib/content/parts";

const SELECTED_COLOR = "#eeba30";
const SELECTED_EMISSIVE = "#8a6a10";

type SelectHandler = (id: ViewerPartId) => void;

function useSelectHandlers(onSelect: SelectHandler) {
  return useMemo(
    () => ({
      onClick: (e: ThreeEvent<MouseEvent>, id: ViewerPartId) => {
        e.stopPropagation();
        onSelect(id);
      },
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        document.body.style.cursor = "auto";
      },
    }),
    [onSelect]
  );
}

function CellMaterial({
  colors,
  selected,
}: {
  colors: ViewerColors;
  selected: boolean;
}) {
  return (
    <meshStandardMaterial
      color={selected ? SELECTED_COLOR : colors.cell}
      emissive={selected ? SELECTED_EMISSIVE : colors.emissive}
      emissiveIntensity={selected ? 0.55 : 0.35}
      roughness={0.35}
      metalness={0.1}
    />
  );
}

/** Visual Gram envelope — highlights when selected; does not capture clicks. */
function EnvelopeMaterial({ selected }: { selected: boolean }) {
  return (
    <meshStandardMaterial
      color={selected ? SELECTED_COLOR : "#c8d6f0"}
      transparent
      opacity={selected ? 0.4 : 0.16}
      roughness={0.55}
      metalness={0.05}
      depthWrite={false}
    />
  );
}

function ArrangementMaterial({ selected }: { selected: boolean }) {
  return (
    <meshStandardMaterial
      color={selected ? SELECTED_COLOR : "#7dd3fc"}
      transparent
      opacity={selected ? 0.85 : 0.45}
      roughness={0.45}
      metalness={0.1}
      emissive={selected ? SELECTED_EMISSIVE : "#0c4a6e"}
      emissiveIntensity={selected ? 0.4 : 0.15}
    />
  );
}

function Coccus({
  position,
  colors,
  selected,
  onSelect,
  scale = 1,
}: {
  position: [number, number, number];
  colors: ViewerColors;
  selected: ViewerPartId | null;
  onSelect: SelectHandler;
  scale?: number;
}) {
  const h = useSelectHandlers(onSelect);

  return (
    <group position={position} scale={scale}>
      <mesh
        castShadow
        onClick={(e) => h.onClick(e, "cell_body")}
        onPointerOver={h.onPointerOver}
        onPointerOut={h.onPointerOut}
      >
        <sphereGeometry args={[0.5, 48, 48]} />
        <CellMaterial colors={colors} selected={selected === "cell_body"} />
      </mesh>
      {/* Outer envelope captures clicks first (Zoa-style shell); use panel chips for cell body if needed. */}
      <mesh
        renderOrder={2}
        onClick={(e) => h.onClick(e, "cell_envelope")}
        onPointerOver={h.onPointerOver}
        onPointerOut={h.onPointerOut}
      >
        <sphereGeometry args={[0.62, 32, 32]} />
        <EnvelopeMaterial selected={selected === "cell_envelope"} />
      </mesh>
    </group>
  );
}

function Rod({
  position,
  rotation = [0, 0, 0],
  colors,
  selected,
  onSelect,
  length = 1.4,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  colors: ViewerColors;
  selected: ViewerPartId | null;
  onSelect: SelectHandler;
  length?: number;
}) {
  const h = useSelectHandlers(onSelect);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        castShadow
        onClick={(e) => h.onClick(e, "cell_body")}
        onPointerOver={h.onPointerOver}
        onPointerOut={h.onPointerOut}
      >
        <capsuleGeometry args={[0.32, length, 16, 32]} />
        <CellMaterial colors={colors} selected={selected === "cell_body"} />
      </mesh>
      <mesh
        renderOrder={2}
        onClick={(e) => h.onClick(e, "cell_envelope")}
        onPointerOver={h.onPointerOver}
        onPointerOut={h.onPointerOut}
      >
        <capsuleGeometry args={[0.42, length + 0.08, 12, 24]} />
        <EnvelopeMaterial selected={selected === "cell_envelope"} />
      </mesh>
    </group>
  );
}

function TubeFromCurve({
  points,
  radius,
  colors,
  selected,
  onSelect,
  envelopeScale = 1.28,
}: {
  points: THREE.Vector3[];
  radius: number;
  colors: ViewerColors;
  selected: ViewerPartId | null;
  onSelect: SelectHandler;
  envelopeScale?: number;
}) {
  const h = useSelectHandlers(onSelect);
  const bodyGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
    return new THREE.TubeGeometry(curve, 80, radius, 24, false);
  }, [points, radius]);
  const envelopeGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
    return new THREE.TubeGeometry(curve, 80, radius * envelopeScale, 20, false);
  }, [points, radius, envelopeScale]);

  return (
    <group>
      <mesh
        geometry={bodyGeom}
        castShadow
        onClick={(e) => h.onClick(e, "cell_body")}
        onPointerOver={h.onPointerOver}
        onPointerOut={h.onPointerOut}
      >
        <CellMaterial colors={colors} selected={selected === "cell_body"} />
      </mesh>
      <mesh
        geometry={envelopeGeom}
        renderOrder={2}
        onClick={(e) => h.onClick(e, "cell_envelope")}
        onPointerOver={h.onPointerOver}
        onPointerOut={h.onPointerOut}
      >
        <EnvelopeMaterial selected={selected === "cell_envelope"} />
      </mesh>
    </group>
  );
}

/**
 * Thin orbital ring around multi-cell scenes — clickable "arrangement" region
 * that does not cover the cells themselves.
 */
function ArrangementRing({
  selected,
  onSelect,
  radius = 2.2,
}: {
  selected: ViewerPartId | null;
  onSelect: SelectHandler;
  radius?: number;
}) {
  const h = useSelectHandlers(onSelect);
  return (
    <mesh
      rotation={[Math.PI / 2.15, 0.15, 0]}
      onClick={(e) => h.onClick(e, "arrangement")}
      onPointerOver={h.onPointerOver}
      onPointerOut={h.onPointerOut}
    >
      <torusGeometry args={[radius, 0.055, 12, 64]} />
      <ArrangementMaterial selected={selected === "arrangement"} />
    </mesh>
  );
}

export function TemplateMeshes({
  templateId,
  colors,
  selected,
  onSelect,
}: {
  templateId: TemplateId;
  colors: ViewerColors;
  selected: ViewerPartId | null;
  onSelect: SelectHandler;
}) {
  const showArrangement = hasArrangementPart(templateId);

  switch (templateId) {
    case "cocci_single":
      return (
        <Coccus
          position={[0, 0, 0]}
          colors={colors}
          selected={selected}
          onSelect={onSelect}
        />
      );

    case "cocci_pair":
      return (
        <group>
          {showArrangement ? (
            <ArrangementRing selected={selected} onSelect={onSelect} radius={1.35} />
          ) : null}
          <Coccus position={[-0.46, 0, 0]} colors={colors} selected={selected} onSelect={onSelect} />
          <Coccus position={[0.46, 0, 0]} colors={colors} selected={selected} onSelect={onSelect} />
        </group>
      );

    case "cocci_chain":
      return (
        <group>
          {showArrangement ? (
            <ArrangementRing selected={selected} onSelect={onSelect} radius={2.55} />
          ) : null}
          {[-2, -1.2, -0.4, 0.4, 1.2, 2].map((x, i) => (
            <Coccus
              key={i}
              position={[x, Math.sin(i * 1.1) * 0.12, Math.cos(i * 0.7) * 0.1]}
              colors={colors}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </group>
      );

    case "cocci_cluster":
      return (
        <group>
          {showArrangement ? (
            <ArrangementRing selected={selected} onSelect={onSelect} radius={1.85} />
          ) : null}
          {CLUSTER_POS.map((p, i) => (
            <Coccus
              key={i}
              position={p}
              colors={colors}
              selected={selected}
              onSelect={onSelect}
              scale={0.8 + (i % 3) * 0.12}
            />
          ))}
        </group>
      );

    case "bacillus_single":
      return (
        <Rod
          position={[0, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          colors={colors}
          selected={selected}
          onSelect={onSelect}
        />
      );

    case "bacillus_cluster":
      return (
        <group>
          {showArrangement ? (
            <ArrangementRing selected={selected} onSelect={onSelect} radius={1.7} />
          ) : null}
          {ROD_CLUSTER.map((r, i) => (
            <Rod
              key={i}
              position={r.pos}
              rotation={r.rot}
              colors={colors}
              selected={selected}
              onSelect={onSelect}
              length={1.1}
            />
          ))}
        </group>
      );

    case "vibrio_single":
      return <VibrioMesh colors={colors} selected={selected} onSelect={onSelect} />;

    case "spirillum_single":
      return <SpirillumMesh colors={colors} selected={selected} onSelect={onSelect} />;

    case "mixed_bacteria_scene":
      return (
        <group>
          {showArrangement ? (
            <ArrangementRing selected={selected} onSelect={onSelect} radius={2.35} />
          ) : null}
          <Coccus
            position={[-1.5, 0.6, 0]}
            colors={colors}
            selected={selected}
            onSelect={onSelect}
            scale={0.85}
          />
          <Coccus
            position={[-1.0, -0.5, 0.3]}
            colors={colors}
            selected={selected}
            onSelect={onSelect}
            scale={0.75}
          />
          <Rod
            position={[1.0, 0.4, 0]}
            rotation={[0, 0, Math.PI / 3]}
            colors={colors}
            selected={selected}
            onSelect={onSelect}
            length={1.1}
          />
          <Rod
            position={[0.6, -0.7, -0.2]}
            rotation={[0, 0, -Math.PI / 5]}
            colors={colors}
            selected={selected}
            onSelect={onSelect}
            length={1.0}
          />
        </group>
      );

    case "generic_bacteria":
    default:
      return (
        <group>
          {showArrangement ? (
            <ArrangementRing selected={selected} onSelect={onSelect} radius={1.75} />
          ) : null}
          <Coccus
            position={[-0.7, 0, 0]}
            colors={colors}
            selected={selected}
            onSelect={onSelect}
            scale={0.9}
          />
          <Rod
            position={[0.9, 0, 0]}
            rotation={[0, 0, Math.PI / 2.4]}
            colors={colors}
            selected={selected}
            onSelect={onSelect}
            length={1.0}
          />
        </group>
      );
  }
}

function VibrioMesh({
  colors,
  selected,
  onSelect,
}: {
  colors: ViewerColors;
  selected: ViewerPartId | null;
  onSelect: SelectHandler;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const a = -Math.PI / 2.2 + t * (Math.PI * 1.05);
      pts.push(new THREE.Vector3(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0));
    }
    return pts;
  }, []);
  return (
    <TubeFromCurve
      points={points}
      radius={0.33}
      colors={colors}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

function SpirillumMesh({
  colors,
  selected,
  onSelect,
}: {
  colors: ViewerColors;
  selected: ViewerPartId | null;
  onSelect: SelectHandler;
}) {
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
        new THREE.Vector3(
          t * length - length / 2,
          Math.sin(angle) * amp,
          Math.cos(angle) * amp
        )
      );
    }
    return pts;
  }, []);
  return (
    <TubeFromCurve
      points={points}
      radius={0.24}
      colors={colors}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

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
