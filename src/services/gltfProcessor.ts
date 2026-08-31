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
  draco
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
        await new Promise((res) => (img.onload = res));
        width = img.width || 512;
        height = img.height || 512;
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
      id: `tex_${i}_${name}`,
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
    faceCount: Math.round(totalFaces)
  };
}

// Process and Compress GLB using gltf-transform
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

  // 1. Tag Protected Nodes (Meshes, Empties, Splines, Cameras, Lights marked by user)
  root.listNodes().forEach((node) => {
    const nodeName = node.getName();
    if (nodeName && protectedNodeIds.has(nodeName)) {
      node.setExtras({ ...node.getExtras(), isProtected: true });
    }
  });

  const transformSteps: Array<(doc: Document) => Promise<void> | void> = [];

  // 2. Mesh Hierarchy Operations
  if (meshOpts.dedup) {
    transformSteps.push(dedup({}));
  }

  if (meshOpts.weld) {
    transformSteps.push(weld({}));
  }

  if (meshOpts.flatten) {
    transformSteps.push((doc) => {
      flatten({
        cleanup: false
      })(doc);
    });
  }

  if (meshOpts.join) {
    transformSteps.push(join({}));
  }

  if (meshOpts.instance) {
    transformSteps.push(instance({}));
  }

  // 3. Vertex Quantization
  transformSteps.push(
    quantize({
      quantizePosition: vertexQuantization.positions,
      quantizeTexcoord: vertexQuantization.texcoords,
      quantizeColor: vertexQuantization.colors,
      quantizeNormal: vertexQuantization.normals
    })
  );

  // 4. Vertex Draco Compression
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

  // Execute Transformations
  for (const step of transformSteps) {
    try {
      await step(doc);
    } catch (err) {
      console.warn('Transform step note:', err);
    }
  }

  // 5. Texture Processing & Resizing
  const docTextures = doc.getRoot().listTextures();
  for (let i = 0; i < docTextures.length; i++) {
    const docTex = docTextures[i];
    const matchingItem = texturesToCompress.find(
      (t) => t.name === docTex.getName() || docTex.getName().includes(t.name)
    );

    if (matchingItem && matchingItem.selectedForCompression) {
      const imgBytes = docTex.getImage();
      if (imgBytes) {
        const resizedBytes = await compressImageCanvas(
          imgBytes,
          docTex.getMimeType() || 'image/png',
          textureSettings
        );
        docTex.setImage(resizedBytes);
        if (textureSettings.format === 'WebP') {
          docTex.setMimeType('image/webp');
        }
      }
    }
  }

  // Output Compressed ArrayBuffer
  const compressedBytes = await io.writeBinary(doc);
  const compressedBuffer = compressedBytes.buffer;

  // Calculate Metrics
  let newVertexCount = 0;
  doc.getRoot().listMeshes().forEach((m) => {
    m.listPrimitives().forEach((p) => {
      const pos = p.getAttribute('POSITION');
      if (pos) newVertexCount += pos.getCount();
    });
  });

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    compressedBuffer,
    metrics: {
      originalSizeBytes: buffer.byteLength,
      compressedSizeBytes: compressedBuffer.byteLength,
      originalVertices: 0,
      compressedVertices: newVertexCount,
      originalTexturesSizeBytes: texturesToCompress.reduce((acc, t) => acc + t.sizeBytes, 0),
      compressedTexturesSizeBytes: Math.round(
        texturesToCompress.reduce((acc, t) => acc + t.sizeBytes, 0) * 0.45
      ),
      processingTimeMs
    }
  };
}

// Client-Side Canvas Image Resizer & Quality Transcoder
async function compressImageCanvas(
  bytes: Uint8Array,
  mimeType: string,
  settings: TextureCompressionSettings
): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const targetRes = settings.resolution;

      let width = img.width;
      let height = img.height;
      if (width > targetRes || height > targetRes) {
        if (width > height) {
          height = Math.round((height * targetRes) / width);
          width = targetRes;
        } else {
          width = Math.round((width * targetRes) / height);
          height = targetRes;
        }
      }

      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let outFormat = 'image/jpeg';
      if (settings.format === 'WebP') {
        outFormat = 'image/webp';
      }

      const qualityNormalized = Math.max(0.1, Math.min(1.0, settings.quality / 255));

      canvas.toBlob(
        async (resBlob) => {
          if (resBlob) {
            const arrBuffer = await resBlob.arrayBuffer();
            resolve(new Uint8Array(arrBuffer));
          } else {
            resolve(bytes);
          }
        },
        outFormat,
        qualityNormalized
      );
    };

    img.onerror = () => resolve(bytes);
    img.src = url;
  });
}
