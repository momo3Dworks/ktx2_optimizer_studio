import React, { useState, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Gauge,
  Film,
  ChevronDown
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface AnimationInfo {
  name: string;
  duration: number;
  tracks: number;
}

interface AnimationBarProps {
  lang: Language;
  animations: AnimationInfo[];
  activeClipName: string | null;
  setActiveClipName: (name: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (v: number) => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onStop: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

export const AnimationBar: React.FC<AnimationBarProps> = ({
  lang,
  animations,
  activeClipName,
  setActiveClipName,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  currentTime,
  duration,
  onSeek,
  onStop,
}) => {
  const t = translations[lang];
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const activeAnim = animations.find((a) => a.name === activeClipName);

  const computeSeekFromEvent = useCallback(
    (clientX: number) => {
      if (!scrubberRef.current || !duration) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const handleScrubMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    computeSeekFromEvent(e.clientX);

    const onMove = (ev: MouseEvent) => {
      if (isDragging.current) computeSeekFromEvent(ev.clientX);
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const jumpToClip = (dir: 1 | -1) => {
    if (!animations.length) return;
    const idx = animations.findIndex((a) => a.name === activeClipName);
    const next = (idx + dir + animations.length) % animations.length;
    setActiveClipName(animations[next].name);
    setIsPlaying(true);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (animations.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(8, 11, 17, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: '12px',
          padding: '8px 16px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        <Film size={14} color="var(--text-muted)" />
        {t.noAnimations}
      </div>
    );
  }

  return (
    <div
      className="animation-bar-container"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        width: 'min(720px, calc(100% - 80px))',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '16px',
        boxShadow:
          '0 -4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Top strip — scrubber */}
      <div style={{ padding: '12px 16px 4px' }}>
        {/* Clip title + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Film size={13} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {activeClipName ?? t.selectAnimation}
            </span>
            {activeAnim && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                · {activeAnim.tracks} {t.tracks}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#94a3b8' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Scrubber track */}
        <div
          ref={scrubberRef}
          onMouseDown={handleScrubMouseDown}
          style={{
            position: 'relative',
            height: '6px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '3px',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)'
          }}
        >
          {/* Filled portion */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progress}%`,
              borderRadius: '3px',
              background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              boxShadow: '0 0 8px rgba(0,242,254,0.5)',
              transition: isDragging.current ? 'none' : 'width 0.08s linear'
            }}
          />
          {/* Thumb */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #ffffff 0%, #c0d4f0 100%)',
              boxShadow:
                '0 2px 6px rgba(0,0,0,0.8), 0 0 0 2px rgba(0,242,254,0.6), inset 0 1px 2px rgba(255,255,255,0.9)',
              cursor: 'grab'
            }}
          />
        </div>
      </div>

      {/* Bottom row — controls */}
      <div
        style={{
          padding: '8px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* ── Clip dropdown ── */}
        <div style={{ position: 'relative', flex: '0 0 auto', minWidth: '180px' }}>
          <select
            className="skeuo-select"
            value={activeClipName ?? ''}
            onChange={(e) => {
              setActiveClipName(e.target.value || null);
              setIsPlaying(true);
            }}
            style={{ paddingRight: '28px', fontSize: '0.78rem', height: '34px' }}
          >
            <option value="">{t.selectAnimation}</option>
            {animations.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name} ({a.duration.toFixed(2)}s)
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            color="var(--text-muted)"
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>

        {/* ── Transport controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Prev clip */}
          <button
            className="btn-convex-secondary"
            style={{ padding: '6px 8px', borderRadius: '8px' }}
            onClick={() => jumpToClip(-1)}
            title={t.prevClip}
          >
            <SkipBack size={15} />
          </button>

          {/* Play / Pause */}
          <button
            className="btn-convex-warm"
            style={{ padding: '7px 14px', borderRadius: '10px', minWidth: '48px', justifyContent: 'center' }}
            onClick={() => {
              if (!activeClipName && animations.length) {
                setActiveClipName(animations[0].name);
                setIsPlaying(true);
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
            disabled={!animations.length}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>

          {/* Stop */}
          <button
            className="btn-convex-secondary"
            style={{ padding: '6px 8px', borderRadius: '8px' }}
            onClick={() => { onStop(); setIsPlaying(false); }}
            title={t.stopAnim}
          >
            <Square size={15} />
          </button>

          {/* Next clip */}
          <button
            className="btn-convex-secondary"
            style={{ padding: '6px 8px', borderRadius: '8px' }}
            onClick={() => jumpToClip(1)}
            title={t.nextClip}
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Speed picker ── */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-convex-secondary"
            style={{ padding: '6px 10px', borderRadius: '8px', gap: '5px', fontSize: '0.75rem' }}
            onClick={() => setShowSpeedMenu((p) => !p)}
            title={t.playbackSpeed}
          >
            <Gauge size={14} />
            {playbackSpeed}×
          </button>
          {showSpeedMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '36px',
                right: 0,
                background: 'linear-gradient(180deg, #1e293b 0%, #0d1624 100%)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 -8px 24px rgba(0,0,0,0.7)',
                zIndex: 40,
                minWidth: '90px'
              }}
              onMouseLeave={() => setShowSpeedMenu(false)}
            >
              {SPEED_OPTIONS.map((sp) => (
                <button
                  key={sp}
                  onClick={() => { setPlaybackSpeed(sp); setShowSpeedMenu(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '7px 14px',
                    textAlign: 'left',
                    background: playbackSpeed === sp
                      ? 'linear-gradient(90deg, rgba(245,158,11,0.2) 0%, transparent 100%)'
                      : 'transparent',
                    color: playbackSpeed === sp ? '#fbbf24' : '#94a3b8',
                    fontSize: '0.78rem',
                    fontWeight: playbackSpeed === sp ? 800 : 400,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {sp}×
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Loop indicator (always on for now) ── */}
        <div title={t.loopingOn} style={{ display: 'flex', alignItems: 'center' }}>
          <Repeat size={14} color="rgba(0,242,254,0.55)" />
        </div>

        {/* ── Clip count pill ── */}
        <span
          style={{
            fontSize: '0.68rem',
            background: 'rgba(0,242,254,0.1)',
            border: '1px solid rgba(0,242,254,0.25)',
            color: 'var(--accent-cyan)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}
        >
          {animations.length} {t.clips}
        </span>
      </div>
    </div>
  );
};
