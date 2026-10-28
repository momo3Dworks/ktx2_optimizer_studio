import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CloudOff,
  FileBox,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';
import { blenderBridge, BlenderStatus, BridgeConnectionState } from '../services/blenderBridge';
import { Language } from '../i18n/translations';

interface BlenderPanelProps {
  lang: Language;
  onGLBReceived: (buffer: ArrayBuffer, fileName: string) => void;
}

export const BlenderPanel: React.FC<BlenderPanelProps> = ({ lang, onGLBReceived }) => {
  const [connState, setConnState] = useState<BridgeConnectionState>('disconnected');
  const [status, setStatus] = useState<BlenderStatus | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lastSyncAgo, setLastSyncAgo] = useState<string | null>(null);
  const [flashNew, setFlashNew] = useState(false);
  const agoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSceneChanged = useCallback(
    async (s: BlenderStatus) => {
      setStatus(s);
      if (s.has_glb || (s as any).size > 0 || (s as any).last_export_size > 0) {
        setIsSyncing(true);
        setFlashNew(true);
        setTimeout(() => setFlashNew(false), 1200);
        const buf = await blenderBridge.fetchGLB();
        if (buf && buf.byteLength > 0) {
          const rawName = s.scene || 'blender_scene';
          const name = rawName.toLowerCase().endsWith('.glb') ? rawName : `${rawName}.glb`;
          onGLBReceived(buf, name);
        }
        setIsSyncing(false);
      }
    },
    [onGLBReceived],
  );

  useEffect(() => {
    blenderBridge.start();
    const onConn = (state: BridgeConnectionState) => {
      setConnState(state);
      if (state === 'connected') setStatus(blenderBridge.status);
    };
    blenderBridge.on('connectionChange', onConn);
    blenderBridge.on('sceneChanged', handleSceneChanged);
    return () => {
      blenderBridge.off('connectionChange', onConn);
      blenderBridge.off('sceneChanged', handleSceneChanged);
    };
  }, [handleSceneChanged]);

  useEffect(() => {
    blenderBridge.autoSync = autoSync;
  }, [autoSync]);

  useEffect(() => {
    const tick = () => {
      const s = blenderBridge.status;
      if (s && s.last_export_ts > 0) {
        const ago = Math.floor(Date.now() / 1000 - s.last_export_ts);
        if (ago < 60) setLastSyncAgo(ago + 's ago');
        else if (ago < 3600) setLastSyncAgo(Math.floor(ago / 60) + 'm ago');
        else setLastSyncAgo(null);
      } else {
        setLastSyncAgo(null);
      }
    };
    tick();
    agoTimer.current = setInterval(tick, 5000);
    return () => { if (agoTimer.current) clearInterval(agoTimer.current); };
  }, []);

  const handleSyncNow = async () => {
    if (isSyncing || connState !== 'connected') return;
    setIsSyncing(true);
    await blenderBridge.triggerSnapshot();
    const buf = await blenderBridge.fetchGLB();
    if (buf && buf.byteLength > 0) {
      const sceneName = blenderBridge.status?.scene ?? 'blender_scene';
      const name = sceneName.toLowerCase().endsWith('.glb') ? sceneName : `${sceneName}.glb`;
      onGLBReceived(buf, name);
      setFlashNew(true);
      setTimeout(() => setFlashNew(false), 1200);
    }
    setIsSyncing(false);
  };

  const isConnected = connState === 'connected';

  return (
    <div className={'blender-panel' + (flashNew ? ' blender-panel--flash' : '')}>
      {/* Header */}
      <button
        className="blender-panel__header"
        onClick={() => setCollapsed((c) => !c)}
        type="button"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={'blender-dot' + (isConnected ? ' blender-dot--on' : ' blender-dot--off') + (flashNew ? ' blender-dot--flash' : '')} />
          <Box size={14} color="var(--warm-amber)" />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e2e8f0' }}>
            Blender Live
          </span>
          {isConnected && status && (
            <span style={{
              fontSize: '0.65rem', color: 'var(--accent-emerald)',
              background: 'rgba(52,211,153,0.12)', padding: '1px 6px',
              borderRadius: '10px', border: '1px solid rgba(52,211,153,0.25)',
              fontWeight: 600,
            }}>
              {status.objects} {lang === 'es' ? 'obj' : 'obj'}
            </span>
          )}
        </span>
        {collapsed
          ? <ChevronRight size={14} color="var(--text-muted)" />
          : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>

      {!collapsed && (
        <div className="blender-panel__body">

          {/* Status card */}
          <div className="blender-status-card">
            {isConnected && status ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <CheckCircle2 size={12} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {lang === 'es' ? 'Blender conectado' : 'Blender connected'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileBox size={11} />
                    <strong style={{ color: '#fff' }}>{status.scene}</strong>
                  </span>
                  {lastSyncAgo && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={11} />
                      {lastSyncAgo}
                    </span>
                  )}
                </div>
                {status.last_export_size > 0 && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {lang === 'es' ? 'Ultimo GLB:' : 'Last GLB:'}{' '}
                    <strong style={{ color: 'var(--cyan)' }}>
                      {(status.last_export_size / 1024).toFixed(1)} KB
                    </strong>
                    {' · '}
                    <span style={{ color: 'var(--muted)' }}>
                      {status.scope === 'collection'
                        ? (lang === 'es' ? 'coleccion activa' : 'active collection')
                        : (lang === 'es' ? 'seleccionados' : 'selected objects')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudOff size={14} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {lang === 'es' ? 'Sin conexion con Blender' : 'Blender not detected'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {lang === 'es'
                      ? 'Activa el addon -> N-Panel -> KTX2 Bridge'
                      : 'Enable addon -> N-Panel -> KTX2 Bridge'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className="btn-convex-secondary blender-btn"
              onClick={handleSyncNow}
              disabled={!isConnected || isSyncing}
              title={lang === 'es' ? 'Sincronizar ahora' : 'Sync Now'}
            >
              {isSyncing
                ? <Loader2 size={13} className="spin-icon" />
                : <RefreshCw size={13} />}
              {lang === 'es' ? 'Sync' : 'Sync'}
            </button>

            <button
              className="btn-convex-secondary blender-btn"
              onClick={() => setAutoSync((v) => !v)}
              title={autoSync
                ? (lang === 'es' ? 'Desactivar auto-sync' : 'Disable auto-sync')
                : (lang === 'es' ? 'Activar auto-sync' : 'Enable auto-sync')}
              style={{ color: autoSync ? 'var(--accent-emerald)' : undefined }}
            >
              {autoSync
                ? <ToggleRight size={13} color="var(--accent-emerald)" />
                : <ToggleLeft size={13} />}
              Auto
            </button>
          </div>

          {/* Port hint */}
          <div style={{
            fontSize: '0.62rem', color: 'var(--muted)',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Zap size={10} color="var(--warm-amber)" />
            localhost:7842
          </div>
        </div>
      )}
    </div>
  );
};
