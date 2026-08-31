import React from 'react';
import {
  Sliders, FolderTree, Zap, Eye, Sparkles, Layers,
  Menu, RefreshCw
} from 'lucide-react';
import { ViewMode } from '../types/gltf';
import { Language, translations } from '../i18n/translations';

interface MobileDockProps {
  lang: Language;
  activeDrawer: 'none' | 'left' | 'right';
  setActiveDrawer: (drawer: 'none' | 'left' | 'right') => void;
  protectedCount: number;
  onCompress: () => void;
  isProcessing: boolean;
  hasBuffer: boolean;
  hasCompressed: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenActions: () => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({
  lang,
  activeDrawer,
  setActiveDrawer,
  protectedCount,
  onCompress,
  isProcessing,
  hasBuffer,
  hasCompressed,
  viewMode,
  setViewMode,
  onOpenActions
}) => {
  const t = translations[lang];

  const toggleLeft = () => {
    setActiveDrawer(activeDrawer === 'left' ? 'none' : 'left');
  };

  const toggleRight = () => {
    setActiveDrawer(activeDrawer === 'right' ? 'none' : 'right');
  };

  const cycleViewMode = () => {
    if (!hasCompressed) return;
    if (viewMode === 'original') setViewMode('compressed');
    else if (viewMode === 'compressed') setViewMode('split');
    else setViewMode('original');
  };

  return (
    <nav
      className="mobile-dock skeuo-card"
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        right: '10px',
        maxWidth: '460px',
        margin: '0 auto',
        height: '56px',
        background: 'var(--bg-panel)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow:
          '0 10px 30px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        zIndex: 40,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* 1. Left Options Drawer Trigger */}
      <button
        onClick={toggleLeft}
        className={`mobile-dock-btn ${activeDrawer === 'left' ? 'active' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          background: activeDrawer === 'left' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
          border: 'none',
          color: activeDrawer === 'left' ? 'var(--cyan)' : 'var(--muted)',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '8px',
          transition: 'all 0.15s ease',
          minWidth: '54px'
        }}
      >
        <Sliders size={17} color={activeDrawer === 'left' ? 'var(--cyan)' : 'var(--amber)'} />
        <span style={{ fontSize: '9px', fontWeight: 700 }}>{t.mobileOptions}</span>
      </button>

      {/* 2. Right Hierarchy Drawer Trigger */}
      <button
        onClick={toggleRight}
        className={`mobile-dock-btn ${activeDrawer === 'right' ? 'active' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          background: activeDrawer === 'right' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
          border: 'none',
          color: activeDrawer === 'right' ? 'var(--cyan)' : 'var(--muted)',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '8px',
          position: 'relative',
          transition: 'all 0.15s ease',
          minWidth: '54px'
        }}
      >
        <div style={{ position: 'relative' }}>
          <FolderTree size={17} color={activeDrawer === 'right' ? 'var(--cyan)' : '#38bdf8'} />
          {protectedCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-7px',
                background: 'var(--amber)',
                color: '#000',
                fontSize: '8px',
                fontWeight: 900,
                borderRadius: '8px',
                padding: '0 4px',
                lineHeight: '12px'
              }}
            >
              {protectedCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: '9px', fontWeight: 700 }}>{t.mobileHierarchy}</span>
      </button>

      {/* 3. Center Glowing Compress Action Button */}
      <button
        onClick={onCompress}
        disabled={isProcessing || !hasBuffer}
        className="btn-convex-primary"
        style={{
          height: '42px',
          padding: '0 14px',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, #00f2fe 0%, #00a8ff 100%)',
          color: '#03101d',
          border: '1px solid #00f2fe',
          boxShadow:
            '0 4px 14px rgba(0, 242, 254, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 900,
          fontSize: '11.5px',
          letterSpacing: '0.3px',
          cursor: isProcessing || !hasBuffer ? 'not-allowed' : 'pointer',
          opacity: isProcessing || !hasBuffer ? 0.6 : 1,
          transform: 'translateY(-2px)'
        }}
      >
        {isProcessing ? (
          <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Zap size={16} fill="#03101d" color="#03101d" />
        )}
        <span>{isProcessing ? t.processing : t.mobileCompress}</span>
      </button>

      {/* 4. Quick View Mode Button */}
      <button
        onClick={cycleViewMode}
        disabled={!hasCompressed}
        className="mobile-dock-btn"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          background: 'transparent',
          border: 'none',
          color: hasCompressed ? 'var(--cyan)' : 'var(--muted)',
          opacity: hasCompressed ? 1 : 0.45,
          cursor: hasCompressed ? 'pointer' : 'default',
          padding: '4px 8px',
          borderRadius: '8px',
          transition: 'all 0.15s ease',
          minWidth: '54px'
        }}
        title={t.mobileView}
      >
        {viewMode === 'original' && <Eye size={17} />}
        {viewMode === 'compressed' && <Sparkles size={17} color="var(--gold)" />}
        {viewMode === 'split' && <Layers size={17} color="#4ade80" />}
        <span style={{ fontSize: '9px', fontWeight: 700 }}>
          {viewMode === 'original' ? t.viewOriginal : viewMode === 'compressed' ? t.viewCompressed : t.viewSplit}
        </span>
      </button>

      {/* 5. Actions / More Menu */}
      <button
        onClick={onOpenActions}
        className="mobile-dock-btn"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          background: 'transparent',
          border: 'none',
          color: 'var(--txt)',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '8px',
          transition: 'all 0.15s ease',
          minWidth: '54px'
        }}
      >
        <Menu size={17} color="var(--gold)" />
        <span style={{ fontSize: '9px', fontWeight: 700 }}>{t.mobileMenu}</span>
      </button>
    </nav>
  );
};
