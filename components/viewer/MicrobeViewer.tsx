"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { ColorTheme, TemplateId } from "@/lib/taxonomy";
import { VIEWER_THEMES } from "@/lib/viewerThemes";
import { getViewerParts, type ViewerPartId } from "@/lib/content/parts";
import { TemplateMeshes } from "./templates";
import { PartPanel } from "./PartPanel";

type ControlsRef = React.ElementRef<typeof OrbitControls>;

const MIN_DIST = 3;
const MAX_DIST = 14;

export function MicrobeViewer({
  templateId,
  colorTheme,
}: {
  templateId: TemplateId;
  colorTheme: ColorTheme;
}) {
  const controlsRef = useRef<ControlsRef>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selected, setSelected] = useState<ViewerPartId | null>(null);
  const colors = VIEWER_THEMES[colorTheme];
  const parts = useMemo(
    () => getViewerParts(templateId, colorTheme),
    [templateId, colorTheme]
  );

  const zoom = (factor: number) => {
    const c = controlsRef.current;
    if (!c) return;
    const cam = c.object as THREE.PerspectiveCamera;
    const dir = cam.position.clone().sub(c.target);
    const dist = dir.length() * factor;
    const clamped = Math.max(MIN_DIST, Math.min(MAX_DIST, dist));
    dir.setLength(clamped);
    cam.position.copy(c.target.clone().add(dir));
    c.update();
  };

  const reset = () => {
    controlsRef.current?.reset();
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-3)] sm:flex-1"
        style={{ backgroundImage: colors.backdrop }}
      >
        <Canvas
          camera={{ position: [0, 0.6, 6], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
          onPointerMissed={() => setSelected(null)}
        >
          <color attach="background" args={["#070b15"]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} castShadow />
          <directionalLight position={[-5, -2, -4]} intensity={0.5} color={colors.rim} />
          <Suspense fallback={null}>
            <group position={[0, 0.1, 0]}>
              <TemplateMeshes
                templateId={templateId}
                colors={colors}
                selected={selected}
                onSelect={setSelected}
              />
            </group>
            <ContactShadows
              position={[0, -1.6, 0]}
              opacity={0.4}
              scale={12}
              blur={2.6}
              far={4}
              color="#000000"
            />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            autoRotate={autoRotate && !selected}
            autoRotateSpeed={1.1}
            minDistance={MIN_DIST}
            maxDistance={MAX_DIST}
            enableDamping
          />
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          <span className="pointer-events-auto rounded-md border border-[var(--border)] bg-[rgba(6,9,18,0.7)] px-2 py-1 text-[10px] text-[var(--muted-2)] backdrop-blur">
            {colors.label}
          </span>
          <div className="pointer-events-auto flex items-center gap-1.5">
            <ControlButton label="Zoom in" onClick={() => zoom(0.8)}>
              <PlusIcon />
            </ControlButton>
            <ControlButton label="Zoom out" onClick={() => zoom(1.25)}>
              <MinusIcon />
            </ControlButton>
            <ControlButton
              label={autoRotate ? "Pause rotation" : "Auto-rotate"}
              active={autoRotate}
              onClick={() => setAutoRotate((v) => !v)}
            >
              <RotateIcon />
            </ControlButton>
            <ControlButton label="Reset view" onClick={reset}>
              <ResetIcon />
            </ControlButton>
          </div>
        </div>

        <span className="pointer-events-none absolute left-3 top-3 rounded-md border border-[var(--border)] bg-[rgba(6,9,18,0.7)] px-2 py-1 text-[10px] text-[var(--muted-2)] backdrop-blur">
          Drag to rotate · scroll to zoom · click a region
        </span>
      </div>

      <div className="h-[280px] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4 sm:h-auto sm:w-64 sm:flex-none sm:self-stretch">
        <PartPanel parts={parts} selected={selected} onSelect={setSelected} />
      </div>
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg border backdrop-blur transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--border)] bg-[rgba(6,9,18,0.7)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function RotateIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17 3v3.5h-3.5M7 21v-3.5h3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12a8 8 0 1 1 2.3 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M4 20v-4h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
