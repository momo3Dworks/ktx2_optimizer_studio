import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertTriangle, FileQuestion } from 'lucide-react';

interface GLBLoaderProps {
  /** Called when load progress changes, 0-100 */
  onProgress?: (pct: number, label: string) => void;
}

interface LoaderState {
  phase: 'idle' | 'fetching' | 'parsing' | 'done' | 'error';
  fetchPct: number;
  label: string;
  errorMsg?: string;
}

type LoaderCtx = {
  state: LoaderState;
  reset: () => void;
};

export function useGLBLoader(): LoaderCtx {
  const [state, setState] = useState<LoaderState>({
    phase: 'idle', fetchPct: 0, label: ''
  });
  const reset = () => setState({ phase: 'idle', fetchPct: 0, label: '' });
  return { state, reset };
}

interface GlbLoaderOverlayProps {
  phase: LoaderState['phase'];
  fetchPct: number;
  label: string;
  errorMsg?: string;
  fileName: string;
  lang: 'es' | 'en';
  onRetry?: () => void;
}

const LABELS = {
  es: {
    fetching: 'Descargando modelo',
    parsing: 'Analizando estructura GLB',
    done: 'Listo',
    error: 'Error al cargar',
    retry: 'Reintentar',
    abort: 'El archivo podría estar dañado o no es un GLB/GLTF válido.',
  },
  en: {
    fetching: 'Downloading model',
    parsing: 'Parsing GLB structure',
    done: 'Ready',
    error: 'Load error',
    retry: 'Retry',
    abort: 'The file may be corrupted or is not a valid GLB/GLTF.',
  }
};

export const GLBLoaderOverlay: React.FC<GlbLoaderOverlayProps> = ({
  phase, fetchPct, label, errorMsg, fileName, lang, onRetry
}) => {
  const lbl = LABELS[lang];
  const isError = phase === 'error';
  const visible = phase === 'fetching' || phase === 'parsing' || phase === 'error';
  const [dots, setDots] = useState('');

  // Animated ellipsis
  useEffect(() => {
    if (!visible || isError) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, [visible, isError]);

  if (!visible) return null;

  /* Radial pulse ring */
  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    border: `2px solid ${isError ? 'rgba(239,68,68,0.4)' : 'rgba(0,229,255,0.35)'}`,
    animation: isError ? 'none' : 'loaderPulse 2s ease-out infinite',
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(6, 12, 22, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        userSelect: 'none',
      }}
    >
      {/* Animated ring stack */}
      <div style={{ position: 'relative', width: '88px', height: '88px', marginBottom: '24px' }}>
        {/* Outer pulse rings */}
        {!isError && <>
          <div style={{ ...ringStyle, inset: '-18px', opacity: 0.35, animationDelay: '0s' }} />
          <div style={{ ...ringStyle, inset: '-8px', opacity: 0.6, animationDelay: '0.6s' }} />
        </>}

        {/* Center circle */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: isError
              ? 'radial-gradient(circle at 50% 35%, rgba(239,68,68,0.3), rgba(127,29,29,0.2))'
              : 'radial-gradient(circle at 50% 35%, rgba(0,229,255,0.18), rgba(2,132,199,0.12))',
            border: `2px solid ${isError ? 'rgba(239,68,68,0.6)' : 'rgba(0,229,255,0.5)'}`,
            boxShadow: isError
              ? '0 0 18px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 0 22px rgba(0,229,255,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isError
            ? <AlertTriangle size={28} color="#f87171" strokeWidth={2.2} />
            : phase === 'parsing'
              ? <FileQuestion size={28} color="#22d3ee" strokeWidth={1.8} style={{ animation: 'spin 3s linear infinite' }} />
              : <RefreshCw size={28} color="#22d3ee" strokeWidth={2} style={{ animation: 'spin 1.2s linear infinite' }} />
          }
        </div>
      </div>

      {/* Stage label */}
      <p style={{
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 700,
        fontSize: '15px',
        color: isError ? '#f87171' : '#e2e8f0',
        margin: 0,
        letterSpacing: '0.02em',
      }}>
        {isError ? lbl.error : label || (phase === 'parsing' ? lbl.parsing : lbl.fetching)}{!isError && dots}
      </p>

      {/* Filename sub-label */}
      <p style={{
        fontSize: '10.5px',
        color: 'rgba(148,163,184,0.6)',
        margin: '4px 0 16px 0',
        maxWidth: '280px',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {isError ? lbl.abort : fileName}
      </p>

      {/* Error message detail */}
      {isError && errorMsg && (
        <p style={{
          fontSize: '9.5px',
          color: 'rgba(248,113,113,0.65)',
          margin: '0 0 16px 0',
          maxWidth: '320px',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {errorMsg}
        </p>
      )}

      {/* Progress bar */}
      {!isError && phase === 'fetching' && (
        <div
          style={{
            width: '220px',
            height: '4px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${fetchPct}%`,
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #22d3ee, #0ea5e9)',
              boxShadow: '0 0 8px rgba(0,229,255,0.6)',
              transition: 'width 0.18s ease-out',
            }}
          />
        </div>
      )}
      {!isError && phase === 'fetching' && (
        <p style={{ fontSize: '9.5px', color: 'var(--muted)', margin: 0 }}>
          {fetchPct.toFixed(0)}%
        </p>
      )}

      {/* Parsing indeterminate bar */}
      {!isError && phase === 'parsing' && (
        <div
          style={{
            width: '220px',
            height: '4px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '40%',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #22d3ee, #38bdf8)',
              boxShadow: '0 0 8px rgba(0,229,255,0.5)',
              animation: 'parsingSlide 1.4s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Retry button on error */}
      {isError && onRetry && (
        <button
          onClick={onRetry}
          className="btn-convex-secondary"
          style={{ marginTop: '8px', padding: '5px 16px', gap: '6px' }}
        >
          <RefreshCw size={13} color="var(--cyan)" /> {lbl.retry}
        </button>
      )}

      <style>{`
        @keyframes loaderPulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          60%  { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes parsingSlide {
          0%   { transform: translateX(-150%); }
          50%  { transform: translateX(100%);  }
          100% { transform: translateX(350%);  }
        }
      `}</style>
    </div>
  );
};
