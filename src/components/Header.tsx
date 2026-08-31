import React, { useRef } from 'react';
import {
  Upload, Box, Zap, Download, Eye, Layers, Sparkles,
  RefreshCw, FileCheck, BarChart3, Globe
} from 'lucide-react';
import { ViewMode, CompressionMetrics, ModelFileStats } from '../types/gltf';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  fileName: string;
  isProcessing: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  metrics: CompressionMetrics | null;
  fileStats: ModelFileStats | null;
  hasCompressed: boolean;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onCompress: () => void;
  onDownload: () => void;
  onOpenReportModal: () => void;
  isMobile?: boolean;
  onOpenMobileActions?: () => void;
}

const DIORAMA_CREDITS_URL = 'https://sketchfab.com/3d-models/wood-platform-diorama-7a76349928ca43ea9981de345f709ec3';
const DEFAULT_FILE_NAME = 'wood_platform_diorama.glb';

export const Header: React.FC<HeaderProps> = ({
  lang, setLang, fileName, isProcessing, viewMode, setViewMode,
  metrics, fileStats, hasCompressed, onFileUpload, onLoadSample,
  onCompress, onDownload, onOpenReportModal, isMobile, onOpenMobileActions
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const formatMB = (b: number) =>
    b >= 1024 * 1024 ? (b / (1024 * 1024)).toFixed(1) + ' MB'
    : (b / 1024).toFixed(0) + ' KB';

  const pct = metrics
    ? (((metrics.originalSizeBytes - metrics.compressedSizeBytes) / metrics.originalSizeBytes) * 100).toFixed(1)
    : '0';

  const isDefaultModel = fileName === DEFAULT_FILE_NAME;

  /* ── Unified Filename + Live Status / Comparison Chip ── */
  const FileChip = () => {
    if (!fileName) return null;

    return (
      <div
        className="skeuo-card"
        onClick={metrics ? onOpenReportModal : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: metrics
            ? 'linear-gradient(165deg, rgba(20, 35, 55, 0.95), rgba(10, 18, 30, 0.95))'
            : 'var(--bg-dark)',
          padding: '3px 9px 3px 7px',
          borderRadius: '7px',
          border: metrics
            ? '1px solid rgba(0, 229, 255, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: metrics
            ? '0 0 10px rgba(0, 229, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 5px rgba(0,0,0,0.5)'
            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.4)',
          cursor: metrics ? 'pointer' : 'default',
          flexShrink: 0,
          transition: 'all 0.18s ease'
        }}
        title={
          metrics
            ? (lang === 'es' ? '¡Archivo comprimido! Clic para abrir el reporte completo' : 'Compressed! Click to open full report')
            : (fileStats
                ? `${fileStats.sizeBytes.toLocaleString()} bytes · ${fileStats.vertexCount.toLocaleString()} ${t.statusVertices} · ${fileStats.faceCount.toLocaleString()} ${t.statusTriangles} · ${fileStats.textureCount} ${t.statusTextures}`
                : fileName)
        }
      >
        {/* File icon / Metric icon */}
        {metrics ? (
          <FileCheck size={13} color="var(--cyan)" style={{ flexShrink: 0 }} />
        ) : (
          <Box size={12} color="var(--cyan)" style={{ flexShrink: 0 }} />
        )}

        {/* Filename */}
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: metrics ? 700 : 500,
            color: metrics ? '#e2e8f0' : 'var(--muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: isMobile ? '85px' : '125px',
          }}
        >
          {fileName}
        </span>

        {/* ── 1. PRE-COMPRESSION STATS (Next to filename) ── */}
        {!metrics && fileStats && (
          <>
            <span style={{ width: '1px', height: '11px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
            <span
              style={{ fontSize: '10px', fontWeight: 800, color: 'var(--cyan)', whiteSpace: 'nowrap' }}
            >
              {formatMB(fileStats.sizeBytes)}
            </span>
            {!isMobile && (
              <>
                <span style={{ width: '1px', height: '11px', background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />
                <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {(fileStats.vertexCount / 1000).toFixed(1)}k <strong style={{ color: '#e2e8f0' }}>V</strong>
                </span>
                <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {(fileStats.faceCount / 1000).toFixed(1)}k <strong style={{ color: 'var(--gold)' }}>T</strong>
                </span>
                {fileStats.textureCount > 0 && (
                  <span style={{ fontSize: '9.5px', color: 'var(--amber)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {fileStats.textureCount} tex
                  </span>
                )}
              </>
            )}
          </>
        )}

        {/* ── 2. POST-COMPRESSION RESULTS COMPARISON (Next to filename) ── */}
        {metrics && (
          <>
            <span style={{ width: '1px', height: '12px', background: 'rgba(0,229,255,0.3)', flexShrink: 0 }} />

            {!isMobile && (
              <>
                <span style={{ fontSize: '10px', color: 'var(--muted)', textDecoration: 'line-through' }}>
                  {formatMB(metrics.originalSizeBytes)}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--cyan)' }}>➔</span>
              </>
            )}

            <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--gold)', whiteSpace: 'nowrap' }}>
              {formatMB(metrics.compressedSizeBytes)}
            </span>

            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                color: '#4ade80',
                background: 'rgba(74,222,128,0.15)',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(74,222,128,0.35)',
                whiteSpace: 'nowrap'
              }}
            >
              -{pct}%
            </span>

            {!isMobile && (
              <>
                <span style={{ width: '1px', height: '11px', background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />
                <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {(metrics.compressedVertices / 1000).toFixed(1)}k <strong style={{ color: '#e2e8f0' }}>V</strong>
                </span>
                <BarChart3 size={11} color="var(--cyan)" style={{ marginLeft: '1px' }} />
              </>
            )}
          </>
        )}

        {/* Credits link for default model */}
        {isDefaultModel && (
          <a
            href={DIORAMA_CREDITS_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Sketchfab — 3D model credits"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(148, 163, 184, 0.5)',
              textDecoration: 'none',
              fontSize: '9.5px',
              marginLeft: '2px',
              flexShrink: 0,
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148, 163, 184, 0.5)')}
          >
            ©
          </a>
        )}
      </div>
    );
  };

  return (
    <header
      className="skeuo-panel"
      style={{
        height: '46px',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        zIndex: 30,
        position: 'relative',
        flexShrink: 0
      }}
    >
      {/* ── Left: Brand + File actions + Unified Filename & Results Chip ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, overflow: 'hidden' }}>
        {/* Logo */}
        <div
          style={{
            background: 'linear-gradient(145deg, #22d3ee 0%, #0284c7 100%)',
            width: '28px', height: '28px', flexShrink: 0,
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#030e17',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 0 10px rgba(0,229,255,0.35), 0 2px 5px rgba(0,0,0,0.5)'
          }}
        >
          <Zap size={16} strokeWidth={2.5} />
        </div>

        {/* App title */}
        {!isMobile && (
          <div style={{ flexShrink: 0 }}>
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
            <div style={{ fontSize: '9px', color: 'var(--muted)', lineHeight: 1, whiteSpace: 'nowrap' }}>
              by Yeberson Orta
            </div>
          </div>
        )}

        {/* Desktop-only file actions */}
        {!isMobile && (
          <>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
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
          </>
        )}

        {/* ── Filename + Live Status & Results Comparison Chip ── */}
        <FileChip />
      </div>

      {/* ── Centre: view-mode tabs (desktop only, after compression) ── */}
      {!isMobile && hasCompressed && (
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

      {/* ── Right: lang + actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Language toggle */}
        <button
          className="btn-convex-secondary"
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          style={{ padding: '3px 8px', gap: '4px', color: 'var(--gold)', fontWeight: 800, fontSize: '10.5px' }}
        >
          <Globe size={12} color="var(--cyan)" />
          {lang === 'es' ? 'ES' : 'EN'}
        </button>

        {/* Desktop: Compress + Download */}
        {!isMobile && (
          <>
            <button className="btn-convex" onClick={onCompress} disabled={isProcessing}>
              {isProcessing
                ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> {t.processing}</>
                : <><Zap size={13} /> {t.processCompress}</>
              }
            </button>
            {hasCompressed && (
              <button className="btn-convex-warm" onClick={onDownload}>
                <Download size={12} /> {t.exportGlb}
              </button>
            )}
          </>
        )}

        {/* Mobile: open actions sheet */}
        {isMobile && onOpenMobileActions && (
          <button
            className="btn-convex-secondary"
            onClick={onOpenMobileActions}
            style={{ padding: '3px 8px', color: 'var(--cyan)' }}
          >
            <Upload size={12} />
          </button>
        )}
      </div>
    </header>
  );
};
