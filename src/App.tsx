import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { Viewport3D } from './components/Viewport3D';
import { CompressionModal } from './components/CompressionModal';
import { MobileDock } from './components/MobileDock';
import { MobileActionsModal } from './components/MobileActionsModal';
import { GLBLoaderOverlay } from './components/GLBLoaderOverlay';
import { parseGLBStructure, processGLB } from './services/gltfProcessor';
import { Language } from './i18n/translations';
import {
  SceneNodeInfo,
  TextureItem,
  MeshOptionsState,
  VertexQuantizationState,
  VertexCompressionState,
  TextureCompressionSettings,
  ViewMode,
  CompressionMetrics,
  ModelFileStats
} from './types/gltf';

import { THEME_PALETTES } from './themes/palettes';

export type Theme = 'default' | 'cyberpunk' | 'brutalist' | 'liquid' | 'glassmorphism' | 'neumorphism';

export const App: React.FC = () => {
  // i18n Language State ('es' | 'en')
  const [lang, setLang] = useState<Language>('es');

  // UI Theme & Palette State (Defaults to Neumorphism with High Contrast Shadows)
  const [theme, setTheme] = useState<Theme>('neumorphism');
  const [paletteId, setPaletteId] = useState<string>('slate-cyan');
  const [highContrastShadows, setHighContrastShadows] = useState<boolean>(false);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const pals = THEME_PALETTES[newTheme];
    if (pals && pals.length > 0) {
      setPaletteId(pals[0].id);
    }
  };

  useEffect(() => {
    const html = document.documentElement;
    const toRemove = Array.from(html.classList).filter(
      (c) => c.startsWith('theme-') || c.startsWith('palette-') || c === 'high-contrast-shadows'
    );
    toRemove.forEach((c) => html.classList.remove(c));

    if (theme !== 'default') html.classList.add(`theme-${theme}`);
    if (paletteId) html.classList.add(`palette-${paletteId}`);
    if (highContrastShadows) html.classList.add('high-contrast-shadows');
  }, [theme, paletteId, highContrastShadows]);

  // Mobile Responsive & Drawer State
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 860 : false);
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'left' | 'right'>('none');
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 860;
      setIsMobile(mobile);
      if (!mobile) setMobileDrawer('none');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // GLB Model State
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [compressedBuffer, setCompressedBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('wood_platform_diorama.glb');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [metrics, setMetrics] = useState<CompressionMetrics | null>(null);
  const [fileStats, setFileStats] = useState<ModelFileStats | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Loader overlay state
  type LoaderPhase = 'idle' | 'fetching' | 'parsing' | 'done' | 'error';
  const [loaderPhase, setLoaderPhase] = useState<LoaderPhase>('idle');
  const [loaderPct, setLoaderPct] = useState(0);
  const [loaderLabel, setLoaderLabel] = useState('');
  const [loaderError, setLoaderError] = useState<string | undefined>();
  const [loaderFileName, setLoaderFileName] = useState('');

  // Scene Tree & Protection State
  const [nodes, setNodes] = useState<SceneNodeInfo[]>([]);
  const [protectedNodeIds, setProtectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [highlightedObjectNames, setHighlightedObjectNames] = useState<string[]>([]);

  // Textures State
  const [textures, setTextures] = useState<TextureItem[]>([]);

  // 1) Mesh Options State
  const [meshOpts, setMeshOpts] = useState<MeshOptionsState>({
    flatten: false,
    dedup: true,
    join: false,
    weld: true,
    reorder: true,
    instance: false
  });

  // 2) Vertex Options State
  const [vertexQuantization, setVertexQuantization] = useState<VertexQuantizationState>({
    positions: 16,
    texcoords: 16,
    colors: 8,
    normals: 16
  });

  const [vertexCompression, setVertexCompression] = useState<VertexCompressionState>({
    type: 'draco',
    method: 'edgebreaker',
    quantizationScope: 'mesh'
  });

  // 3) Texture Compression Settings State
  const [textureSettings, setTextureSettings] = useState<TextureCompressionSettings>({
    format: 'ETC1S',
    resolution: 1024,
    mipmaps: true,
    quality: 128,
    effort: 2
  });

  // Load Default Wood Platform Diorama on Mount
  useEffect(() => {
    loadSampleModel();
  }, []);

  const loadSampleModel = async () => {
    const glbPath = '/assets/wood_platform_diorama.glb';
    const name = 'wood_platform_diorama.glb';
    setLoaderFileName(name);
    setLoaderPhase('fetching');
    setLoaderPct(0);
    setLoaderError(undefined);
    setIsProcessing(true);
    try {
      // Stream with progress
      const response = await fetch(glbPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentLength = Number(response.headers.get('Content-Length') ?? 0);
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength > 0) setLoaderPct(Math.min(99, (received / contentLength) * 100));
      }
      setLoaderPct(100);
      // Concat all chunks
      const totalLen = chunks.reduce((s, c) => s + c.length, 0);
      const buffer = new ArrayBuffer(totalLen);
      const view = new Uint8Array(buffer);
      let offset = 0;
      for (const chunk of chunks) { view.set(chunk, offset); offset += chunk.length; }

      setFileName(name);
      setLoaderPhase('parsing');
      await loadGLBBuffer(buffer, totalLen);
      setLoaderPhase('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error loading default GLB:', msg);
      setLoaderPhase('error');
      setLoaderError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadGLBBuffer = async (buffer: ArrayBuffer, fileSizeBytes?: number) => {
    setOriginalBuffer(buffer);
    setCompressedBuffer(null);
    setViewMode('original');
    setMetrics(null);
    setIsReportModalOpen(false);

    const { nodes: parsedNodes, textures: parsedTextures, vertexCount, faceCount, meshCount } = await parseGLBStructure(buffer);
    setNodes(parsedNodes);
    setTextures(parsedTextures);

    // Build file stats for header display
    setFileStats({
      sizeBytes: fileSizeBytes ?? buffer.byteLength,
      vertexCount,
      faceCount,
      textureCount: parsedTextures.length,
      meshCount
    });

    // Default protect empties, splines, cameras, lights
    const initialProtected = new Set<string>();
    const collectDefaultProtected = (nList: SceneNodeInfo[]) => {
      nList.forEach((n) => {
        if (n.protected || n.type === 'empty' || n.type === 'spline' || n.type === 'camera' || n.type === 'light') {
          initialProtected.add(n.name);
        }
        if (n.children) collectDefaultProtected(n.children);
      });
    };
    collectDefaultProtected(parsedNodes);
    setProtectedNodeIds(initialProtected);
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setLoaderFileName(file.name);
    setLoaderPhase('parsing');
    setLoaderError(undefined);
    try {
      const buffer = await file.arrayBuffer();
      await loadGLBBuffer(buffer, file.size);
      setLoaderPhase('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error reading file:', msg);
      setLoaderPhase('error');
      setLoaderError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleNodeProtection = (nodeName: string) => {
    setProtectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeName)) {
        next.delete(nodeName);
      } else {
        next.add(nodeName);
      }
      return next;
    });
  };

  // Main Compress Action
  const handleCompress = async () => {
    if (!originalBuffer) return;

    setIsProcessing(true);
    try {
      const { compressedBuffer: resultBuffer, metrics: resMetrics } = await processGLB(
        originalBuffer,
        protectedNodeIds,
        meshOpts,
        vertexQuantization,
        vertexCompression,
        textures,
        textureSettings
      );

      setCompressedBuffer(resultBuffer);
      setMetrics(resMetrics);
      setViewMode('compressed');
      setIsReportModalOpen(true);
    } catch (err) {
      console.error('Compression error:', err);
      alert(lang === 'es' ? 'Ocurrió un error al procesar el GLB. Revisa la consola.' : 'An error occurred during GLB processing. Check console.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Compressed GLB File
  const handleDownload = () => {
    if (!compressedBuffer) return;
    const blob = new Blob([compressedBuffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.(glb|gltf)$/i, '_compressed.glb');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header
        lang={lang}
        setLang={setLang}
        fileName={fileName}
        isProcessing={isProcessing}
        viewMode={viewMode}
        setViewMode={setViewMode}
        metrics={metrics}
        fileStats={fileStats}
        hasCompressed={!!compressedBuffer}
        onFileUpload={handleFileUpload}
        onLoadSample={loadSampleModel}
        onCompress={handleCompress}
        onDownload={handleDownload}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        isMobile={isMobile}
        onOpenMobileActions={() => setIsMobileActionsOpen(true)}
      />

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Desktop LeftPanel */}
        {!isMobile && (
          <LeftPanel
            lang={lang}
            theme={theme}
            setTheme={handleThemeChange}
            paletteId={paletteId}
            setPaletteId={setPaletteId}
            highContrastShadows={highContrastShadows}
            setHighContrastShadows={setHighContrastShadows}
            meshOpts={meshOpts}
            setMeshOpts={setMeshOpts}
            vertexQuantization={vertexQuantization}
            setVertexQuantization={setVertexQuantization}
            vertexCompression={vertexCompression}
            setVertexCompression={setVertexCompression}
            textures={textures}
            setTextures={setTextures}
            textureSettings={textureSettings}
            setTextureSettings={setTextureSettings}
            onHoverTextureObjects={(objectNames) => setHighlightedObjectNames(objectNames)}
            onCompress={handleCompress}
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
            hasBuffer={!!originalBuffer}
            fileName={fileName}
          />
        )}

        {/* 3D Viewport (Full width on mobile) */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', minWidth: 0 }}>
          <Viewport3D
            lang={lang}
            originalBuffer={originalBuffer}
            compressedBuffer={compressedBuffer}
            viewMode={viewMode}
            selectedNodeName={selectedNodeName}
            highlightedObjectNames={highlightedObjectNames}
            fileName={fileName}
          />
          {/* ── GLB Loader Overlay ── */}
          <GLBLoaderOverlay
            phase={loaderPhase}
            fetchPct={loaderPct}
            label={loaderLabel}
            errorMsg={loaderError}
            fileName={loaderFileName}
            lang={lang}
            onRetry={loaderPhase === 'error' ? loadSampleModel : undefined}
          />
        </div>

        {/* Desktop RightPanel */}
        {!isMobile && (
          <RightPanel
            lang={lang}
            nodes={nodes}
            protectedNodeIds={protectedNodeIds}
            toggleNodeProtection={toggleNodeProtection}
            selectedNodeName={selectedNodeName}
            setSelectedNodeName={setSelectedNodeName}
          />
        )}

        {/* ── MOBILE SLIDE-OVER DRAWERS ── */}
        {isMobile && mobileDrawer === 'left' && (
          <div
            className="skeuo-modal-overlay"
            onClick={() => setMobileDrawer('none')}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'rgba(3, 6, 11, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'flex-start',
              padding: 0
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(92vw, 360px)',
                height: '100%',
                background: 'var(--bg-panel)',
                boxShadow: '10px 0 35px rgba(0,0,0,0.9)',
                animation: 'fadeSlideIn 0.2s cubic-bezier(0.16,1,0.3,1)'
              }}
            >
              <LeftPanel
                lang={lang}
                theme={theme}
                setTheme={handleThemeChange}
                paletteId={paletteId}
                setPaletteId={setPaletteId}
                highContrastShadows={highContrastShadows}
                setHighContrastShadows={setHighContrastShadows}
                meshOpts={meshOpts}
                setMeshOpts={setMeshOpts}
                vertexQuantization={vertexQuantization}
                setVertexQuantization={setVertexQuantization}
                vertexCompression={vertexCompression}
                setVertexCompression={setVertexCompression}
                textures={textures}
                setTextures={setTextures}
                textureSettings={textureSettings}
                setTextureSettings={setTextureSettings}
                onHoverTextureObjects={(objectNames) => setHighlightedObjectNames(objectNames)}
                onCompress={() => {
                  handleCompress();
                  setMobileDrawer('none');
                }}
                onFileUpload={(file) => {
                  handleFileUpload(file);
                  setMobileDrawer('none');
                }}
                isProcessing={isProcessing}
                hasBuffer={!!originalBuffer}
                fileName={fileName}
                onCloseMobile={() => setMobileDrawer('none')}
              />
            </div>
          </div>
        )}

        {isMobile && mobileDrawer === 'right' && (
          <div
            className="skeuo-modal-overlay"
            onClick={() => setMobileDrawer('none')}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'rgba(3, 6, 11, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'flex-end',
              padding: 0
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(92vw, 340px)',
                height: '100%',
                background: 'var(--bg-panel)',
                boxShadow: '-10px 0 35px rgba(0,0,0,0.9)',
                animation: 'fadeSlideIn 0.2s cubic-bezier(0.16,1,0.3,1)'
              }}
            >
              <RightPanel
                lang={lang}
                nodes={nodes}
                protectedNodeIds={protectedNodeIds}
                toggleNodeProtection={toggleNodeProtection}
                selectedNodeName={selectedNodeName}
                setSelectedNodeName={setSelectedNodeName}
                onCloseMobile={() => setMobileDrawer('none')}
              />
            </div>
          </div>
        )}

        {/* ── MOBILE FLOATING DOCK ── */}
        {isMobile && (
          <MobileDock
            lang={lang}
            activeDrawer={mobileDrawer}
            setActiveDrawer={setMobileDrawer}
            protectedCount={protectedNodeIds.size}
            onCompress={handleCompress}
            isProcessing={isProcessing}
            hasBuffer={!!originalBuffer}
            hasCompressed={!!compressedBuffer}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenActions={() => setIsMobileActionsOpen(true)}
          />
        )}
      </div>

      {/* Mobile Quick Actions Modal Sheet */}
      <MobileActionsModal
        lang={lang}
        setLang={setLang}
        isOpen={isMobileActionsOpen}
        onClose={() => setIsMobileActionsOpen(false)}
        fileName={fileName}
        metrics={metrics}
        hasCompressed={!!compressedBuffer}
        onFileUpload={handleFileUpload}
        onLoadSample={loadSampleModel}
        onDownload={handleDownload}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Compression Detail Report Modal */}
      <CompressionModal
        lang={lang}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        metrics={metrics}
        fileName={fileName}
        meshOpts={meshOpts}
        vertexQuantization={vertexQuantization}
        vertexCompression={vertexCompression}
        textureSettings={textureSettings}
        textures={textures}
        protectedNodeCount={protectedNodeIds.size}
        onDownload={handleDownload}
        onOpenSplitView={() => setViewMode('split')}
      />
    </div>
  );
};
