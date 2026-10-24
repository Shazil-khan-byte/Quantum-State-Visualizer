import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BlochCoordinates, QuantumStateVector } from '../../types/quantum';
import { Maximize2, RotateCcw, Compass, Eye } from 'lucide-react';

interface BlochSphereProps {
  blochCoords: BlochCoordinates;
  stateVector: QuantumStateVector;
  isAnimating?: boolean;
}

const SPHERE_RADIUS = 2.0;

// Helper to map Quantum (x, y, z) [where z is UP, x is forward/right, y is depth]
// to Three.js coordinates (X, Y, Z) preserving a right-handed coordinate system:
// Physics +Z (UP) maps to Three.js +Y
// Physics +X maps to Three.js +X
// Physics +Y maps to Three.js -Z
function quantumToThree(x: number, y: number, z: number, r: number = SPHERE_RADIUS): THREE.Vector3 {
  return new THREE.Vector3(x * r, z * r, -y * r);
}

// Procedural Sprite Label generator using Canvas 2D
function createLabelSprite(text: string, subtext?: string, color: string = '#e2e8f0', bgColor: string = 'rgba(15, 23, 42, 0.75)'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Rounded pill background
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  const radius = 24;
  const x = 16, y = 16, w = 224, h = 96;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px "Fira Code", monospace';
  ctx.fillText(text, 128, subtext ? 50 : 64);

  if (subtext) {
    ctx.font = '22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtext, 128, 86);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.9, 0.45, 1);
  return sprite;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({
  blochCoords,
  isAnimating = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const currentVecRef = useRef<THREE.Vector3>(quantumToThree(blochCoords.x, blochCoords.y, blochCoords.z));
  const targetVecRef = useRef<THREE.Vector3>(quantumToThree(blochCoords.x, blochCoords.y, blochCoords.z));

  const [showProjection, setShowProjection] = useState<boolean>(true);
  const [showAngles, setShowAngles] = useState<boolean>(true);
  const [viewAngle, setViewAngle] = useState<'iso' | 'top' | 'x' | 'y'>('iso');

  // Keep target vector updated when props change
  useEffect(() => {
    targetVecRef.current = quantumToThree(blochCoords.x, blochCoords.y, blochCoords.z);
  }, [blochCoords.x, blochCoords.y, blochCoords.z]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 3.2, 4.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 12;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-5, -4, -5);
    scene.add(dirLight2);

    // Root visualization group
    const blochGroup = new THREE.Group();
    scene.add(blochGroup);

    // 1. Semi-transparent glass sphere
    const sphereGeo = new THREE.SphereGeometry(SPHERE_RADIUS, 48, 48);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f2042,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.3,
      depthWrite: false,
    });
    const glassSphere = new THREE.Mesh(sphereGeo, sphereMat);
    blochGroup.add(glassSphere);

    // 2. Wireframe / Lat-Long Grid Rings
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.45,
    });
    const wireframeSphere = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(SPHERE_RADIUS, 18, 12)),
      wireframeMat
    );
    blochGroup.add(wireframeSphere);

    // 3. Equator Ring (XY Plane in Quantum = XZ Plane in Three.js)
    const equatorRadius = SPHERE_RADIUS;
    const equatorCurve = new THREE.EllipseCurve(
      0, 0,
      equatorRadius, equatorRadius,
      0, 2 * Math.PI,
      false, 0
    );
    const equatorPoints = equatorCurve.getPoints(100);
    const equatorGeo = new THREE.BufferGeometry().setFromPoints(
      equatorPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
    );
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });
    const equatorLine = new THREE.LineLoop(equatorGeo, equatorMat);
    blochGroup.add(equatorLine);

    // 4. Meridian Circles (XZ plane and YZ plane)
    const meridian1Geo = new THREE.BufferGeometry().setFromPoints(
      equatorPoints.map(p => new THREE.Vector3(p.x, p.y, 0))
    );
    const meridianMat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.6,
    });
    const meridian1 = new THREE.LineLoop(meridian1Geo, meridianMat);
    blochGroup.add(meridian1);

    const meridian2Geo = new THREE.BufferGeometry().setFromPoints(
      equatorPoints.map(p => new THREE.Vector3(0, p.y, p.x))
    );
    const meridian2 = new THREE.LineLoop(meridian2Geo, meridianMat);
    blochGroup.add(meridian2);

    // 5. Axes with Arrow Heads
    const axisLength = SPHERE_RADIUS * 1.35;
    const axisGroup = new THREE.Group();
    blochGroup.add(axisGroup);

    // Z-Axis (Vertical in Three.js, Cyan/Violet)
    const zAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLength, 0),
      new THREE.Vector3(0, axisLength, 0),
    ]);
    const zAxisMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, linewidth: 2 });
    axisGroup.add(new THREE.Line(zAxisGeo, zAxisMat));

    // X-Axis (Horizontal Three.js X, Rose/Red)
    const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLength, 0, 0),
      new THREE.Vector3(axisLength, 0, 0),
    ]);
    const xAxisMat = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 2 });
    axisGroup.add(new THREE.Line(xAxisGeo, xAxisMat));

    // Y-Axis (Depth Three.js -Z, Emerald/Green)
    const yAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axisLength),
      new THREE.Vector3(0, 0, axisLength),
    ]);
    const yAxisMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    axisGroup.add(new THREE.Line(yAxisGeo, yAxisMat));

    // Axis Arrow Cones
    const coneGeo = new THREE.ConeGeometry(0.08, 0.22, 16);

    const zConeMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const zCone = new THREE.Mesh(coneGeo, zConeMat);
    zCone.position.set(0, axisLength, 0);
    axisGroup.add(zCone);

    const xConeMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const xCone = new THREE.Mesh(coneGeo, xConeMat);
    xCone.position.set(axisLength, 0, 0);
    xCone.rotation.z = -Math.PI / 2;
    axisGroup.add(xCone);

    const yConeMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const yCone = new THREE.Mesh(coneGeo, yConeMat);
    yCone.position.set(0, 0, -axisLength);
    yCone.rotation.x = -Math.PI / 2;
    axisGroup.add(yCone);

    // 6. Labels on Poles and Axes
    const labelOffset = SPHERE_RADIUS * 1.25;

    // |0⟩ at North Pole (+Z)
    const label0 = createLabelSprite('|0⟩', '+Z', '#a78bfa', 'rgba(30, 27, 75, 0.85)');
    label0.position.set(0, labelOffset, 0);
    blochGroup.add(label0);

    // |1⟩ at South Pole (-Z)
    const label1 = createLabelSprite('|1⟩', '-Z', '#a78bfa', 'rgba(30, 27, 75, 0.85)');
    label1.position.set(0, -labelOffset, 0);
    blochGroup.add(label1);

    // |+⟩ at +X
    const labelPlus = createLabelSprite('|+⟩', '+X', '#fda4af', 'rgba(76, 5, 25, 0.85)');
    labelPlus.position.set(labelOffset, 0, 0);
    blochGroup.add(labelPlus);

    // |-⟩ at -X
    const labelMinus = createLabelSprite('|-⟩', '-X', '#fda4af', 'rgba(76, 5, 25, 0.85)');
    labelMinus.position.set(-labelOffset, 0, 0);
    blochGroup.add(labelMinus);

    // |i⟩ at +Y
    const labelI = createLabelSprite('|i⟩', '+Y', '#6ee7b7', 'rgba(6, 78, 59, 0.85)');
    labelI.position.set(0, 0, -labelOffset);
    blochGroup.add(labelI);

    // |-i⟩ at -Y
    const labelMinusI = createLabelSprite('|-i⟩', '-Y', '#6ee7b7', 'rgba(6, 78, 59, 0.85)');
    labelMinusI.position.set(0, 0, labelOffset);
    blochGroup.add(labelMinusI);

    // 7. State Vector Arrow (Composite Group)
    const stateVectorGroup = new THREE.Group();
    blochGroup.add(stateVectorGroup);

    // Arrow Shaft (Cylinder)
    const shaftGeo = new THREE.CylinderGeometry(0.038, 0.038, 1, 16);
    shaftGeo.translate(0, 0.5, 0); // Origin at base
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);

    // Arrow Tip (Cone)
    const tipGeo = new THREE.ConeGeometry(0.12, 0.35, 24);
    tipGeo.translate(0, -0.175, 0);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.set(0, SPHERE_RADIUS, 0);

    // Tip Halo (Glow point)
    const haloGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, SPHERE_RADIUS, 0);

    stateVectorGroup.add(shaftMesh);
    stateVectorGroup.add(tipMesh);
    stateVectorGroup.add(haloMesh);

    // 8. Projection Guides (Dashed Lines)
    const projLineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.1,
      gapSize: 0.05,
      transparent: true,
      opacity: 0.6,
    });

    const projGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const projLineVertical = new THREE.Line(projGeo, projLineMat);
    projLineVertical.computeLineDistances();
    blochGroup.add(projLineVertical);

    const projEquatorGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const projLineEquator = new THREE.Line(projEquatorGeo, projLineMat);
    projLineEquator.computeLineDistances();
    blochGroup.add(projLineEquator);

    // Equator Foot Marker
    const footGeo = new THREE.RingGeometry(0.04, 0.09, 24);
    footGeo.rotateX(Math.PI / 2);
    const footMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const footMesh = new THREE.Mesh(footGeo, footMat);
    blochGroup.add(footMesh);

    // 9. Coordinate Grid Disc on Equator Plane
    const diskGeo = new THREE.RingGeometry(0.05, SPHERE_RADIUS, 48, 8);
    diskGeo.rotateX(Math.PI / 2);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    blochGroup.add(diskMesh);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation & Render Loop
    let animationFrameId: number;

    const animate = () => {
      // Damping interpolation from current vector to target vector
      const cur = currentVecRef.current;
      const target = targetVecRef.current;

      cur.lerp(target, 0.14);

      // Update state vector rotation
      const len = cur.length();
      if (len > 0.001) {
        stateVectorGroup.visible = true;
        const dir = cur.clone().normalize();
        const quat = new THREE.Quaternion();
        quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        stateVectorGroup.setRotationFromQuaternion(quat);
        shaftMesh.scale.set(1, len, 1);
        tipMesh.position.set(0, len, 0);
        haloMesh.position.set(0, len, 0);

        // Update Projection lines:
        // From current state tip (cur.x, cur.y, cur.z) down to equator (cur.x, 0, cur.z)
        const posAttrVert = projLineVertical.geometry.attributes.position as THREE.BufferAttribute;
        posAttrVert.setXYZ(0, cur.x, cur.y, cur.z);
        posAttrVert.setXYZ(1, cur.x, 0, cur.z);
        posAttrVert.needsUpdate = true;
        projLineVertical.computeLineDistances();

        // From origin (0,0,0) to equator foot (cur.x, 0, cur.z)
        const posAttrEq = projLineEquator.geometry.attributes.position as THREE.BufferAttribute;
        posAttrEq.setXYZ(0, 0, 0, 0);
        posAttrEq.setXYZ(1, cur.x, 0, cur.z);
        posAttrEq.needsUpdate = true;
        projLineEquator.computeLineDistances();

        footMesh.position.set(cur.x, 0, cur.z);
      }

      controls.update();
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Camera presets
  const setCameraPreset = (preset: 'iso' | 'top' | 'x' | 'y') => {
    setViewAngle(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.target.set(0, 0, 0);
    if (preset === 'iso') {
      camera.position.set(3.8, 3.2, 4.2);
    } else if (preset === 'top') {
      camera.position.set(0.01, 6.0, 0.01); // North Pole |0⟩
    } else if (preset === 'x') {
      camera.position.set(6.0, 0.1, 0.01); // Looking down X
    } else if (preset === 'y') {
      camera.position.set(0.01, 0.1, -6.0); // Looking down Y
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-gradient-to-b from-[#090e1c] via-[#070b14] to-[#050810] rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col overflow-hidden group">
      {/* Top Header / Spec Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-2.5 py-1 rounded-md bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-400 backdrop-blur-sm pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_#06b6d4]"></span>
            <span>BLOCH SPHERE</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800">
            SU(2) / SO(3) Isomorphism
          </span>
        </div>

        {/* View Angles Quick Pills */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <button
            onClick={() => setCameraPreset('iso')}
            className={`px-2.5 py-1 text-xs rounded-md transition font-mono border ${
              viewAngle === 'iso'
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Isometric View"
          >
            3D Iso
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className={`px-2 py-1 text-xs rounded-md transition font-mono border ${
              viewAngle === 'top'
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Top Pole |0⟩ (+Z)"
          >
            Top (+Z)
          </button>
          <button
            onClick={() => setCameraPreset('x')}
            className={`px-2 py-1 text-xs rounded-md transition font-mono border ${
              viewAngle === 'x'
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Equator (+X)"
          >
            Side (+X)
          </button>
          <button
            onClick={() => setCameraPreset('y')}
            className={`px-2 py-1 text-xs rounded-md transition font-mono border ${
              viewAngle === 'y'
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Equator (+Y)"
          >
            Side (+Y)
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Floating Telemetry Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Realtime Derived Bloch Coordinates */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800/90 rounded-lg px-3 py-1.5 backdrop-blur-sm pointer-events-auto shadow-lg text-xs font-mono">
          <span className="text-slate-400">Coords:</span>
          <span className="text-rose-400 font-semibold">x = {blochCoords.x.toFixed(3)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">y = {blochCoords.y.toFixed(3)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-violet-400 font-semibold">z = {blochCoords.z.toFixed(3)}</span>
        </div>

        {/* Spherical Angles: Polar θ and Azimuthal φ */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800/90 rounded-lg px-3 py-1.5 backdrop-blur-sm pointer-events-auto shadow-lg text-xs font-mono">
          <span className="text-slate-400">Angles:</span>
          <span className="text-cyan-300">
            θ = {(blochCoords.theta * (180 / Math.PI)).toFixed(1)}°
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-fuchsia-300">
            φ = {(blochCoords.phi * (180 / Math.PI)).toFixed(1)}°
          </span>
        </div>

        {/* Interaction Hint */}
        <div className="hidden md:flex items-center text-[11px] text-slate-500 font-mono space-x-1">
          <Compass className="w-3.5 h-3.5" />
          <span>Click & Drag to rotate • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
