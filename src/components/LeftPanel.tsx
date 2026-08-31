import React, { useState, useRef } from 'react';
import {
  Sliders, Maximize2, Minimize2, ChevronDown, ChevronRight,
  Image as ImageIcon, Grid, Zap, CheckSquare, Square, Upload,
  HelpCircle, Cpu, Settings2, Sparkles, X, Palette, Terminal, Radio,
  Droplets, Gem, Box, FileCheck, Contrast
} from 'lucide-react';
import {
  MeshOptionsState, VertexQuantizationState, VertexCompressionState,
  TextureCompressionSettings, TextureItem, TextureFormat, TextureCustomSettings
} from '../types/gltf';
import { Language, translations } from '../i18n/translations';
import { Theme } from '../App';
import { THEME_PALETTES } from '../themes/palettes';

interface LeftPanelProps {
  lang: Language;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  paletteId: string;
  setPaletteId: (paletteId: string) => void;
  highContrastShadows: boolean;
  setHighContrastShadows: React.Dispatch<React.SetStateAction<boolean>>;
  meshOpts: MeshOptionsState;
  setMeshOpts: React.Dispatch<React.SetStateAction<MeshOptionsState>>;
  vertexQuantization: VertexQuantizationState;
  setVertexQuantization: React.Dispatch<React.SetStateAction<VertexQuantizationState>>;
  vertexCompression: VertexCompressionState;
  setVertexCompression: React.Dispatch<React.SetStateAction<VertexCompressionState>>;
  textures: TextureItem[];
  setTextures: React.Dispatch<React.SetStateAction<TextureItem[]>>;
  textureSettings: TextureCompressionSettings;
  setTextureSettings: React.Dispatch<React.SetStateAction<TextureCompressionSettings>>;
  onHoverTextureObjects?: (objectNames: string[]) => void;
  onCompress: () => void;
  onFileUpload: (file: File) => void;
  isProcessing?: boolean;
  hasBuffer?: boolean;
  fileName?: string;
  onCloseMobile?: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  lang, theme, setTheme, paletteId, setPaletteId, highContrastShadows, setHighContrastShadows,
  meshOpts, setMeshOpts, vertexQuantization, setVertexQuantization,
  vertexCompression, setVertexCompression, textures, setTextures,
  textureSettings, setTextureSettings, onHoverTextureObjects, onCompress, onFileUpload,
  isProcessing = false, hasBuffer = false, fileName, onCloseMobile
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [openSection, setOpenSection] = useState<'mesh' | 'vertex' | 'texture'>('mesh');
  const [selectedTexIds, setSelectedTexIds] = useState<Set<string>>(new Set());
  const [pendingCustom, setPendingCustom] = useState<TextureCustomSettings>({ format: 'ETC1S', resolution: 1024 });
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(glb|gltf)$/i)) {
        onFileUpload(file);
      } else {
        alert(lang === 'es' ? 'Por favor arrastra un archivo .glb o .gltf' : 'Please drop a .glb or .gltf file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const toggleMeshOpt = (k: keyof MeshOptionsState) =>
    setMeshOpts(p => ({ ...p, [k]: !p[k] }));

  const toggleTex = (id: string) =>
    setSelectedTexIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectAllTex = (on: boolean) =>
    setSelectedTexIds(on ? new Set(textures.map(t => t.id)) : new Set());

  const applyCustom = () =>
    setTextures(p => p.map(tx =>
      selectedTexIds.has(tx.id) ? { ...tx, customSettings: { ...pendingCustom }, selectedForCompression: true } : tx
    ));

  const clearCustom = () =>
    setTextures(p => p.map(tx =>
      selectedTexIds.has(tx.id) ? { ...tx, customSettings: undefined } : tx
    ));

  const resVals = [32, 64, 128, 256, 512, 1024, 2048, 4096];
  const selTex = textures.filter(tx => selectedTexIds.has(tx.id));
  const customCount = textures.filter(tx => tx.customSettings).length;
  const MESH_KEYS: (keyof MeshOptionsState)[] = ['flatten', 'dedup', 'join', 'weld', 'reorder', 'instance'];
  const QUANT_KEYS: (keyof VertexQuantizationState)[] = ['positions', 'texcoords', 'colors', 'normals'];

  const P = { padding: '10px 12px' };
  const GAP8 = { gap: '8px' };

  return (
    <aside
      className="skeuo-panel"
      style={{
        width: onCloseMobile ? '100%' : isExpanded ? '440px' : '272px',
        height: onCloseMobile ? '100%' : 'calc(100vh - 46px)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 20, flexShrink: 0
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '7px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-panel)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Sliders size={14} color="var(--amber)" />
          <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>
            {t.compressionOptions}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {!onCloseMobile && (
            <button
              className="btn-convex-secondary"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ padding: '2px 6px' }}
              title={isExpanded ? t.collapsePanel : t.expandPanel}
            >
              {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
          )}
          {onCloseMobile && (
            <button
              className="btn-convex-secondary"
              onClick={onCloseMobile}
              style={{ padding: '2px 8px', gap: '4px' }}
            >
              <X size={13} color="var(--amber)" />
              <span style={{ fontSize: '10px', fontWeight: 700 }}>{t.closeDrawer}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main scrollable section */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* ── DRAG & DROP COMPACT CONTAINER ── */}
        <div style={{ padding: '8px 10px 4px 10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".glb,.gltf"
            style={{ display: 'none' }}
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="skeuo-card"
            style={{
              padding: '9px 10px',
              borderRadius: '7px',
              border: isDragging
                ? '1.5px dashed var(--cyan)'
                : '1px dashed rgba(0, 242, 254, 0.4)',
              background: isDragging
                ? 'rgba(0, 242, 254, 0.12)'
                : 'linear-gradient(180deg, rgba(14, 28, 44, 0.6) 0%, rgba(8, 16, 26, 0.7) 100%)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: isDragging
                ? '0 0 12px rgba(0,242,254,0.3), inset 0 1px 3px rgba(0,0,0,0.4)'
                : 'inset 0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload
                size={14}
                color={isDragging ? '#00f2fe' : 'var(--cyan)'}
                style={{
                  transform: isDragging ? 'scale(1.2) translateY(-2px)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: isDragging ? '#00f2fe' : 'var(--text-bright)',
                  textAlign: 'center'
                }}
              >
                {isDragging ? t.dropzoneActive : t.dropzoneTitle}
              </span>
            </div>
            <span style={{ fontSize: '8.5px', color: 'var(--muted)', textAlign: 'center' }}>
              {t.dropzoneSubtitle}
            </span>
            {fileName && (
              <div
                style={{
                  marginTop: '3px',
                  fontSize: '8.5px',
                  color: 'var(--gold)',
                  background: 'rgba(255, 184, 0, 0.08)',
                  border: '1px solid rgba(255, 184, 0, 0.2)',
                  borderRadius: '3px',
                  padding: '1px 6px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={fileName}
              >
                {t.currentFile} <strong style={{ color: '#fff' }}>{fileName}</strong>
              </div>
            )}
          </div>
        </div>

        {/* ── 1. MESH OPTIONS ── */}
        <div>
          <div className="section-title-skeuo"
            onClick={() => setOpenSection(openSection === 'mesh' ? 'vertex' : 'mesh')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={13} color="var(--cyan)" /> {t.meshOptionsTitle}
            </span>
            {openSection === 'mesh' ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>

          {openSection === 'mesh' && (
            <div style={{ ...P, display: 'flex', flexDirection: 'column', ...GAP8 }}>
              <p style={{ fontSize: '10.5px', color: 'var(--muted)', lineHeight: 1.4 }}>{t.meshOptionsDesc}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {MESH_KEYS.map(k => (
                  <label key={k} className="skeuo-checkbox skeuo-card" style={{ padding: '7px 9px', fontSize: '11px' }}>
                    <input type="checkbox" checked={meshOpts[k]} onChange={() => toggleMeshOpt(k)} />
                    <span>{t[k as keyof typeof t] as string}</span>
                  </label>
                ))}
              </div>
              <div
                className="skeuo-card"
                style={{
                  background: 'linear-gradient(175deg,#141e0d,#0a100a)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  padding: '8px 10px', fontSize: '10px', color: '#c8dfc8',
                  display: 'flex', alignItems: 'flex-start', gap: '7px', lineHeight: 1.4
                }}
              >
                <HelpCircle size={14} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{t.meshHelpNote}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. VERTEX OPTIONS ── */}
        <div>
          <div className="section-title-skeuo"
            onClick={() => setOpenSection(openSection === 'vertex' ? 'texture' : 'vertex')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} color="var(--gold)" /> {t.vertexOptionsTitle}
            </span>
            {openSection === 'vertex' ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>

          {openSection === 'vertex' && (
            <div style={{ ...P, display: 'flex', flexDirection: 'column', ...GAP8 }}>
              {/* Quantization */}
              <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700, marginBottom: '2px' }}>
                {t.quantizationTitle}
              </div>
              {QUANT_KEYS.map(k => (
                <div key={k} className="skeuo-card" style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                    <span>{t[k as keyof typeof t] as string}</span>
                    <strong style={{ color: 'var(--amber)' }}>{vertexQuantization[k]}b</strong>
                  </div>
                  <input
                    type="range" min="8" max="32" step="8"
                    value={vertexQuantization[k]}
                    onChange={e => setVertexQuantization(p => ({ ...p, [k]: Number(e.target.value) as 8|16|32 }))}
                    className="skeuo-slider"
                  />
                </div>
              ))}

              {/* Compression algo */}
              <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700, marginTop: '4px', marginBottom: '2px' }}>
                {t.algorithmTitle}
              </div>
              <div className="tab-group-skeuo">
                <button
                  className={`tab-btn-skeuo ${vertexCompression.type === 'draco' ? 'active-warm' : ''}`}
                  onClick={() => setVertexCompression(p => ({ ...p, type: 'draco' }))}
                >Draco</button>
                <button
                  className={`tab-btn-skeuo ${vertexCompression.type === 'none' ? 'active' : ''}`}
                  onClick={() => setVertexCompression(p => ({ ...p, type: 'none' }))}
                >None</button>
              </div>

              {vertexCompression.type === 'draco' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeuo-card" style={{ padding: '8px 10px' }}>
                    <label style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      {t.methodLabel}
                    </label>
                    <select
                      className="skeuo-select"
                      value={vertexCompression.method}
                      onChange={e => setVertexCompression(p => ({ ...p, method: e.target.value as 'edgebreaker'|'sequential' }))}
                    >
                      <option value="edgebreaker">{t.edgebreaker}</option>
                      <option value="sequential">{t.sequential}</option>
                    </select>
                  </div>
                  <div className="skeuo-card" style={{ padding: '8px 10px' }}>
                    <label style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      {t.scopeLabel}
                    </label>
                    <select
                      className="skeuo-select"
                      value={vertexCompression.quantizationScope}
                      onChange={e => setVertexCompression(p => ({ ...p, quantizationScope: e.target.value as 'mesh'|'scene' }))}
                    >
                      <option value="mesh">{t.meshScope}</option>
                      <option value="scene">{t.sceneScope}</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '10px', textAlign: 'center', fontSize: '11px', color: 'var(--muted)',
                  border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '7px'
                }}>
                  {t.noCompressionMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. TEXTURE OPTIONS ── */}
        <div>
          <div className="section-title-skeuo"
            onClick={() => setOpenSection(openSection === 'texture' ? 'mesh' : 'texture')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={13} color="var(--emerald)" /> {t.textureOptionsTitle}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {customCount > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg,#d97706,#92400e)', color: '#fff',
                  fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px',
                  boxShadow: '0 0 6px rgba(245,158,11,0.4)'
                }}>
                  {customCount} {t.customBadge}
                </span>
              )}
              {openSection === 'texture' ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </div>
          </div>

          {openSection === 'texture' && (
            <div style={{ ...P, display: 'flex', flexDirection: 'column', ...GAP8 }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                  {t.texturesDetected} ({textures.length})
                </span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn-convex-secondary" style={{ padding: '2px 6px', fontSize: '10px' }}
                    onClick={() => selectAllTex(true)}>
                    <CheckSquare size={10} /> {t.btnAll}
                  </button>
                  <button className="btn-convex-secondary" style={{ padding: '2px 6px', fontSize: '10px' }}
                    onClick={() => selectAllTex(false)}>
                    <Square size={10} /> {t.btnNone}
                  </button>
                </div>
              </div>

              {/* Texture grid */}
              {textures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '11px', color: 'var(--muted)' }}>
                  {t.noTextures}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isExpanded ? 'repeat(3,1fr)' : 'repeat(2,1fr)',
                  gap: '8px', maxHeight: '260px', overflowY: 'auto'
                }}>
                  {textures.map(tex => {
                    const isChk = selectedTexIds.has(tex.id);
                    const hasC = !!tex.customSettings;
                    return (
                      <div
                        key={tex.id}
                        className="skeuo-card"
                        style={{
                          padding: '7px',
                          border: isChk
                            ? '1px solid var(--amber)'
                            : hasC
                            ? '1px solid rgba(251,191,36,0.4)'
                            : undefined,
                          boxShadow: isChk ? '0 0 10px rgba(245,158,11,0.35)' : undefined,
                          cursor: 'pointer', position: 'relative',
                          transition: 'border-color 0.15s, box-shadow 0.15s'
                        }}
                        onMouseEnter={() => onHoverTextureObjects?.(tex.associatedObjects)}
                        onMouseLeave={() => onHoverTextureObjects?.([])}
                        onClick={() => toggleTex(tex.id)}
                      >
                        {/* Custom badge */}
                        {hasC && (
                          <div style={{
                            position: 'absolute', top: '3px', left: '3px', zIndex: 6,
                            background: 'linear-gradient(135deg,#d97706,#92400e)',
                            color: '#fff', fontSize: '8px', fontWeight: 900,
                            padding: '1px 4px', borderRadius: '2px',
                            boxShadow: '0 0 5px rgba(245,158,11,0.5)'
                          }}>{t.customBadge}</div>
                        )}
                        {/* Checkmark */}
                        <div
                          style={{
                            position: 'absolute', top: '4px', right: '4px', zIndex: 5,
                            width: '14px', height: '14px', borderRadius: '3px',
                            background: isChk
                              ? 'linear-gradient(145deg,#fbbf24,#d97706)'
                              : 'rgba(255,255,255,0.08)',
                            border: isChk ? 'none' : '1px solid rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isChk
                              ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 6px rgba(245,158,11,0.4)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.3)'
                          }}
                          onClick={e => { e.stopPropagation(); toggleTex(tex.id); }}
                        >
                          {isChk && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="#1c1000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div style={{
                          width: '100%', height: '56px',
                          background: '#040711', borderRadius: '4px',
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: '5px', marginTop: hasC ? '6px' : '0',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)'
                        }}>
                          {tex.dataUrl
                            ? <img src={tex.dataUrl} alt={tex.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            : <Grid size={18} color="var(--muted)" />
                          }
                        </div>

                        <div style={{ fontSize: '10px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tex.name}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span>{tex.width}×{tex.height}</span>
                          <span style={{ color: 'var(--gold)' }}>{(tex.sizeBytes / 1024).toFixed(0)}KB</span>
                        </div>
                        {hasC && (
                          <div style={{ fontSize: '9px', color: '#fbbf24', marginTop: '3px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{tex.customSettings!.format}</span>
                            <span>{tex.customSettings!.resolution}px</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Per-texture custom panel */}
              {selectedTexIds.size > 0 ? (
                <div
                  className="skeuo-card"
                  style={{
                    padding: '10px',
                    background: 'linear-gradient(160deg,#1a1208,#0f0b04)',
                    border: '1px solid rgba(245,158,11,0.4)',
                    borderBottom: '1px solid rgba(0,0,0,0.5)',
                    animation: 'fadeSlideIn 0.18s ease-out'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Settings2 size={12} color="var(--amber)" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>{t.customPanelTitle}</span>
                    </div>
                    <button className="btn-convex-secondary" style={{ padding: '1px 5px' }} onClick={() => setSelectedTexIds(new Set())}>
                      <X size={10} />
                    </button>
                  </div>

                  <p style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {t.customPanelSubtitle}
                  </p>

                  {/* Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' }}>
                    {selTex.map(tx => (
                      <span key={tx.id} style={{
                        fontSize: '9px', background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24',
                        padding: '1px 6px', borderRadius: '3px', fontWeight: 600
                      }}>{tx.name}</span>
                    ))}
                  </div>

                  {/* Format radio chips */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--amber)', fontWeight: 700, marginBottom: '5px' }}>{t.customFormatLabel}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }}>
                      {(['ETC1S', 'UASTC', 'WebP', 'AVIF'] as TextureFormat[]).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setPendingCustom(p => ({ ...p, format: fmt }))}
                          style={{
                            padding: '4px 2px', borderRadius: '5px', fontSize: '9.5px', fontWeight: 700,
                            cursor: 'pointer', border: 'none',
                            background: pendingCustom.format === fmt
                              ? 'linear-gradient(175deg,#3d2700,#1e1200)'
                              : 'linear-gradient(175deg,#1a2030,#0f1320)',
                            color: pendingCustom.format === fmt ? '#fbbf24' : 'var(--muted)',
                            boxShadow: pendingCustom.format === fmt
                              ? 'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 6px rgba(245,158,11,0.25), 0 1px 3px rgba(0,0,0,0.4)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.35)',
                            outline: pendingCustom.format === fmt ? '1px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.07)',
                            transition: 'all 0.12s'
                          }}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution chips */}
                  <div style={{ marginBottom: '9px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--amber)', fontWeight: 700, marginBottom: '5px' }}>
                      {t.customResolutionLabel} <span style={{ color: '#fbbf24' }}>{pendingCustom.resolution}px</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {resVals.map(res => (
                        <button
                          key={res}
                          onClick={() => setPendingCustom(p => ({ ...p, resolution: res }))}
                          style={{
                            flex: '1 1 calc(25% - 3px)', minWidth: '36px',
                            padding: '4px 2px', borderRadius: '5px', fontSize: '9.5px', fontWeight: 700,
                            cursor: 'pointer', border: 'none',
                            background: pendingCustom.resolution === res
                              ? 'linear-gradient(175deg,#3d2700,#1e1200)'
                              : 'linear-gradient(175deg,#1a2030,#0f1320)',
                            color: pendingCustom.resolution === res ? '#fbbf24' : 'var(--muted)',
                            boxShadow: pendingCustom.resolution === res
                              ? 'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 5px rgba(245,158,11,0.2), 0 1px 3px rgba(0,0,0,0.4)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.35)',
                            outline: pendingCustom.resolution === res ? '1px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.07)',
                            transition: 'all 0.12s'
                          }}
                        >
                          {res >= 1024 ? `${res/1024}K` : res}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-convex-warm" style={{ flex: 1, justifyContent: 'center', fontSize: '10.5px' }}
                      onClick={applyCustom}>
                      <Settings2 size={11} /> {t.customApply}
                    </button>
                    <button className="btn-convex-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '10.5px' }}
                      onClick={clearCustom}>
                      <X size={11} /> {t.customClear}
                    </button>
                  </div>
                </div>
              ) : textures.length > 0 && (
                <div style={{
                  padding: '8px 10px', borderRadius: '7px',
                  border: '1px dashed rgba(245,158,11,0.22)', fontSize: '10px', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(245,158,11,0.03)'
                }}>
                  <Settings2 size={12} color="rgba(245,158,11,0.4)" style={{ flexShrink: 0 }} />
                  {t.customSelectedHint}
                </div>
              )}

              <hr style={{ borderColor: 'rgba(255,255,255,0.07)', margin: '0' }} />

              {/* Global texture settings */}
              <div style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 700 }}>
                {t.globalTextureSettings}
              </div>
              <div className="skeuo-card" style={{ padding: '8px 10px' }}>
                <label style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>{t.formatLabel}</label>
                <select className="skeuo-select" value={textureSettings.format}
                  onChange={e => setTextureSettings(p => ({ ...p, format: e.target.value as TextureFormat }))}>
                  <option value="ETC1S">{t.formatEtc1s}</option>
                  <option value="UASTC">{t.formatUastc}</option>
                  <option value="WebP">{t.formatWebp}</option>
                  <option value="AVIF">{t.formatAvif}</option>
                </select>
              </div>
              <div className="skeuo-card" style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '5px' }}>
                  <span>{t.maxResolution}</span>
                  <strong style={{ color: 'var(--gold)' }}>{textureSettings.resolution}px</strong>
                </div>
                <input type="range" min="0" max={resVals.length - 1} step="1"
                  value={resVals.indexOf(textureSettings.resolution)}
                  onChange={e => setTextureSettings(p => ({ ...p, resolution: resVals[Number(e.target.value)] }))}
                  className="skeuo-slider" />
              </div>
              <label className="skeuo-checkbox skeuo-card" style={{ padding: '7px 10px' }}>
                <input type="checkbox" checked={textureSettings.mipmaps}
                  onChange={e => setTextureSettings(p => ({ ...p, mipmaps: e.target.checked }))} />
                <span>{t.generateMipmaps}</span>
              </label>
              <div className="skeuo-card" style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '5px' }}>
                  <span>{t.qualitySlider}</span>
                  <strong style={{ color: 'var(--amber)' }}>{textureSettings.quality}/255</strong>
                </div>
                <input type="range" min="1" max="255" step="1"
                  value={textureSettings.quality}
                  onChange={e => setTextureSettings(p => ({ ...p, quality: Number(e.target.value) }))}
                  className="skeuo-slider" />
              </div>
              <div className="skeuo-card" style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '5px' }}>
                  <span>{t.compressionEffort}</span>
                  <strong style={{ color: 'var(--amber)' }}>{t.effortLevel} {textureSettings.effort}/4</strong>
                </div>
                <input type="range" min="0" max="4" step="1"
                  value={textureSettings.effort}
                  onChange={e => setTextureSettings(p => ({ ...p, effort: Number(e.target.value) }))}
                  className="skeuo-slider" />
              </div>
            </div>
          )}
        </div>

        {/* ── ACTION BUTTON: PROCESAR & COMPRIMIR ── */}
        <div style={{ padding: '12px 10px 14px 10px' }}>
          <button
            className="btn-convex-primary"
            onClick={onCompress}
            disabled={isProcessing || !hasBuffer}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '7px',
              cursor: (isProcessing || !hasBuffer) ? 'not-allowed' : 'pointer',
              opacity: (isProcessing || !hasBuffer) ? 0.55 : 1,
              background: 'linear-gradient(180deg, #00f2fe 0%, #00a8ff 100%)',
              color: '#03101d',
              border: '1px solid #00f2fe',
              boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.65)',
              textShadow: '0 1px 0 rgba(255, 255, 255, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            {isProcessing ? (
              <>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(3, 16, 29, 0.3)',
                    borderTopColor: '#03101d',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>{t.processing}</span>
              </>
            ) : (
              <>
                <Zap size={14} fill="#03101d" color="#03101d" />
                <span>{t.processCompress}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── BOTTOM THEME SELECTOR & FOOTER ── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'var(--bg-panel)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Theme Buttons */}
        <div style={{ padding: '8px 10px 6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '6px', fontSize: '10.5px', fontWeight: 800
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold)' }}>
              <Palette size={12} color="var(--amber)" /> {t.themeLabel}
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="btn-convex-secondary"
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px' }}
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {theme === 'default' && <Sparkles size={11} />}
                {theme === 'cyberpunk' && <Terminal size={11} />}
                {theme === 'brutalist' && <Radio size={11} />}
                {theme === 'liquid' && <Droplets size={11} />}
                {theme === 'glassmorphism' && <Gem size={11} />}
                {theme === 'neumorphism' && <Box size={11} />}
                <span style={{ textTransform: 'capitalize' }}>
                  {theme === 'default' ? t.themeDefault :
                   theme === 'cyberpunk' ? t.themeCyberpunk :
                   theme === 'brutalist' ? t.themeBrutalist :
                   theme === 'liquid' ? t.themeLiquid :
                   theme === 'glassmorphism' ? t.themeGlassmorphism :
                   t.themeNeumorphism}
                </span>
              </span>
              {isThemeDropdownOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>

            {isThemeDropdownOpen && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '4px',
                background: 'var(--bg-panel)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '6px',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
                zIndex: 100
              }}>
                <button
                  className={`theme-btn theme-opt-default ${theme === 'default' ? 'active' : ''}`}
                  onClick={() => { setTheme('default'); setIsThemeDropdownOpen(false); }}
                  title="Skeuomorphism Convex Theme"
                >
                  <Sparkles size={11} />
                  <span>{t.themeDefault}</span>
                </button>
                <button
                  className={`theme-btn theme-opt-cyberpunk ${theme === 'cyberpunk' ? 'active' : ''}`}
                  onClick={() => { setTheme('cyberpunk'); setIsThemeDropdownOpen(false); }}
                  title="Cyberpunk 2077 Neon Theme"
                >
                  <Terminal size={11} />
                  <span>{t.themeCyberpunk}</span>
                </button>
                <button
                  className={`theme-btn theme-opt-brutalist ${theme === 'brutalist' ? 'active' : ''}`}
                  onClick={() => { setTheme('brutalist'); setIsThemeDropdownOpen(false); }}
                  title="Jet Set Radio Brutalism Theme"
                >
                  <Radio size={11} />
                  <span>{t.themeBrutalist}</span>
                </button>
                <button
                  className={`theme-btn theme-opt-liquid ${theme === 'liquid' ? 'active' : ''}`}
                  onClick={() => { setTheme('liquid'); setIsThemeDropdownOpen(false); }}
                  title="Liquid UI Dynamic Gradients Theme"
                >
                  <Droplets size={11} />
                  <span>{t.themeLiquid}</span>
                </button>
                <button
                  className={`theme-btn theme-opt-glassmorphism ${theme === 'glassmorphism' ? 'active' : ''}`}
                  onClick={() => { setTheme('glassmorphism'); setIsThemeDropdownOpen(false); }}
                  title="Glassmorphism Frosted Translucent Theme"
                >
                  <Gem size={11} />
                  <span>{t.themeGlassmorphism}</span>
                </button>
                <button
                  className={`theme-btn theme-opt-neumorphism ${theme === 'neumorphism' ? 'active' : ''}`}
                  onClick={() => { setTheme('neumorphism'); setIsThemeDropdownOpen(false); }}
                  title="Neumorphism Extruded Soft Clay Theme"
                >
                  <Box size={11} />
                  <span>{t.themeNeumorphism}</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Theme's 4 Palettes Swatches Bar */}
          {THEME_PALETTES[theme] && (
            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '5px', fontSize: '9.5px', fontWeight: 700, color: 'var(--muted)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Palette size={10} color="var(--cyan)" />
                  {lang === 'es' ? 'Paleta de Color' : 'Color Palette'}
                </span>
                <span style={{ fontSize: '8.5px', color: 'var(--cyan)', fontWeight: 800 }}>
                  {THEME_PALETTES[theme].find(p => p.id === paletteId)?.name || ''}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {THEME_PALETTES[theme].map((p) => {
                  const isActive = paletteId === p.id;
                  return (
                    <button
                      key={p.id}
                      className={`palette-swatch-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setPaletteId(p.id)}
                      title={p.name}
                    >
                      <div
                        className="palette-dot"
                        style={{
                          background: `linear-gradient(135deg, ${p.colors[0]} 0%, ${p.colors[1]} 100%)`,
                          width: '9px',
                          height: '9px',
                          border: isActive ? '1px solid #fff' : '1px solid rgba(255,255,255,0.25)'
                        }}
                      />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '8.5px'
                      }}>
                        {p.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* High Contrast Shadows Toggle (True/False Switch) */}
          <div style={{
            marginTop: '7px',
            paddingTop: '6px',
            borderTop: '1px dashed rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '9.5px',
              fontWeight: 700,
              color: 'var(--txt)'
            }}>
              <Contrast size={11} color="var(--amber)" />
              {t.highContrastShadows}
            </span>
            <button
              className="btn-convex-secondary"
              onClick={() => setHighContrastShadows(!highContrastShadows)}
              style={{
                padding: '2px 8px',
                fontSize: '8.5px',
                fontWeight: 800,
                background: highContrastShadows
                  ? 'linear-gradient(135deg, var(--cyan), #0284c7)'
                  : 'rgba(255,255,255,0.05)',
                color: highContrastShadows ? '#03101d' : 'var(--muted)',
                border: highContrastShadows ? '1px solid var(--cyan)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: highContrastShadows ? '0 0 8px var(--cyan)' : 'none',
                height: '22px'
              }}
              title={highContrastShadows ? 'High Contrast Shadows: ON' : 'High Contrast Shadows: OFF'}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: highContrastShadows ? '#03101d' : '#64748b'
                }}
              />
              <span>{highContrastShadows ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Footer info strip */}
        <div
          style={{
            padding: '6px 10px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9.5px',
            color: 'var(--muted)'
          }}
        >
          <span style={{ fontWeight: 600 }}>{t.footerAuthor}</span>
          <span
            style={{
              fontSize: '8.5px',
              background: 'rgba(255,255,255,0.06)',
              padding: '1px 5px',
              borderRadius: '3px',
              color: 'var(--cyan)',
              fontWeight: 700
            }}
          >
            {t.footerVersion}
          </span>
        </div>
      </div>
    </aside>
  );
};
