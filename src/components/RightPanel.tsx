import React, { useState } from 'react';
import {
  FolderTree, Search, ShieldCheck, ShieldAlert,
  Camera, Sun, Box, CircleDot, Route, Layers, Square
} from 'lucide-react';
import { SceneNodeInfo } from '../types/gltf';
import { Language, translations } from '../i18n/translations';

interface RightPanelProps {
  lang: Language;
  nodes: SceneNodeInfo[];
  protectedNodeIds: Set<string>;
  toggleNodeProtection: (nodeName: string) => void;
  selectedNodeName: string | null;
  setSelectedNodeName: (name: string | null) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  lang, nodes, protectedNodeIds, toggleNodeProtection,
  selectedNodeName, setSelectedNodeName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[lang];

  const nodeIcon = (type: SceneNodeInfo['type']) => {
    const s = 12;
    switch (type) {
      case 'mesh':   return <Box      size={s} color="#00e5ff" />;
      case 'spline': return <Route    size={s} color="#ec4899" />;
      case 'camera': return <Camera   size={s} color="#a855f7" />;
      case 'light':  return <Sun      size={s} color="var(--amber)" />;
      case 'empty':  return <CircleDot size={s} color="var(--emerald)" />;
      default:       return <Layers   size={s} color="var(--muted)" />;
    }
  };

  const renderNode = (node: SceneNodeInfo, level = 0): React.ReactNode => {
    const isProt   = protectedNodeIds.has(node.name);
    const isSel    = selectedNodeName === node.name;
    const isSpline = node.type === 'spline';
    const match    = node.name.toLowerCase().includes(searchTerm.toLowerCase());
    const childHit = node.children?.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (searchTerm && !match && !childHit) return null;

    const accentColor = isSpline ? '#f472b6' : 'var(--amber)';

    return (
      <div key={node.id}>
        <div
          className="skeuo-card"
          onClick={() => setSelectedNodeName(node.name)}
          style={{
            padding: '5px 8px',
            marginLeft: `${level * 12}px`,
            marginBottom: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: isSel
              ? '1px solid rgba(0,229,255,0.5)'
              : isProt
              ? `1px solid ${isSpline ? 'rgba(236,72,153,0.4)' : 'rgba(245,158,11,0.35)'}`
              : undefined,
            background: isSel
              ? 'linear-gradient(175deg,#14293e,#0b1825)'
              : isProt
              ? isSpline
                ? 'linear-gradient(175deg,#250c1c,#130609)'
                : 'linear-gradient(175deg,#221508,#120b03)'
              : undefined,
            boxShadow: isProt
              ? `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 6px ${isSpline ? 'rgba(236,72,153,0.2)' : 'rgba(245,158,11,0.15)'}, 0 1px 4px rgba(0,0,0,0.4)`
              : undefined,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {/* Left: icon + name + type badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', minWidth: 0 }}>
            {nodeIcon(node.type)}
            <span style={{
              fontSize: '10.5px',
              fontWeight: isSel || isProt ? 700 : 400,
              color: isSel ? 'var(--cyan)' : isProt ? accentColor : 'var(--txt)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {node.name}
            </span>
            <span style={{
              fontSize: '8px', fontWeight: 800, textTransform: 'uppercase',
              background: isSpline ? 'rgba(236,72,153,0.12)' : 'rgba(255,255,255,0.06)',
              color: isSpline ? '#f472b6' : 'var(--muted)',
              padding: '1px 4px', borderRadius: '3px', flexShrink: 0
            }}>
              {node.type}
            </span>
          </div>

          {/* Right: protection toggle */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
            onClick={e => { e.stopPropagation(); toggleNodeProtection(node.name); }}
            title={isProt ? t.tooltipProtected : t.tooltipUnprotected}
          >
            {isProt
              ? <ShieldCheck size={13} color={accentColor} />
              : <ShieldAlert size={13} color="rgba(255,255,255,0.2)" />
            }
          </div>
        </div>
        {node.children?.map(c => renderNode(c, level + 1))}
      </div>
    );
  };

  const flatAll = (list: SceneNodeInfo[], fn: (n: SceneNodeInfo) => void) => {
    list.forEach(n => { fn(n); if (n.children) flatAll(n.children, fn); });
  };

  const protectByType = (type: SceneNodeInfo['type']) => {
    flatAll(nodes, n => {
      if (n.type === type && !protectedNodeIds.has(n.name)) toggleNodeProtection(n.name);
    });
  };
  const clearAll = () => protectedNodeIds.forEach(n => toggleNodeProtection(n));

  return (
    <aside
      className="skeuo-panel"
      style={{
        width: '272px', height: 'calc(100vh - 46px)',
        display: 'flex', flexDirection: 'column',
        zIndex: 20, flexShrink: 0
      }}
    >
      {/* Header */}
      <div style={{
        padding: '7px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-panel)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <FolderTree size={14} color="var(--cyan)" />
          <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>
            {t.hierarchyTitle}
          </span>
        </div>
        <span className="warm-glow-badge">
          {protectedNodeIds.size} {t.protectedCount}
        </span>
      </div>

      {/* Search + quick actions */}
      <div style={{
        padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: '5px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={11} color="var(--muted)"
            style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" placeholder={t.searchPlaceholder} value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="skeuo-select"
            style={{ paddingLeft: '26px', height: '26px', fontSize: '10.5px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-convex-secondary"
            style={{ flex: 1, justifyContent: 'center', padding: '2px 4px', fontSize: '9.5px' }}
            onClick={() => protectByType('empty')}>
            <CircleDot size={10} color="var(--emerald)" /> {t.btnEmpties}
          </button>
          <button className="btn-convex-secondary"
            style={{ flex: 1, justifyContent: 'center', padding: '2px 4px', fontSize: '9.5px' }}
            onClick={() => protectByType('spline')}>
            <Route size={10} color="#ec4899" /> {t.btnSplines}
          </button>
          <button className="btn-convex-secondary"
            style={{ padding: '2px 6px', fontSize: '9.5px' }}
            onClick={clearAll}>
            <Square size={10} />
          </button>
        </div>
      </div>

      {/* Node tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {nodes.length === 0
          ? <div style={{ textAlign: 'center', padding: '20px', fontSize: '11px', color: 'var(--muted)' }}>{t.noNodes}</div>
          : nodes.map(n => renderNode(n))
        }
      </div>

      {/* Footer note */}
      <div style={{
        padding: '7px 10px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        fontSize: '9.5px', color: 'var(--muted)',
        display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        <ShieldCheck size={13} color="var(--amber)" style={{ flexShrink: 0 }} />
        <span style={{ lineHeight: 1.4 }}>{t.protectionNote}</span>
      </div>
    </aside>
  );
};
