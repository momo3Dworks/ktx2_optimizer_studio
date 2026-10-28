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

  const savedDiskBytes = Math.max(0, metrics.originalSizeBytes - metrics.compressedSizeBytes);
  const reductionDiskPercent = ((savedDiskBytes / (metrics.originalSizeBytes || 1)) * 100).toFixed(1);
  const origVram = metrics.originalGpuVramBytes || (metrics.originalSizeBytes * 4);
  const compVram = metrics.compressedGpuVramBytes || (metrics.compressedSizeBytes * 1.5);
  const savedVramBytes = Math.max(0, origVram - compVram);
  const reductionVramPercent = ((savedVramBytes / (origVram || 1)) * 100).toFixed(1);

  const activeMeshOpts = Object.entries(meshOpts)
    .filter(([_, active]) => active)
    .map(([key]) => key.toUpperCase());

  const selectedTextures = textures.filter((tItem) => tItem.selectedForCompression);

  return (
    <div className="skeuo-modal-overlay" onClick={onClose}>
      <div
        className="skeuo-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', width: '100%', maxHeight: '92dvh', margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(180deg, #1e293b 0%, #111827 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              width: '32px', height: '32px', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1c1000', boxShadow: '0 0 14px rgba(245,158,11,0.45)', flexShrink: 0,
            }}>
              <Zap size={17} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                {t.reportTitle}
              </h2>
              <span className="warm-glow-badge" style={{ marginTop: '2px', display: 'inline-flex', fontSize: '0.7rem' }}>
                <span className="glow-dot-warm"></span> {t.processSuccess}
              </span>
            </div>
          </div>
          <button className="btn-convex-secondary" onClick={onClose} style={{ padding: '6px', borderRadius: '50%', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{
          overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column',
          gap: '10px', padding: '12px 14px', WebkitOverflowScrolling: 'touch',
        }}>

          {/* Hero row: Disk + VRAM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Disk */}
            <div className="skeuo-card" style={{
              padding: '10px 12px',
              background: 'linear-gradient(145deg, #182234 0%, #0e1522 100%)',
              border: '1px solid rgba(0,229,255,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HardDrive size={11} /> {lang === 'es' ? 'Disco' : 'Disk'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(74,222,128,0.3)' }}>
                  -{reductionDiskPercent}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '1px' }}>{t.statOriginalSize}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', lineHeight: 1 }}>{formatMB(metrics.originalSizeBytes)}</div>
                </div>
                <ArrowRight size={13} color="var(--cyan)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '1px' }}>{t.statCompressedSize}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{formatMB(metrics.compressedSizeBytes)}</div>
                </div>
              </div>
            </div>

            {/* VRAM */}
            <div className="skeuo-card" style={{
              padding: '10px 12px',
              background: 'linear-gradient(145deg, #221808 0%, #120e04 100%)',
              border: '1px solid rgba(245,158,11,0.4)',
              boxShadow: '0 0 10px rgba(245,158,11,0.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Gauge size={11} color="var(--gold)" /> VRAM
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fbbf24', background: 'rgba(245,158,11,0.2)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.4)' }}>
                  -{reductionVramPercent}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '1px' }}>{t.originalVram}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171', lineHeight: 1 }}>{formatMB(origVram)}</div>
                </div>
                <ArrowRight size={13} color="var(--amber)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '1px' }}>{t.compressedVram}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80', lineHeight: 1 }}>{formatMB(compVram)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* GPU Pipeline compact */}
          <div className="skeuo-card" style={{ padding: '10px 12px', background: 'rgba(10,16,28,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Activity size={13} color="var(--cyan)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>GPU Pipeline</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '7px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>{t.textureVram}</span>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textDecoration: 'line-through' }}>{formatMB(metrics.originalTextureVramBytes || 0)}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80' }}>{formatMB(metrics.compressedTextureVramBytes || 0)}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '7px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>{t.geometryVram}</span>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textDecoration: 'line-through' }}>{formatMB(metrics.originalGeometryVramBytes || 0)}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>{formatMB(metrics.compressedGeometryVramBytes || 0)}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '7px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>{t.drawCalls}</span>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{metrics.originalDrawCalls || 1}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>{metrics.compressedDrawCalls || 1}</div>
              </div>
            </div>
          </div>

          {/* Geometry | Quant+Draco */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="skeuo-card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--accent-cyan)' }}>
                <Cpu size={13} />
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>{t.geometryMeshes}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.finalVertices}</span>
                  <strong style={{ color: '#fff' }}>{metrics.compressedVertices.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.meshFilters}</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, textAlign: 'right' }}>
                    {activeMeshOpts.length > 0 ? activeMeshOpts.join(', ') : t.noneFilter}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t.protectedEmptiesSplines}</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    <ShieldCheck size={11} /> {protectedNodeCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="skeuo-card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--warm-amber)' }}>
                <Sparkles size={13} />
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>{t.quantDracoTitle}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.compressionLabel}</span>
                  <strong style={{ color: vertexCompression.type === 'draco' ? 'var(--warm-gold)' : 'var(--text-muted)', textAlign: 'right' }}>
                    {vertexCompression.type === 'draco' ? `Draco (${vertexCompression.method})` : t.noneCompression}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.posNorm}</span>
                  <strong style={{ color: '#fff' }}>{vertexQuantization.positions}b / {vertexQuantization.normals}b</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.uvColors}</span>
                  <strong style={{ color: '#fff' }}>{vertexQuantization.texcoords}b / {vertexQuantization.colors}b</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Textures full width */}
          <div className="skeuo-card" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--accent-emerald)' }}>
              <ImageIcon size={13} />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>{t.texturesKtx2Title}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t.processedTextures}</span>
                <strong style={{ color: '#fff' }}>{selectedTextures.length} / {textures.length}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t.outputFormat}</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>{textureSettings.format}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t.maxResMipmaps}</span>
                <strong style={{ color: '#fff' }}>{textureSettings.resolution}px � {textureSettings.mipmaps ? 'Mip ?' : 'No Mip'}</strong>
              </div>
            </div>
          </div>

          {/* Time & File */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.7rem', color: 'var(--text-muted)',
            background: 'rgba(0,0,0,0.35)', padding: '7px 12px', borderRadius: '7px',
            gap: '8px', flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <Clock size={12} color="var(--warm-amber)" />
              {t.processingTime} <strong style={{ color: '#fff' }}>{metrics.processingTimeMs} ms</strong>
            </span>
            <span
              style={{
                color: 'var(--cyan)', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', maxWidth: '55%',
                direction: 'rtl', textAlign: 'right',
              }}
              title={fileName}
            >
              {fileName}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 14px',
          background: 'linear-gradient(180deg, #111827 0%, #070a12 100%)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          display: 'flex', gap: '8px', flexShrink: 0,
        }}>
          <button
            className="btn-convex-secondary"
            onClick={() => { onClose(); onOpenSplitView(); }}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '9px 10px' }}
          >
            <Layers size={14} /> {t.openSplitView}
          </button>
          <button
            className="btn-convex-warm"
            onClick={onDownload}
            style={{ flex: 1.4, justifyContent: 'center', fontSize: '0.78rem', padding: '9px 10px' }}
          >
            <Download size={14} /> {t.exportCompressedGlb}
          </button>
        </div>
      </div>
    </div>
  );
};
