export type NodeType = 'mesh' | 'camera' | 'light' | 'empty' | 'spline' | 'group';

export interface SceneNodeInfo {
  id: string;
  name: string;
  type: NodeType;
  protected: boolean; // Protect from destruction / optimization
  children?: SceneNodeInfo[];
  vertexCount?: number;
  faceCount?: number;
  textureIds?: string[];
}

export interface TextureCustomSettings {
  format: TextureFormat;
  resolution: number;
}

export interface TextureItem {
  id: string;
  name: string;
  width: number;
  height: number;
  originalFormat: string;
  sizeBytes: number;
  dataUrl: string; // Preview image
  associatedObjects: string[]; // Names of objects using this texture
  selectedForCompression: boolean;
  /** Per-texture override — when set, these values beat the global settings */
  customSettings?: TextureCustomSettings;
}

export interface MeshOptionsState {
  flatten: boolean;
  dedup: boolean;
  join: boolean;
  weld: boolean;
  reorder: boolean;
  instance: boolean;
}

export interface VertexQuantizationState {
  positions: 8 | 16 | 32;
  texcoords: 8 | 16 | 32;
  colors: 8 | 16 | 32;
  normals: 8 | 16 | 32;
}

export type DracoMethod = 'edgebreaker' | 'sequential';
export type DracoQuantizationScope = 'mesh' | 'scene';

export interface VertexCompressionState {
  type: 'draco' | 'none';
  method: DracoMethod;
  quantizationScope: DracoQuantizationScope;
}

export type TextureFormat = 'ETC1S' | 'UASTC' | 'WebP' | 'AVIF';

export interface TextureCompressionSettings {
  format: TextureFormat;
  resolution: number; // 32 to 4096
  mipmaps: boolean;
  quality: number; // 1 to 255
  effort: number; // 0 to 4
}

export type ViewMode = 'original' | 'compressed' | 'split';

export interface CompressionMetrics {
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalVertices: number;
  compressedVertices: number;
  originalTexturesSizeBytes: number;
  compressedTexturesSizeBytes: number;
  originalGpuVramBytes: number;
  compressedGpuVramBytes: number;
  originalTextureVramBytes: number;
  compressedTextureVramBytes: number;
  originalGeometryVramBytes: number;
  compressedGeometryVramBytes: number;
  originalDrawCalls: number;
  compressedDrawCalls: number;
  processingTimeMs: number;
}

export interface ModelFileStats {
  sizeBytes: number;
  vertexCount: number;
  faceCount: number;
  textureCount: number;
  meshCount: number;
}
