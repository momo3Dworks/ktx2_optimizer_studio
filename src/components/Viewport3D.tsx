import React, { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ViewMode } from '../types/gltf';
import { Language, translations } from '../i18n/translations';
import { AnimationDriver } from './AnimationDriver';
import { AnimationBar } from './AnimationBar';
import { Perf } from 'r3f-webgpu-perf';

interface AnimationInfo {
  name: string;
  duration: number;
  tracks: number;
}

interface AnimationState {
  activeClipName: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  duration: number;
  seekTo: number | null;
}

interface Viewport3DProps {
  lang: Language;
  originalBuffer: ArrayBuffer | null;
  compressedBuffer: ArrayBuffer | null;
  viewMode: ViewMode;
  selectedNodeName: string | null;
  highlightedObjectNames: string[];
}

/* ─────────────────────────────────────────────
   ModelViewer — loads a GLB from an ArrayBuffer,
   exposes its scene & clips, then drives animations
   ───────────────────────────────────────────── */
function ModelViewer({
  buffer,
  selectedNodeName,
  highlightedObjectNames,
  onLoaded,
  animState,
  onTimeUpdate,
  onSeekConsumed,
}: {
  buffer: ArrayBuffer;
  selectedNodeName: string | null;
  highlightedObjectNames: string[];
  onLoaded?: (clips: THREE.AnimationClip[]) => void;
  animState: AnimationState;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onSeekConsumed: () => void;
}) {
  const [gltfScene, setGltfScene] = useState<THREE.Group | null>(null);
  const [clips, setClips] = useState<THREE.AnimationClip[]>([]);

  useEffect(() => {
    if (!buffer) return;

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.parse(
      buffer,
      '',
      (gltf) => {
        setGltfScene(gltf.scene);
        setClips(gltf.animations ?? []);
        onLoaded?.(gltf.animations ?? []);
      },
      (err) => console.error('GLTF loader parse error:', err)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buffer]);

  // Apply selection/highlight visual
  useEffect(() => {
    if (!gltfScene) return;
    gltfScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const isSelected = selectedNodeName === obj.name;
        const isHighlighted = highlightedObjectNames.includes(obj.name);
        if (isSelected || isHighlighted) {
          if (!obj.userData.originalMaterial) obj.userData.originalMaterial = obj.material;
          obj.material = new THREE.MeshStandardMaterial({
            color: isSelected ? '#00f2fe' : '#fbbf24',
            emissive: isSelected ? '#005577' : '#d97706',
            wireframe: true,
            roughness: 0.1,
          });
        } else if (obj.userData.originalMaterial) {
          obj.material = obj.userData.originalMaterial;
          delete obj.userData.originalMaterial;
        }
      }
    });
  }, [gltfScene, selectedNodeName, highlightedObjectNames]);

  if (!gltfScene) return null;

  return (
    <>
      <primitive object={gltfScene} />
      {clips.length > 0 && animState.activeClipName && (
        <AnimationDriver
          scene={gltfScene}
          clips={clips}
          activeClipName={animState.activeClipName}
          isPlaying={animState.isPlaying}
          playbackSpeed={animState.playbackSpeed}
          onTimeUpdate={onTimeUpdate}
          seekTo={animState.seekTo}
          onSeekConsumed={onSeekConsumed}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   Viewport3D — main exported component
   ───────────────────────────────────────────── */
export const Viewport3D: React.FC<Viewport3DProps> = ({
  lang,
  originalBuffer,
  compressedBuffer,
  viewMode,
  selectedNodeName,
  highlightedObjectNames,
}) => {
  const t = translations[lang];

  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);

  // Animation state — shared across viewports
  const [animations, setAnimations] = useState<AnimationInfo[]>([]);
  const [animState, setAnimState] = useState<AnimationState>({
    activeClipName: null,
    isPlaying: false,
    playbackSpeed: 1,
    currentTime: 0,
    duration: 0,
    seekTo: null,
  });

  // Reset animations when the buffer changes
  useEffect(() => {
    setAnimations([]);
    setAnimState({
      activeClipName: null,
      isPlaying: false,
      playbackSpeed: 1,
      currentTime: 0,
      duration: 0,
      seekTo: null,
    });
  }, [originalBuffer]);

  const handleLoaded = useCallback((clips: THREE.AnimationClip[]) => {
    const infos: AnimationInfo[] = clips.map((c) => ({
      name: c.name || 'Unnamed',
      duration: c.duration,
      tracks: c.tracks.length,
    }));
    setAnimations(infos);
    // Auto-select first clip but don't auto-play
    if (infos.length > 0) {
      setAnimState((prev) => ({ ...prev, activeClipName: infos[0].name, duration: infos[0].duration }));
    }
  }, []);

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    setAnimState((prev) => ({ ...prev, currentTime, duration }));
  }, []);

  const handleSeekConsumed = useCallback(() => {
    setAnimState((prev) => ({ ...prev, seekTo: null }));
  }, []);

  const handleSeek = useCallback((time: number) => {
    setAnimState((prev) => ({ ...prev, seekTo: time, currentTime: time }));
  }, []);

  const handleStop = useCallback(() => {
    setAnimState((prev) => ({ ...prev, isPlaying: false, seekTo: 0, currentTime: 0 }));
  }, []);

  // Build active clip's duration from animations list when clip changes
  useEffect(() => {
    const found = animations.find((a) => a.name === animState.activeClipName);
    if (found) {
      setAnimState((prev) => ({ ...prev, duration: found.duration }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animState.activeClipName]);

  const activeBuffer = viewMode === 'compressed' && compressedBuffer ? compressedBuffer : originalBuffer;

  return (
    <div style={{ flex: 1, height: 'calc(100vh - 46px)', position: 'relative', overflow: 'hidden', background: '#040711' }}>
      {/* ── Viewport badge ── */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span
          className="skeuo-card"
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
          }}
        >
          {viewMode === 'original' && t.vpOriginal}
          {viewMode === 'compressed' && t.vpCompressed}
          {viewMode === 'split' && t.vpSplit}
        </span>
      </div>

      {/* ── Split-Screen Mode ── */}
      {viewMode === 'split' && originalBuffer && compressedBuffer ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
          {/* Left: Original */}
          <div
            style={{ width: `${splitSliderPos}%`, height: '100%', borderRight: '2px solid var(--accent-cyan)', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#fff' }}
            >
              {t.viewOriginal}
            </div>
            <Canvas camera={{ position: [3, 2, 4], fov: 50 }} shadows>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <Environment preset="city" />
              <Suspense fallback={null}>
                <ModelViewer
                  buffer={originalBuffer}
                  selectedNodeName={selectedNodeName}
                  highlightedObjectNames={highlightedObjectNames}
                  animState={animState}
                  onTimeUpdate={handleTimeUpdate}
                  onSeekConsumed={handleSeekConsumed}
                />
              </Suspense>
              <Grid infiniteGrid fadeDistance={20} cellColor="#1e293b" sectionColor="#00f2fe" />
              <OrbitControls makeDefault />
            </Canvas>
          </div>

          {/* Right: Compressed */}
          <div
            style={{ width: `${100 - splitSliderPos}%`, height: '100%', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, background: 'rgba(245,158,11,0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--warm-gold)' }}
            >
              {t.viewCompressed}
            </div>
            <Canvas camera={{ position: [3, 2, 4], fov: 50 }} shadows>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <Environment preset="city" />
              <Suspense fallback={null}>
                <ModelViewer
                  buffer={compressedBuffer}
                  selectedNodeName={selectedNodeName}
                  highlightedObjectNames={highlightedObjectNames}
                  animState={animState}
                  onTimeUpdate={handleTimeUpdate}
                  onSeekConsumed={handleSeekConsumed}
                />
              </Suspense>
              <Grid infiniteGrid fadeDistance={20} cellColor="#1e293b" sectionColor="#fbbf24" />
              <OrbitControls makeDefault />
            </Canvas>
          </div>

          {/* Split divider slider */}
          <input
            type="range"
            min="10"
            max="90"
            value={splitSliderPos}
            onChange={(e) => setSplitSliderPos(Number(e.target.value))}
            className="skeuo-slider"
            style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 15, width: '320px' }}
          />
        </div>
      ) : (
        /* ── Single Viewport ── */
        <Canvas camera={{ position: [3, 2, 4], fov: 50 }} shadows>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />
          <Environment preset="city" />

          <Suspense
            fallback={
              <Html center>
                <div style={{ color: 'var(--warm-gold)', fontSize: '0.9rem', fontWeight: 700 }}>
                  {t.loadingScene}
                </div>
              </Html>
            }
          >
            {activeBuffer && (
              <ModelViewer
                buffer={activeBuffer}
                selectedNodeName={selectedNodeName}
                highlightedObjectNames={highlightedObjectNames}
                onLoaded={handleLoaded}
                animState={animState}
                onTimeUpdate={handleTimeUpdate}
                onSeekConsumed={handleSeekConsumed}
              />
            )}
          </Suspense>

          <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={10} blur={2} far={4} />
          <Grid infiniteGrid fadeDistance={25} cellColor="#1e293b" sectionColor="#00f2fe" />
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
          <Perf position="top-right" showGauge={true} minimal={true} />
        </Canvas>
      )}

      {/* ── Animation Bar (always rendered if buffer loaded) ── */}
      {(originalBuffer || compressedBuffer) && (
        <AnimationBar
          lang={lang}
          animations={animations}
          activeClipName={animState.activeClipName}
          setActiveClipName={(name) =>
            setAnimState((prev) => ({ ...prev, activeClipName: name, seekTo: 0, currentTime: 0 }))
          }
          isPlaying={animState.isPlaying}
          setIsPlaying={(v) => setAnimState((prev) => ({ ...prev, isPlaying: v }))}
          playbackSpeed={animState.playbackSpeed}
          setPlaybackSpeed={(v) => setAnimState((prev) => ({ ...prev, playbackSpeed: v }))}
          currentTime={animState.currentTime}
          duration={animState.duration}
          onSeek={handleSeek}
          onStop={handleStop}
        />
      )}
    </div>
  );
};
