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
  ArrowRight
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

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  const savedBytes = metrics.originalSizeBytes - metrics.compressedSizeBytes;
  const reductionPercent = (
    (savedBytes / metrics.originalSizeBytes) *
    100
  ).toFixed(1);

  const activeMeshOpts = Object.entries(meshOpts)
    .filter(([_, active]) => active)
    .map(([key]) => key.toUpperCase());

  const selectedTextures = textures.filter((tItem) => tItem.selectedForCompression);

  return (
    <div className="skeuo-modal-overlay" onClick={onClose}>
      <div className="skeuo-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1c1000',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)'
              }}
            >
              <Zap size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                {t.reportTitle}
              </h2>
              <span className="warm-glow-badge" style={{ marginTop: '2px' }}>
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
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Headline Size Reduction Banner */}
          <div
            className="skeuo-card"
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #1c273c 0%, #121927 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr auto 1fr',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.statOriginalSize}</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                {formatSize(metrics.originalSizeBytes)}
              </div>
            </div>

            <ArrowRight size={22} color="var(--warm-amber)" />

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.statCompressedSize}</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                {formatSize(metrics.compressedSizeBytes)}
              </div>
            </div>

            <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.statTotalSavings}</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--warm-gold)', marginTop: '4px' }}>
                -{reductionPercent}%
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                ({formatSize(savedBytes)} {t.statSavedLess})
              </span>
            </div>
          </div>

          {/* Details Grid (3 Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Card 1: Geometría & Meshes */}
            <div className="skeuo-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-cyan)' }}>
                <Cpu size={18} />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{t.geometryMeshes}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
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

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.protectedEmptiesSplines}</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> {protectedNodeCount} {t.preserved}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Vertex Quantization & Draco */}
            <div className="skeuo-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--warm-amber)' }}>
                <Sparkles size={18} />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{t.quantDracoTitle}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
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
            <div className="skeuo-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-emerald)' }}>
                <ImageIcon size={18} />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{t.texturesKtx2Title}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--warm-amber)" /> {t.processingTime} <strong>{metrics.processingTimeMs} ms</strong>
            </span>
            <span>{t.fileLabel} <strong>{fileName}</strong></span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(180deg, #111827 0%, #070a12 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button className="btn-convex-secondary" onClick={() => { onClose(); onOpenSplitView(); }}>
            <Layers size={16} /> {t.openSplitView}
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-convex-secondary" onClick={onClose}>
              {t.closeReport}
            </button>

            <button className="btn-convex-warm" onClick={onDownload}>
              <Download size={16} /> {t.exportCompressedGlb}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
