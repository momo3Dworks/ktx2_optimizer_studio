import React from 'react';
import {
  Upload, Box, Zap, Download, Eye, Layers, Sparkles,
  RefreshCw, FileCheck, BarChart3, Globe
} from 'lucide-react';
import { ViewMode, CompressionMetrics } from '../types/gltf';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  fileName: string;
  isProcessing: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  metrics: CompressionMetrics | null;
  hasCompressed: boolean;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onCompress: () => void;
  onDownload: () => void;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang, setLang, fileName, isProcessing, viewMode, setViewMode,
  metrics, hasCompressed, onFileUpload, onLoadSample,
  onCompress, onDownload, onOpenReportModal
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const formatMB = (b: number) => (b / (1024 * 1024)).toFixed(1) + 'MB';
  const pct = metrics
    ? (((metrics.originalSizeBytes - metrics.compressedSizeBytes) / metrics.originalSizeBytes) * 100).toFixed(1)
    : '0';

  return (
    <header
      className="skeuo-panel"
      style={{
        height: '46px',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        zIndex: 30,
        position: 'relative',
        flexShrink: 0
      }}
    >
      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div
          style={{
            background: 'linear-gradient(145deg, #22d3ee 0%, #0284c7 100%)',
            width: '28px', height: '28px',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#030e17',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.55), 0 0 10px rgba(0,229,255,0.35), 0 2px 5px rgba(0,0,0,0.5)'
          }}
        >
          <Zap size={16} strokeWidth={2.5} />
        </div>
        <div>
          <div
            style={{
              fontSize: '12px', fontWeight: 800, fontFamily: 'Outfit,sans-serif',
              background: 'linear-gradient(90deg,#fff,#94a3b8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1.1, whiteSpace: 'nowrap'
            }}
          >
            KTX2 Optimizer Studio
          </div>
          <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1, whiteSpace: 'nowrap' }}>
            by Yeberson Orta
          </div>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* File actions */}
        <input
          type="file" ref={fileInputRef}
          onChange={e => e.target.files?.[0] && onFileUpload(e.target.files[0])}
          accept=".glb,.gltf" style={{ display: 'none' }}
        />
        <button className="btn-convex-secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload size={12} /> {t.loadGlb}
        </button>
        <button className="btn-convex-secondary" onClick={onLoadSample}>
          <Box size={12} color="var(--gold)" /> {t.sampleScene}
        </button>

        {fileName && (
          <span
            style={{
              fontSize: '10.5px', color: '#475569',
              background: 'linear-gradient(175deg,#111a26,#080e18)',
              padding: '3px 8px', borderRadius: '5px',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.4)',
              maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}
          >
            {fileName}
          </span>
        )}
      </div>

      {/* ── Centre: view-mode tabs (only when compressed) ── */}
      {hasCompressed && (
        <div className="tab-group-skeuo" style={{ width: '260px', flexShrink: 0 }}>
          <button
            className={`tab-btn-skeuo ${viewMode === 'original' ? 'active' : ''}`}
            onClick={() => setViewMode('original')}
          >
            <Eye size={11} style={{ display: 'inline', marginRight: '3px' }} />
            {t.viewOriginal}
          </button>
          <button
            className={`tab-btn-skeuo ${viewMode === 'compressed' ? 'active-warm' : ''}`}
            onClick={() => setViewMode('compressed')}
          >
            <Sparkles size={11} style={{ display: 'inline', marginRight: '3px' }} />
            {t.viewCompressed}
          </button>
          <button
            className={`tab-btn-skeuo ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            <Layers size={11} style={{ display: 'inline', marginRight: '3px' }} />
            {t.viewSplit}
          </button>
        </div>
      )}

      {/* ── Right: lang + metrics + actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
        {/* Language */}
        <button
          className="btn-convex-secondary"
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          style={{ padding: '3px 8px', gap: '4px', color: 'var(--gold)', fontWeight: 800, fontSize: '11px' }}
        >
          <Globe size={12} color="var(--cyan)" />
          {lang === 'es' ? 'ES' : 'EN'}
        </button>

        {/* Metrics pill */}
        {metrics && (
          <div
            onClick={onOpenReportModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(175deg,#18233a,#0d1524)',
              padding: '3px 10px', borderRadius: '7px',
              border: '1px solid rgba(245,158,11,0.3)',
              borderBottom: '1px solid rgba(0,0,0,0.4)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 8px rgba(245,158,11,0.2), 0 2px 5px rgba(0,0,0,0.4)',
              cursor: 'pointer'
            }}
          >
            <FileCheck size={13} color="var(--amber)" />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatMB(metrics.originalSizeBytes)}</span>
            <span style={{ fontSize: '10px', color: 'var(--amber)' }}>➔</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)' }}>
              {formatMB(metrics.compressedSizeBytes)}
            </span>
            <span
              style={{
                fontSize: '10px', fontWeight: 800, color: '#4ade80',
                background: 'rgba(74,222,128,0.1)', padding: '1px 5px',
                borderRadius: '4px', border: '1px solid rgba(74,222,128,0.25)'
              }}
            >
              -{pct}%
            </span>
            <BarChart3 size={12} color="var(--cyan)" />
          </div>
        )}

        {/* Process & Compress */}
        <button className="btn-convex" onClick={onCompress} disabled={isProcessing}>
          {isProcessing
            ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> {t.processing}</>
            : <><Zap size={13} /> {t.processCompress}</>
          }
        </button>

        {/* Download */}
        {hasCompressed && (
          <button className="btn-convex-warm" onClick={onDownload}>
            <Download size={12} /> {t.exportGlb}
          </button>
        )}
      </div>
    </header>
  );
};
