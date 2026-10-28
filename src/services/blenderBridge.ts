/**
 * BlenderBridge Service
 * Singleton that manages the connection to the KTX2 Bridge addon running in Blender.
 *
 * Protocol:
 *   GET  http://localhost:7842/status      -> { connected, scene, objects, last_export_ts, ... }
 *   GET  http://localhost:7842/export.glb  -> binary GLB
 *   GET  http://localhost:7842/events      -> SSE stream with "scene_changed" events
 *   POST http://localhost:7842/snapshot    -> trigger immediate export
 */

const BRIDGE_PORT = 7842;
const BASE_URL = `http://localhost:${BRIDGE_PORT}`;
const POLL_INTERVAL_MS = 2500; // interval when disconnected to find Blender

export interface BlenderStatus {
  connected: boolean;
  scene: string;
  objects: number;
  last_export_ts: number;
  last_export_size: number;
  scope: 'collection' | 'selected';
  has_glb: boolean;
}

export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type Listener<T> = (payload: T) => void;

class BlenderBridgeService {
  private _connectionState: BridgeConnectionState = 'disconnected';
  private _status: BlenderStatus | null = null;
  private _eventSource: EventSource | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _autoSync: boolean = true;
  private _isChecking: boolean = false;

  private _listeners: {
    connectionChange: Listener<BridgeConnectionState>[];
    sceneChanged: Listener<BlenderStatus>[];
  } = { connectionChange: [], sceneChanged: [] };

  get connectionState(): BridgeConnectionState {
    return this._connectionState;
  }

  get status(): BlenderStatus | null {
    return this._status;
  }

  get autoSync(): boolean {
    return this._autoSync;
  }

  set autoSync(value: boolean) {
    this._autoSync = value;
  }

  on(event: 'connectionChange', cb: Listener<BridgeConnectionState>): void;
  on(event: 'sceneChanged', cb: Listener<BlenderStatus>): void;
  on(event: string, cb: Listener<any>): void {
    (this._listeners as any)[event]?.push(cb);
  }

  off(event: string, cb: Listener<any>): void {
    const arr = (this._listeners as any)[event];
    if (arr) {
      const idx = arr.indexOf(cb);
      if (idx !== -1) arr.splice(idx, 1);
    }
  }

  start(): void {
    if (this._pollTimer) return;
    this._checkAndConnect();
    this._pollTimer = setInterval(() => {
      // Only poll when not connected or when verifying connection
      if (this._connectionState !== 'connected') {
        this._checkAndConnect();
      }
    }, POLL_INTERVAL_MS);
  }

  stop(): void {
    this._closeSSE();
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    this._setConnectionState('disconnected');
  }

  /** Fetch the current GLB from Blender and return as ArrayBuffer. */
  async fetchGLB(): Promise<ArrayBuffer | null> {
    try {
      const url = `${BASE_URL}/export.glb?t=${Date.now()}`;
      console.log('[BlenderBridge] Fetching GLB from:', url);
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        console.warn(`[BlenderBridge] fetchGLB status: ${res.status}`);
        return null;
      }
      const buffer = await res.arrayBuffer();
      console.log(`[BlenderBridge] GLB received: ${buffer.byteLength} bytes`);
      return buffer;
    } catch (err) {
      console.error('[BlenderBridge] fetchGLB error:', err);
      return null;
    }
  }

  /** Trigger an immediate export in Blender (POST /snapshot). */
  async triggerSnapshot(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/snapshot`, {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async _checkAndConnect(): Promise<void> {
    if (this._isChecking) return;
    this._isChecking = true;

    try {
      const res = await fetch(`${BASE_URL}/status?t=${Date.now()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BlenderStatus = await res.json();
      this._status = data;

      if (this._connectionState !== 'connected') {
        this._setConnectionState('connected');
        this._openSSE();
      }
    } catch {
      if (this._connectionState === 'connected') {
        this._closeSSE();
        this._status = null;
        this._setConnectionState('disconnected');
      }
    } finally {
      this._isChecking = false;
    }
  }

  private _openSSE(): void {
    if (this._eventSource) return;
    try {
      const es = new EventSource(`${BASE_URL}/events`);
      this._eventSource = es;

      es.onopen = () => {
        console.log('[BlenderBridge] SSE stream connected');
      };

      es.addEventListener('scene_changed', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data) as BlenderStatus;
          this._status = { ...this._status!, ...payload, connected: true };
          console.log('[BlenderBridge] SSE scene_changed received:', payload);
          this._emit('sceneChanged', this._status);
        } catch (e) {
          console.error('[BlenderBridge] Malformed SSE event data:', e);
        }
      });

      es.onerror = () => {
        console.warn('[BlenderBridge] SSE connection closed/error, will reconnect');
        this._closeSSE();
        this._setConnectionState('disconnected');
        this._status = null;
      };
    } catch (e) {
      console.error('[BlenderBridge] Error opening EventSource:', e);
    }
  }

  private _closeSSE(): void {
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
    }
  }

  private _setConnectionState(state: BridgeConnectionState): void {
    if (this._connectionState === state) return;
    this._connectionState = state;
    this._emit('connectionChange', state);
  }

  private _emit<K extends keyof typeof this._listeners>(
    event: K,
    payload: Parameters<(typeof this._listeners)[K][number]>[0],
  ): void {
    for (const cb of (this._listeners as any)[event] ?? []) {
      try {
        cb(payload);
      } catch (e) {
        console.error('[BlenderBridge] listener error:', e);
      }
    }
  }
}

export const blenderBridge = new BlenderBridgeService();
