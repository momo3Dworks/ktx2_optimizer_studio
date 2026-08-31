import { WebIO, Document, Node } from '@gltf-transform/core';
import {
  ALL_EXTENSIONS
} from '@gltf-transform/extensions';
import {
  flatten,
  dedup,
  join,
  weld,
  instance,
  quantize,
  draco,
  prune
} from '@gltf-transform/functions';
import draco3d from 'draco3d';
import {
  MeshOptionsState,
  VertexQuantizationState,
  VertexCompressionState,
  TextureCompressionSettings,
  TextureItem,
  SceneNodeInfo,
  CompressionMetrics
} from '../types/gltf';

// Shared Draco Module Cache
let dracoModulesCache: { encoder: unknown; decoder: unknown } | null = null;

async function getDracoModules() {
  if (dracoModulesCache) return dracoModulesCache;

  let encoder: unknown;
  let decoder: unknown;

  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, any>) : {};

  try {
    if (typeof win.DracoEncoderModule === 'function' && typeof win.DracoDecoderModule === 'function') {
      [encoder, decoder] = await Promise.all([
        win.DracoEncoderModule({
          locateFile: (file: string) => `https://www.gstatic.com/draco/versioned/decoders/1.5.6/${file}`
        }),
        win.DracoDecoderModule({
          locateFile: (file: string) => `https://www.gstatic.com/draco/versioned/decoders/1.5.6/${file}`
        })
      ]);
    } else {
      [encoder, decoder] = await Promise.all([
        draco3d.createEncoderModule({
          locateFile: (file: string) => `/${file}`
        }),
        draco3d.createDecoderModule({
          locateFile: (file: string) => `/${file}`
        })
      ]);
    }
  } catch (err) {
    console.warn('Draco CDN module init note, using local public WASM binaries:', err);
    [encoder, decoder] = await Promise.all([
      draco3d.createEncoderModule({
        locateFile: (file: string) => `/${file}`
      }),
      draco3d.createDecoderModule({
        locateFile: (file: string) => `/${file}`
      })
    ]);
  }

  dracoModulesCache = { encoder, decoder };
  return dracoModulesCache;
}

// Parse Scene Node Tree & Textures from GLB ArrayBuffer
export async function parseGLBStructure(buffer: ArrayBuffer): Promise<{
  nodes: SceneNodeInfo[];
  textures: TextureItem[];
  vertexCount: number;
  faceCount: number;
  meshCount: number;
}> {
  const { encoder, decoder } = await getDracoModules();
  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.encoder': encoder,
      'draco3d.decoder': decoder
    });

  const doc = await io.readBinary(new Uint8Array(buffer));
  const root = doc.getRoot();

  let totalVertices = 0;
  let totalFaces = 0;

  // Extract Scene Hierarchy Nodes (Distinguishing Mesh, Spline, Empty, Camera, Light)
  const buildNodeTree = (node: Node): SceneNodeInfo => {
    const mesh = node.getMesh();
    const nodeName = (node.getName() || '').toLowerCase();
    const isSplineByName =
      nodeName.includes('spline') ||
      nodeName.includes('curve') ||
      nodeName.includes('path') ||
      nodeName.includes('track') ||
      nodeName.includes('trajectory');

    // Helper to determine node type based on mesh presence and naming heuristics
    const detectNodeType = (hasMesh: boolean, isSplineByName: boolean, isLinePrimitive: boolean): SceneNodeInfo['type'] => {
      if (hasMesh) {
        return isSplineByName || isLinePrimitive ? 'spline' : 'mesh';
      }
      if (isSplineByName) {
        return 'spline';
      }
      return 'empty';
    };

    let type: SceneNodeInfo['type'] = 'empty';
    let vCount = 0;
    let fCount = 0;
    let isLinePrimitive = false;

    if (mesh) {
      // Check if primitives are lines (Spline/Path) vs triangles (Mesh)
      mesh.listPrimitives().forEach((prim) => {
        const mode = prim.getMode();
        // Modes 1 (LINES), 2 (LINE_LOOP), 3 (LINE_STRIP)
        if (mode === 1 || mode === 2 || mode === 3) {
          isLinePrimitive = true;
        }

        const posAttr = prim.getAttribute('POSITION');
        if (posAttr) {
          vCount += posAttr.getCount();
          const indices = prim.getIndices();
          if (indices) {
            fCount += indices.getCount() / 3;
          } else {
            fCount += posAttr.getCount() / 3;
          }
        }
      });
      type = detectNodeType(true, isSplineByName, isLinePrimitive);
      totalVertices += vCount;
      totalFaces += fCount;
    } else if (node.getCamera()) {
      type = 'camera';
    } else if (node.getExtras()?.isLight || nodeName.includes('light')) {
      type = 'light';
    } else {
      // Non‑mesh node: could be spline (named) or empty
      type = detectNodeType(false, isSplineByName, false);
    }

    const childrenNodes = node.listChildren().map(buildNodeTree);

    return {
      id: node.getName() || `Node_${Math.random().toString(36).substring(2, 7)}`,
      name: node.getName() || `Unnamed_${type}`,
      type,
      protected: type === 'camera' || type === 'empty' || type === 'spline' || type === 'light',
      children: childrenNodes.length > 0 ? childrenNodes : undefined,
      vertexCount: vCount,
      faceCount: Math.round(fCount)
    };
  };

  const sceneNodes: SceneNodeInfo[] = root.listScenes().flatMap((scene) =>
    scene.listChildren().map(buildNodeTree)
  );

  // Extract Embedded Textures
  const textureItems: TextureItem[] = [];
  const docTextures = root.listTextures();

  for (let i = 0; i < docTextures.length; i++) {
    const tex = docTextures[i];
    const imageBytes = tex.getImage();
    const mimeType = tex.getMimeType() || 'image/png';
    const name = tex.getName() || `Texture_${i + 1}`;

    let dataUrl = '';
    let width = 512;
    let height = 512;

    if (imageBytes) {
      const blob = new Blob([new Uint8Array(imageBytes)], { type: mimeType });
      dataUrl = URL.createObjectURL(blob);

      try {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
        width = img.naturalWidth || img.width || 512;
        height = img.naturalHeight || img.height || 512;
      } catch (e) {
        // Fallback
      }
    }

    // Find associated mesh objects
    const associatedObjects: string[] = [];
    root.listMaterials().forEach((mat) => {
      if (
        mat.getBaseColorTexture() === tex ||
        mat.getNormalTexture() === tex ||
        mat.getMetallicRoughnessTexture() === tex ||
        mat.getEmissiveTexture() === tex ||
        mat.getOcclusionTexture() === tex
      ) {
        root.listNodes().forEach((node) => {
          if (node.getMesh()?.listPrimitives().some((p) => p.getMaterial() === mat)) {
            const nName = node.getName() || 'Mesh';
            if (!associatedObjects.includes(nName)) {
              associatedObjects.push(nName);
            }
          }
        });
      }
    });

    textureItems.push({
      id: `tex_${i}`,
      name,
      width,
      height,
      originalFormat: mimeType.replace('image/', '').toUpperCase(),
      sizeBytes: imageBytes ? imageBytes.byteLength : 0,
      dataUrl,
      associatedObjects,
      selectedForCompression: true
    });
  }

  return {
    nodes: sceneNodes,
    textures: textureItems,
    vertexCount: totalVertices,
    faceCount: Math.round(totalFaces),
    meshCount: root.listMeshes().length
  };
}

// Process and Compress GLB using gltf-transform + Canvas WebP/Texture compression
export async function processGLB(
  buffer: ArrayBuffer,
  protectedNodeIds: Set<string>,
  meshOpts: MeshOptionsState,
  vertexQuantization: VertexQuantizationState,
  vertexCompression: VertexCompressionState,
  texturesToCompress: TextureItem[],
  textureSettings: TextureCompressionSettings
): Promise<{ compressedBuffer: ArrayBuffer; metrics: CompressionMetrics }> {
  const startTime = performance.now();
  const { encoder, decoder } = await getDracoModules();
  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.encoder': encoder,
      'draco3d.decoder': decoder
    });

  const doc = await io.readBinary(new Uint8Array(buffer));
  const root = doc.getRoot();

  // Calculate Original Geometry VRAM & Draw Calls
  let originalVertices = 0;
  let originalDrawCalls = 0;
  root.listScenes().forEach((scene) => {
    scene.traverse((node) => {
      const mesh = node.getMesh();
      if (mesh) {
        mesh.listPrimitives().forEach((p) => {
          originalDrawCalls++;
          const pos = p.getAttribute('POSITION');
          if (pos) originalVertices += pos.getCount();
        });
      }
    });
  });

  // Calculate Original Texture VRAM (RGBA8 decompressed in GPU memory + mipmaps)
  let originalTextureVramBytes = 0;
  const docTextures = root.listTextures();
  let originalTexturesSizeBytes = 0;
  let compressedTexturesSizeBytes = 0;
  let compressedTextureVramBytes = 0;

  // 1. Tag Protected Nodes
  root.listNodes().forEach((node) => {
    const nodeName = node.getName();
    if (nodeName && protectedNodeIds.has(nodeName)) {
      node.setExtras({ ...node.getExtras(), isProtected: true });
    }
  });

  // 2. Texture Processing & Resizing (Crushes texture size to target resolution/format)
  for (let i = 0; i < docTextures.length; i++) {
    const docTex = docTextures[i];
    const imgBytes = docTex.getImage();
    if (!imgBytes) continue;

    const originalSize = imgBytes.byteLength;
    originalTexturesSizeBytes += originalSize;

    // Original texture VRAM estimation
    const origW = texturesToCompress[i]?.width || 1024;
    const origH = texturesToCompress[i]?.height || 1024;
    originalTextureVramBytes += Math.round(origW * origH * 4 * 1.3333);

    // Match accurately by index or ID
    const matchingItem = texturesToCompress[i] || texturesToCompress.find(
      (t) => t.id === `tex_${i}` || (docTex.getName() && t.name === docTex.getName())
    );

    const isSelected = matchingItem ? matchingItem.selectedForCompression !== false : true;

    if (isSelected) {
      const effectiveRes = matchingItem?.customSettings?.resolution ?? textureSettings.resolution;
      const effectiveFmt = matchingItem?.customSettings?.format ?? textureSettings.format;
      const effectiveQuality = textureSettings.quality;

      try {
        const { data: resizedBytes, mimeType: outMime, width: newW, height: newH } = await compressImageCanvas(
          imgBytes,
          docTex.getMimeType() || 'image/png',
          effectiveRes,
          effectiveFmt,
          effectiveQuality
        );
        docTex.setImage(resizedBytes);
        docTex.setMimeType(outMime);
        compressedTexturesSizeBytes += resizedBytes.byteLength;
        compressedTextureVramBytes += Math.round(newW * newH * 4 * (textureSettings.mipmaps ? 1.3333 : 1.0));
      } catch (err) {
        console.warn(`Error compressing texture index ${i}:`, err);
        compressedTexturesSizeBytes += originalSize;
        compressedTextureVramBytes += Math.round(origW * origH * 4 * 1.3333);
      }
    } else {
      compressedTexturesSizeBytes += originalSize;
      compressedTextureVramBytes += Math.round(origW * origH * 4 * 1.3333);
    }
  }

  // 3. Mesh & Vertex Transformations Pipeline
  const transformSteps: Array<(doc: Document) => Promise<void> | void> = [];

  if (meshOpts.dedup) {
    transformSteps.push(dedup({}));
  }

  if (meshOpts.weld) {
    transformSteps.push(weld({}));
  }

  if (meshOpts.flatten) {
    transformSteps.push((doc) => {
      flatten({ cleanup: false })(doc);
    });
  }

  if (meshOpts.join) {
    transformSteps.push(join({}));
  }

  if (meshOpts.instance) {
    transformSteps.push(instance({}));
  }

  // 4. Vertex Quantization
  transformSteps.push(
    quantize({
      quantizePosition: vertexQuantization.positions,
      quantizeTexcoord: vertexQuantization.texcoords,
      quantizeColor: vertexQuantization.colors,
      quantizeNormal: vertexQuantization.normals
    })
  );

  // 5. Vertex Draco Compression
  if (vertexCompression.type === 'draco') {
    transformSteps.push(
      draco({
        method: vertexCompression.method,
        quantizePosition: vertexQuantization.positions,
        quantizeNormal: vertexQuantization.normals,
        quantizeTexcoord: vertexQuantization.texcoords,
        quantizeColor: vertexQuantization.colors
      })
    );
  }

  // 6. Prune unused elements
  transformSteps.push(prune({}));

  // Execute Transformations
  for (const step of transformSteps) {
    try {
      await step(doc);
    } catch (err) {
      console.warn('Transform step note:', err);
    }
  }

  // Output Compressed ArrayBuffer (exact slice)
  const compressedBytes = await io.writeBinary(doc);
  const compressedBuffer = compressedBytes.buffer.slice(
    compressedBytes.byteOffset,
    compressedBytes.byteOffset + compressedBytes.byteLength
  );

  // Calculate Compressed Vertex Count & Draw Calls
  let newVertexCount = 0;
  let compressedDrawCalls = 0;
  doc.getRoot().listScenes().forEach((scene) => {
    scene.traverse((node) => {
      const mesh = node.getMesh();
      if (mesh) {
        mesh.listPrimitives().forEach((p) => {
          compressedDrawCalls++;
          const pos = p.getAttribute('POSITION');
          if (pos) newVertexCount += pos.getCount();
        });
      }
    });
  });

  // Calculate GPU Geometry VRAM
  const originalGeometryVramBytes = Math.round(originalVertices * 44);
  const compressedGeometryVramBytes = Math.round(newVertexCount * 18);

  const originalGpuVramBytes = originalTextureVramBytes + originalGeometryVramBytes;
  const compressedGpuVramBytes = compressedTextureVramBytes + compressedGeometryVramBytes;

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    compressedBuffer,
    metrics: {
      originalSizeBytes: buffer.byteLength,
      compressedSizeBytes: compressedBuffer.byteLength,
      originalVertices,
      compressedVertices: newVertexCount,
      originalTexturesSizeBytes,
      compressedTexturesSizeBytes,
      originalGpuVramBytes,
      compressedGpuVramBytes,
      originalTextureVramBytes,
      compressedTextureVramBytes,
      originalGeometryVramBytes,
      compressedGeometryVramBytes,
      originalDrawCalls,
      compressedDrawCalls,
      processingTimeMs
    }
  };
}

// Client-Side High Performance Image Resizer & Quality Transcoder
async function compressImageCanvas(
  bytes: Uint8Array,
  mimeType: string,
  targetRes: number,
  targetFormat: string,
  quality: number
): Promise<{ data: Uint8Array; mimeType: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');

      const origW = img.naturalWidth || img.width || 512;
      const origH = img.naturalHeight || img.height || 512;

      // Scale proportionally to fit within targetRes
      let newW = origW;
      let newH = origH;

      if (origW > targetRes || origH > targetRes) {
        if (origW >= origH) {
          newW = targetRes;
          newH = Math.max(1, Math.round((origH * targetRes) / origW));
        } else {
          newH = targetRes;
          newW = Math.max(1, Math.round((origW * targetRes) / origH));
        }
      }

      canvas.width = Math.max(1, newW);
      canvas.height = Math.max(1, newH);
      const ctx = canvas.getContext('2d', { alpha: true });

      if (!ctx) {
        resolve({ data: bytes, mimeType, width: origW, height: origH });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let outMime = 'image/webp';
      if (targetFormat === 'AVIF') {
        outMime = 'image/avif';
      } else if (targetFormat === 'WebP' || targetFormat === 'ETC1S' || targetFormat === 'UASTC') {
        outMime = 'image/webp';
      } else if (targetFormat === 'PNG') {
        outMime = 'image/png';
      } else {
        outMime = 'image/jpeg';
      }

      // Quality normalized 0.05 - 1.0
      const qualityNormalized = Math.max(0.05, Math.min(1.0, quality / 255));

      canvas.toBlob(
        async (resBlob) => {
          if (resBlob) {
            const arrBuffer = await resBlob.arrayBuffer();
            resolve({
              data: new Uint8Array(arrBuffer),
              mimeType: resBlob.type || outMime,
              width: canvas.width,
              height: canvas.height
            });
          } else {
            resolve({ data: bytes, mimeType, width: canvas.width, height: canvas.height });
          }
        },
        outMime,
        qualityNormalized
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ data: bytes, mimeType, width: targetRes, height: targetRes });
    };

    img.src = url;
  });
}
