import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Box, Zap, Download, Eye, Layers, Sparkles,
  RefreshCw, FileCheck, BarChart3, Globe, Triangle, Cpu, Image as ImageIcon
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

  /* ── Inline filename+stats chip ── */
  const FileChip = () => {
    if (!fileName) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'var(--bg-dark)',
          padding: '2px 8px 2px 6px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.4)',
          maxWidth: isMobile ? '120px' : '260px',
          flexShrink: 0
        }}
      >
        {/* filename */}
        <span
          style={{
            fontSize: '10px', color: 'var(--muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: isMobile ? '80px' : '130px',
          }}
          title={fileName}
        >
          {fileName}
        </span>

        {/* Inline file stats — shown when parsed and not yet compressed */}
        {!metrics && fileStats && !isMobile && (
          <>
            <span style={{ width: '1px', height: '11px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
            <span
              style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--cyan)', whiteSpace: 'nowrap' }}
              title={t.statusVertices}
            >
              {formatMB(fileStats.sizeBytes)}
            </span>
            <span style={{ width: '1px', height: '11px', background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />
            <span style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {(fileStats.vertexCount / 1000).toFixed(1)}k <strong style={{ color: '#e2e8f0' }}>V</strong>
            </span>
            <span style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {(fileStats.faceCount / 1000).toFixed(1)}k <strong style={{ color: 'var(--gold)' }}>T</strong>
            </span>
            {fileStats.textureCount > 0 && (
              <span style={{ fontSize: '9px', color: 'var(--amber)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {fileStats.textureCount} tex
              </span>
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
              fontSize: '9px',
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
      {/* ── Left: Brand + file actions ── */}
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

        {/* ── Filename chip with inline stats — always visible ── */}
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

      {/* ── Right: lang + comparative metrics + actions ── */}
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

        {/* ── Compression result pill (replaces the file chip stats) ── */}
        {metrics && (
          <div
            onClick={onOpenReportModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'var(--bg-card)',
              padding: '3px 8px', borderRadius: '7px',
              border: '1px solid rgba(245,158,11,0.3)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 8px rgba(245,158,11,0.2), 0 2px 5px rgba(0,0,0,0.4)',
              cursor: 'pointer'
            }}
            title={lang === 'es' ? 'Clic para ver reporte detallado' : 'Click to view detailed report'}
          >
            <FileCheck size={12} color="var(--amber)" />
            {!isMobile && (
              <>
                <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{formatMB(metrics.originalSizeBytes)}</span>
                <span style={{ fontSize: '9px', color: 'var(--amber)' }}>➔</span>
              </>
            )}
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--gold)' }}>
              {formatMB(metrics.compressedSizeBytes)}
            </span>
            <span
              style={{
                fontSize: '9.5px', fontWeight: 800, color: '#4ade80',
                background: 'rgba(74,222,128,0.1)', padding: '1px 4px',
                borderRadius: '4px', border: '1px solid rgba(74,222,128,0.25)'
              }}
            >
              -{pct}%
            </span>
            <BarChart3 size={11} color="var(--cyan)" />
          </div>
        )}

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
