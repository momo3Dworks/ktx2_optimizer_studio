import React from 'react';
import {
  X,
  Zap,
  Download,
  Layers,
  ShieldCheck,
  Cpu,
  Image as ImageIcon,
  Clock,
  Sparkles,
  ArrowRight,
  Activity,
  HardDrive,
  Gauge
} from 'lucide-react';
import {
  CompressionMetrics,
  MeshOptionsState,
  VertexQuantizationState,
  VertexCompressionState,
  TextureCompressionSettings,
  TextureItem
} from '../types/gltf';
import { Language, translations } from '../i18n/translations';

interface CompressionModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  metrics: CompressionMetrics | null;
  fileName: string;
  meshOpts: MeshOptionsState;
  vertexQuantization: VertexQuantizationState;
  vertexCompression: VertexCompressionState;
  textureSettings: TextureCompressionSettings;
  textures: TextureItem[];
  protectedNodeCount: number;
  onDownload: () => void;
  onOpenSplitView: () => void;
}

export const CompressionModal: React.FC<CompressionModalProps> = ({
  lang,
  isOpen,
  onClose,
  metrics,
  fileName,
  meshOpts,
  vertexQuantization,
  vertexCompression,
  textureSettings,
  textures,
  protectedNodeCount,
  onDownload,
  onOpenSplitView
}) => {
  if (!isOpen || !metrics) return null;

  const t = translations[lang];

  const formatMB = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  // File size savings
  const savedDiskBytes = Math.max(0, metrics.originalSizeBytes - metrics.compressedSizeBytes);
  const reductionDiskPercent = (
    (savedDiskBytes / (metrics.originalSizeBytes || 1)) * 100
  ).toFixed(1);

  // GPU VRAM savings
  const origVram = metrics.originalGpuVramBytes || (metrics.originalSizeBytes * 4);
  const compVram = metrics.compressedGpuVramBytes || (metrics.compressedSizeBytes * 1.5);
  const savedVramBytes = Math.max(0, origVram - compVram);
  const reductionVramPercent = (
    (savedVramBytes / (origVram || 1)) * 100
  ).toFixed(1);

  const activeMeshOpts = Object.entries(meshOpts)
    .filter(([_, active]) => active)
    .map(([key]) => key.toUpperCase());

  const selectedTextures = textures.filter((tItem) => tItem.selectedForCompression);

  return (
    <div className="skeuo-modal-overlay" onClick={onClose}>
      <div className="skeuo-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            background: 'linear-gradient(180deg, #1e293b 0%, #111827 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1c1000',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)'
              }}
            >
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {t.reportTitle}
              </h2>
              <span className="warm-glow-badge" style={{ marginTop: '2px', display: 'inline-flex' }}>
                <span className="glow-dot-warm"></span> {t.processSuccess}
              </span>
            </div>
          </div>

          <button
            className="btn-convex-secondary"
            onClick={onClose}
            style={{ padding: '6px 10px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* ── Top Banners Grid (File Size + GPU VRAM Side by Side) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Banner 1: File Storage Size */}
            <div
              className="skeuo-card"
              style={{
                padding: '14px 16px',
                background: 'linear-gradient(145deg, #182234 0%, #0e1522 100%)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <HardDrive size={13} /> {lang === 'es' ? 'Peso del Archivo (Disco)' : 'File Storage (Disk)'}
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    color: '#4ade80',
                    background: 'rgba(74,222,128,0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(74,222,128,0.3)'
                  }}
                >
                  -{reductionDiskPercent}%
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.statOriginalSize}</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#94a3b8' }}>
                    {formatMB(metrics.originalSizeBytes)}
                  </div>
                </div>
                <ArrowRight size={16} color="var(--cyan)" />
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.statCompressedSize}</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold)' }}>
                    {formatMB(metrics.compressedSizeBytes)}
                  </div>
                </div>
              </div>
            </div>

            {/* Banner 2: GPU VRAM Memory Footprint (Hero Feature) */}
            <div
              className="skeuo-card"
              style={{
                padding: '14px 16px',
                background: 'linear-gradient(145deg, #221808 0%, #120e04 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Gauge size={13} color="var(--gold)" /> {t.gpuUsageTitle}
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(245, 158, 11, 0.4)'
                  }}
                >
                  -{reductionVramPercent}% VRAM
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.originalVram}</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171' }}>
                    {formatMB(origVram)}
                  </div>
                </div>
                <ArrowRight size={16} color="var(--amber)" />
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.compressedVram}</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80' }}>
                    {formatMB(compVram)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── GPU & VRAM Technical Breakdown Card ── */}
          <div
            className="skeuo-card"
            style={{
              padding: '14px 18px',
              background: 'rgba(10, 16, 28, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Activity size={15} color="var(--cyan)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                {lang === 'es' ? 'Desglose de Memoria en Placa Gráfica (VRAM & GPU Pipeline)' : 'GPU Memory & Graphics Pipeline Breakdown'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
              {/* Texture VRAM */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
                  {t.textureVram}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formatMB(metrics.originalTextureVramBytes || 0)}
                  </span>
                  <span style={{ color: 'var(--cyan)' }}>➔</span>
                  <strong style={{ color: '#4ade80' }}>
                    {formatMB(metrics.compressedTextureVramBytes || 0)}
                  </strong>
                </div>
              </div>

              {/* Geometry VRAM */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
                  {t.geometryVram}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formatMB(metrics.originalGeometryVramBytes || 0)}
                  </span>
                  <span style={{ color: 'var(--cyan)' }}>➔</span>
                  <strong style={{ color: 'var(--gold)' }}>
                    {formatMB(metrics.compressedGeometryVramBytes || 0)}
                  </strong>
                </div>
              </div>

              {/* Draw Calls */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
                  {t.drawCalls}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>
                    {metrics.originalDrawCalls || 1}
                  </span>
                  <span style={{ color: 'var(--cyan)' }}>➔</span>
                  <strong style={{ color: '#38bdf8' }}>
                    {metrics.compressedDrawCalls || 1} calls
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid (3 Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {/* Card 1: Geometría & Meshes */}
            <div className="skeuo-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--accent-cyan)' }}>
                <Cpu size={16} />
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>{t.geometryMeshes}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.finalVertices}</span>
                  <strong style={{ color: '#fff' }}>{metrics.compressedVertices.toLocaleString()}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.meshFilters}</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {activeMeshOpts.length > 0 ? activeMeshOpts.join(', ') : t.noneFilter}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.protectedEmptiesSplines}</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={13} /> {protectedNodeCount} {t.preserved}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Vertex Quantization & Draco */}
            <div className="skeuo-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--warm-amber)' }}>
                <Sparkles size={16} />
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>{t.quantDracoTitle}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.compressionLabel}</span>
                  <strong style={{ color: vertexCompression.type === 'draco' ? 'var(--warm-gold)' : 'var(--text-muted)' }}>
                    {vertexCompression.type === 'draco' ? `Draco (${vertexCompression.method})` : t.noneCompression}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.posNorm}</span>
                  <strong style={{ color: '#fff' }}>
                    {vertexQuantization.positions}b / {vertexQuantization.normals}b
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.uvColors}</span>
                  <strong style={{ color: '#fff' }}>
                    {vertexQuantization.texcoords}b / {vertexQuantization.colors}b
                  </strong>
                </div>
              </div>
            </div>

            {/* Card 3: Texturas & KTX2 */}
            <div className="skeuo-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--accent-emerald)' }}>
                <ImageIcon size={16} />
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>{t.texturesKtx2Title}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.processedTextures}</span>
                  <strong style={{ color: '#fff' }}>{selectedTextures.length} / {textures.length}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.outputFormat}</span>
                  <strong style={{ color: 'var(--accent-emerald)' }}>{textureSettings.format}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.maxResMipmaps}</span>
                  <strong style={{ color: '#fff' }}>
                    {textureSettings.resolution}px ({textureSettings.mipmaps ? 'Yes' : 'No'})
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Time & File info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.35)', padding: '9px 15px', borderRadius: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="var(--warm-amber)" /> {t.processingTime} <strong style={{ color: '#fff' }}>{metrics.processingTimeMs} ms</strong>
            </span>
            <span>{t.fileLabel} <strong style={{ color: 'var(--cyan)' }}>{fileName}</strong></span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 22px',
            background: 'linear-gradient(180deg, #111827 0%, #070a12 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button className="btn-convex-secondary" onClick={() => { onClose(); onOpenSplitView(); }}>
            <Layers size={15} /> {t.openSplitView}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-convex-secondary" onClick={onClose}>
              {t.closeReport}
            </button>

            <button className="btn-convex-warm" onClick={onDownload}>
              <Download size={15} /> {t.exportCompressedGlb}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
