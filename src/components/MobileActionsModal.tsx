import React, { useRef } from 'react';
import {
  Upload, Box, Globe, BarChart3, Download, X,
  FileCheck, Sparkles, Check
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { CompressionMetrics } from '../types/gltf';

interface MobileActionsModalProps {
  lang: Language;
  setLang: (lang: Language) => void;
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  metrics: CompressionMetrics | null;
  hasCompressed: boolean;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onDownload: () => void;
  onOpenReportModal: () => void;
}

export const MobileActionsModal: React.FC<MobileActionsModalProps> = ({
  lang,
  setLang,
  isOpen,
  onClose,
  fileName,
  metrics,
  hasCompressed,
  onFileUpload,
  onLoadSample,
  onDownload,
  onOpenReportModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileUpload(e.target.files[0]);
      onClose();
    }
  };

  const formatMB = (b: number) => (b / (1024 * 1024)).toFixed(1) + 'MB';

  return (
    <div
      className="skeuo-modal-overlay"
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0',
        zIndex: 90
      }}
    >
      <div
        className="skeuo-modal-container"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
          borderRadius: '20px 20px 0 0',
          background: 'var(--bg-panel)',
          borderBottom: 'none',
          padding: '16px 18px 24px 18px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Header with Title & Close button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--cyan)" />
            <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
              {t.mobileMenu}
            </span>
          </div>
          <button
            className="btn-convex-secondary"
            onClick={onClose}
            style={{ padding: '4px 8px', borderRadius: '50%', width: '28px', height: '28px' }}
          >
            <X size={14} color="var(--amber)" />
          </button>
        </div>

        {/* Current File Info */}
        {fileName && (
          <div
            className="skeuo-card"
            style={{
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--muted)'
            }}
          >
            <span>{t.currentFile}</span>
            <strong style={{ color: '#fff', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </strong>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".glb,.gltf"
            style={{ display: 'none' }}
          />

          {/* Load GLB */}
          <button
            className="btn-convex-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ height: '38px', justifyContent: 'center', gap: '7px', fontSize: '11px' }}
          >
            <Upload size={14} color="var(--cyan)" />
            <span>{t.loadGlb}</span>
          </button>

          {/* Sample Scene */}
          <button
            className="btn-convex-secondary"
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            style={{ height: '38px', justifyContent: 'center', gap: '7px', fontSize: '11px' }}
          >
            <Box size={14} color="var(--gold)" />
            <span>{t.sampleScene}</span>
          </button>

          {/* Language Switch */}
          <button
            className="btn-convex-secondary"
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            style={{ height: '38px', justifyContent: 'center', gap: '7px', fontSize: '11px', color: 'var(--gold)' }}
          >
            <Globe size={14} color="var(--cyan)" />
            <span>{lang === 'es' ? 'Español (ES)' : 'English (EN)'}</span>
          </button>

          {/* Detailed Report Modal */}
          {metrics && (
            <button
              className="btn-convex-secondary"
              onClick={() => {
                onOpenReportModal();
                onClose();
              }}
              style={{ height: '38px', justifyContent: 'center', gap: '7px', fontSize: '11px', color: 'var(--cyan)' }}
            >
              <BarChart3 size={14} color="var(--cyan)" />
              <span>{t.reportTitle.split(' ')[0]} {t.reportTitle.split(' ')[1]}</span>
            </button>
          )}

          {/* Export / Download GLB */}
          {hasCompressed && (
            <button
              className="btn-convex-warm"
              onClick={() => {
                onDownload();
                onClose();
              }}
              style={{
                gridColumn: metrics ? 'span 2' : 'span 1',
                height: '38px',
                justifyContent: 'center',
                gap: '7px',
                fontSize: '11.5px'
              }}
            >
              <Download size={14} />
              <span>{t.exportGlb}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
