import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export async function generateSampleGLB(): Promise<ArrayBuffer> {
  const scene = new THREE.Scene();
  scene.name = 'Sample_Vehicle_Scene';

  // 1. Root group
  const carGroup = new THREE.Group();
  carGroup.name = 'Vehicle_Root';
  scene.add(carGroup);

  // 2. Empty nodes (Null objects for hooks / mounts)
  const camMount = new THREE.Object3D();
  camMount.name = 'Empty_Front_Camera_Hook';
  camMount.position.set(0, 1.2, 2.5);
  carGroup.add(camMount);

  const rearSensorMount = new THREE.Object3D();
  rearSensorMount.name = 'Empty_Rear_Sensor_Attachment';
  rearSensorMount.position.set(0, 0.5, -2.2);
  carGroup.add(rearSensorMount);

  // 3. Spline / Path nodes (Curves, Motion Guides, Trajectories)
  const curvePoints = [
    new THREE.Vector3(-2, 0, 3),
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(2, 0, -3)
  ];
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const points = curve.getPoints(30);
  const splineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const splineMat = new THREE.LineBasicMaterial({ color: 0xec4899 });
  const splineLine = new THREE.Line(splineGeo, splineMat);
  splineLine.name = 'Spline_Vehicle_Trajectory_Track';
  splineLine.userData = { isSpline: true };
  carGroup.add(splineLine);

  const camPathPoints = [
    new THREE.Vector3(3, 2, 3),
    new THREE.Vector3(0, 3, 0),
    new THREE.Vector3(-3, 2, -3)
  ];
  const camCurve = new THREE.CatmullRomCurve3(camPathPoints);
  const camPoints = camCurve.getPoints(20);
  const camSplineGeo = new THREE.BufferGeometry().setFromPoints(camPoints);
  const camSplineMat = new THREE.LineBasicMaterial({ color: 0xf43f5e });
  const camSplineLine = new THREE.Line(camSplineGeo, camSplineMat);
  camSplineLine.name = 'Spline_Camera_Orbit_Path';
  camSplineLine.userData = { isSpline: true };
  carGroup.add(camSplineLine);

  // 4. Materials with generated procedural canvas textures
  const createGradientTexture = (color1: string, color2: string, label: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 256, 260);

    const texture = new THREE.CanvasTexture(canvas);
    texture.name = `Tex_${label}`;
    return texture;
  };

  const bodyTex = createGradientTexture('#1a365d', '#00f2fe', 'Body_Paint');
  const wheelTex = createGradientTexture('#111827', '#374151', 'Alloy_Wheel');
  const glassTex = createGradientTexture('#0f172a', '#3b82f6', 'Glass_Tint');

  const bodyMat = new THREE.MeshStandardMaterial({
    map: bodyTex,
    roughness: 0.2,
    metalness: 0.8,
    name: 'Mat_Body'
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    map: wheelTex,
    roughness: 0.4,
    metalness: 0.9,
    name: 'Mat_Wheels'
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    map: glassTex,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.8,
    name: 'Mat_Glass'
  });

  // 5. Car Body Mesh
  const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.6);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.name = 'Mesh_CarBody';
  bodyMesh.position.set(0, 0.6, 0);
  carGroup.add(bodyMesh);

  // 6. Cabin Mesh
  const cabinGeo = new THREE.BoxGeometry(1.4, 0.6, 1.8);
  const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
  cabinMesh.name = 'Mesh_CabinGlass';
  cabinMesh.position.set(0, 1.2, -0.2);
  carGroup.add(cabinMesh);

  // 7. Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    { name: 'Wheel_Front_Left', pos: [-1.0, 0.4, 1.1] },
    { name: 'Wheel_Front_Right', pos: [1.0, 0.4, 1.1] },
    { name: 'Wheel_Rear_Left', pos: [-1.0, 0.4, -1.1] },
    { name: 'Wheel_Rear_Right', pos: [1.0, 0.4, -1.1] }
  ];

  wheelPositions.forEach(({ name, pos }) => {
    const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
    wMesh.name = name;
    wMesh.position.set(pos[0], pos[1], pos[2]);
    carGroup.add(wMesh);
  });

  // 8. Lights
  const headlightLeft = new THREE.SpotLight(0x00f2fe, 5);
  headlightLeft.name = 'Light_Headlight_Left';
  headlightLeft.position.set(-0.6, 0.7, 1.8);
  carGroup.add(headlightLeft);

  const headlightRight = new THREE.SpotLight(0x00f2fe, 5);
  headlightRight.name = 'Light_Headlight_Right';
  headlightRight.position.set(0.6, 0.7, 1.8);
  carGroup.add(headlightRight);

  // 9. Camera
  const driverCam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  driverCam.name = 'Camera_DriverView';
  driverCam.position.set(-0.4, 1.1, 0);
  carGroup.add(driverCam);

  // Export to GLB ArrayBuffer
  const exporter = new GLTFExporter();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      scene,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          resolve(gltf);
        } else {
          const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
          blob.arrayBuffer().then(resolve);
        }
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}
