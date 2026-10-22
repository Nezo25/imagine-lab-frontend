import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ModelAnalysis {
  dimensions: { x: number; y: number; z: number };
  volumeCm3: number;
  weightGrams: number;
  surfaceAreaCm2: number;
}

interface Props {
  file: File | null;
  materialColor?: string;
  wireframe?: boolean;
  materialDensity?: number; // g/cm³ (default PLA: 1.24)
  infillPercent?: number; // e.g. 30
  onAnalysisChange?: (analysis: ModelAnalysis) => void;
  className?: string;
}

export function ModelViewer3D({
  file,
  materialColor = '#5E488C',
  wireframe = false,
  materialDensity = 1.24,
  infillPercent = 30,
  onAnalysisChange,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [renderMode, setRenderMode] = useState<'solid' | 'wireframe' | 'normal'>('solid');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const currentGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Setup Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(100, 100, 140);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Iluminação Profissional de Estúdio ImagineLab (Roxo & Ciano Glow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x4CA8B8, 1.4); // Ciano Rim Light
    dirLight1.position.set(150, 200, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7E63B8, 1.2); // Roxo Fill Light
    dirLight2.position.set(-150, 100, -100);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 500);
    pointLight.position.set(0, 150, 100);
    scene.add(pointLight);

    // Base Grid Holográfica (Tech Plate)
    const grid = new THREE.GridHelper(160, 20, 0x4CA8B8, 0x222D42);
    grid.position.y = -0.5;
    scene.add(grid);

    // Fallback inicial: Carretel com lâmpada 3D da ImagineLab
    const defaultGeom = createDefaultShowcaseGeometry();
    currentGeometryRef.current = defaultGeom;
    const defaultMesh = createMesh(defaultGeom, materialColor, renderMode);
    meshRef.current = defaultMesh;
    scene.add(defaultMesh);
    fitCameraToObject(camera, defaultMesh);
    analyzeGeometry(defaultGeom, materialDensity, infillPercent);

    // Orbit Controls manual suave
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !meshRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      meshRef.current.rotation.y += deltaX * 0.01;
      meshRef.current.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      cameraRef.current.position.multiplyScalar(zoomFactor);
    };

    // Touch controls
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging && meshRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        meshRef.current.rotation.y += deltaX * 0.01;
        meshRef.current.rotation.x += deltaY * 0.01;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && cameraRef.current) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = touchStartDist / dist;
        cameraRef.current.position.multiplyScalar(factor > 1 ? 1.03 : 0.97);
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate && meshRef.current && !isDragging) {
        meshRef.current.rotation.y += 0.007;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Mesh on Color or Render Mode Change
  useEffect(() => {
    if (!meshRef.current || !sceneRef.current || !currentGeometryRef.current) return;
    const geom = currentGeometryRef.current;
    sceneRef.current.remove(meshRef.current);
    const newMesh = createMesh(geom, materialColor, renderMode);
    meshRef.current = newMesh;
    sceneRef.current.add(newMesh);
  }, [materialColor, renderMode]);

  // Recalculate Analysis when density or infill changes
  useEffect(() => {
    if (currentGeometryRef.current) {
      analyzeGeometry(currentGeometryRef.current, materialDensity, infillPercent);
    }
  }, [materialDensity, infillPercent]);

  // Handle Uploaded File (.stl, .obj, .3mf)
  useEffect(() => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    const ext = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) throw new Error('Arquivo vazio ou ilegível');

        let geometry: THREE.BufferGeometry | null = null;

        if (ext === 'stl') {
          geometry = parseSTL(buffer as ArrayBuffer);
        } else if (ext === 'obj') {
          const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer as ArrayBuffer);
          geometry = parseOBJ(text);
        } else {
          // Fallback para outros tipos: tenta carregar STL
          geometry = parseSTL(buffer as ArrayBuffer);
        }

        if (!geometry || geometry.getAttribute('position').count === 0) {
          throw new Error('Não foi possível extrair a geometria 3D do arquivo.');
        }

        geometry.computeVertexNormals();
        geometry.center();

        currentGeometryRef.current = geometry;

        if (meshRef.current && sceneRef.current) {
          sceneRef.current.remove(meshRef.current);
          const newMesh = createMesh(geometry, materialColor, renderMode);
          meshRef.current = newMesh;
          sceneRef.current.add(newMesh);

          if (cameraRef.current) {
            fitCameraToObject(cameraRef.current, newMesh);
          }
        }

        analyzeGeometry(geometry, materialDensity, infillPercent);
      } catch (err: any) {
        console.error('Erro ao processar modelo 3D:', err);
        setError(err.message || 'Erro ao processar modelo 3D.');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Erro ao ler arquivo.');
      setLoading(false);
    };

    if (ext === 'obj') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  function analyzeGeometry(geometry: THREE.BufferGeometry, density: number, infill: number) {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox || new THREE.Box3();
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Dimensões em mm
    const dimensions = {
      x: Math.round(size.x * 10) / 10,
      y: Math.round(size.y * 10) / 10,
      z: Math.round(size.z * 10) / 10,
    };

    // Cálculo exato de Volume (Soma com sinal dos tetraedros dos triângulos)
    const pos = geometry.getAttribute('position');
    let volumeSum = 0;
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();

    for (let i = 0; i < pos.count; i += 3) {
      p1.fromBufferAttribute(pos, i);
      p2.fromBufferAttribute(pos, i + 1);
      p3.fromBufferAttribute(pos, i + 2);
      // Volume com sinal: v1 . (v2 x v3) / 6
      volumeSum += p1.dot(p2.clone().cross(p3)) / 6.0;
    }

    // Volume em cm³ (assumindo que o arquivo está em mm: 1 mm³ = 0.001 cm³)
    let volumeCm3 = Math.abs(volumeSum) / 1000.0;
    if (volumeCm3 < 0.1) volumeCm3 = (dimensions.x * dimensions.y * dimensions.z) / 1000 * 0.45;

    // Cálculo de Peso em gramas:
    // Volume Real = Volume total * (Casca exterior ~25% + Infill% * 75%)
    const infillFactor = 0.25 + (infill / 100.0) * 0.75;
    const effectiveVolume = volumeCm3 * infillFactor;
    const weightGrams = Math.round(effectiveVolume * density * 10) / 10;

    const surfaceArea = Math.round(dimensions.x * dimensions.y * 2 + dimensions.x * dimensions.z * 2 + dimensions.y * dimensions.z * 2) / 100;

    if (onAnalysisChange) {
      onAnalysisChange({
        dimensions,
        volumeCm3: Math.round(volumeCm3 * 10) / 10,
        weightGrams: Math.max(weightGrams, 5),
        surfaceAreaCm2: surfaceArea,
      });
    }
  }

  return (
    <div className={`relative w-full h-full min-h-[300px] flex items-center justify-center rounded-2xl overflow-hidden bg-[#0A0E17] border border-[#222D42] ${className}`}>
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold text-cyan-300 tracking-wider">PROCESSANDO GEOMETRIA 3D...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-4 right-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2 z-20">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Controls Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        {/* Render Modes */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 pointer-events-auto shadow-lg">
          <button
            type="button"
            onClick={() => setRenderMode('solid')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${renderMode === 'solid' ? 'bg-[#5E488C] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Sólido
          </button>
          <button
            type="button"
            onClick={() => setRenderMode('wireframe')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${renderMode === 'wireframe' ? 'bg-[#4CA8B8] text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            Wireframe
          </button>
          <button
            type="button"
            onClick={() => setRenderMode('normal')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${renderMode === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Shaders
          </button>
        </div>

        {/* Auto Rotate Button */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 text-[11px] font-bold rounded-xl backdrop-blur-md border pointer-events-auto transition-all ${autoRotate ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900/80 text-slate-400 border-slate-700'}`}
        >
          {autoRotate ? '🔄 Rotação Ativa' : '⏸️ Pausado'}
        </button>
      </div>

      {/* Instructions Pill */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/70 border border-slate-800 text-[10px] text-slate-400 backdrop-blur-sm pointer-events-none">
        🖱️ Arraste para girar • Scroll zoom
      </div>
    </div>
  );
}

// ------------------- HELPERS & PARSERS -------------------

function createMesh(geometry: THREE.BufferGeometry, color: string, mode: 'solid' | 'wireframe' | 'normal'): THREE.Mesh {
  let material: THREE.Material;

  if (mode === 'wireframe') {
    material = new THREE.MeshBasicMaterial({
      color: '#4CA8B8',
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
  } else if (mode === 'normal') {
    material = new THREE.MeshNormalMaterial({
      wireframe: false,
    });
  } else {
    // Solid realista com acabamento de filamento PLA / Resina
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.1,
      clearcoatRoughness: 0.1,
    });
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function fitCameraToObject(camera: THREE.PerspectiveCamera, object: THREE.Object3D) {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
  cameraZ *= 1.7; // Margem de segurança

  camera.position.set(cameraZ * 0.7, cameraZ * 0.6, cameraZ);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

/** Cria geometria icônica estilizada para preview inicial da ImagineLab */
function createDefaultShowcaseGeometry(): THREE.BufferGeometry {
  const group = new THREE.Group();

  // Carretel estilizado com núcleo de filamento
  const cylinder = new THREE.CylinderGeometry(25, 25, 30, 32);
  const ring1 = new THREE.TorusGeometry(32, 4, 16, 50);
  ring1.rotateX(Math.PI / 2);
  ring1.translate(0, 15, 0);

  const ring2 = new THREE.TorusGeometry(32, 4, 16, 50);
  ring2.rotateX(Math.PI / 2);
  ring2.translate(0, -15, 0);

  // Escultura geométrica com lâmpada/cristal no topo
  const crystal = new THREE.OctahedronGeometry(18, 0);
  crystal.translate(0, 35, 0);

  // Merge geometries
  const g1 = cylinder.toNonIndexed();
  const g2 = ring1.toNonIndexed();
  const g3 = ring2.toNonIndexed();
  const g4 = crystal.toNonIndexed();

  const totalVertices = g1.getAttribute('position').count + g2.getAttribute('position').count + g3.getAttribute('position').count + g4.getAttribute('position').count;
  const positions = new Float32Array(totalVertices * 3);

  let offset = 0;
  [g1, g2, g3, g4].forEach(g => {
    const arr = g.getAttribute('position').array as Float32Array;
    positions.set(arr, offset);
    offset += arr.length;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.computeVertexNormals();
  merged.center();
  return merged;
}

/** Parser nativo de arquivos STL binários e ASCII sem dependências externas */
function parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry {
  const isBinary = (buf: ArrayBuffer): boolean => {
    const reader = new DataView(buf);
    const size = reader.byteLength;
    if (size < 84) return false;
    const numFaces = reader.getUint32(80, true);
    return 84 + numFaces * 50 === size;
  };

  if (isBinary(buffer)) {
    const reader = new DataView(buffer);
    const faces = reader.getUint32(80, true);
    const positions = new Float32Array(faces * 9);
    let offset = 84;
    let posOffset = 0;

    for (let face = 0; face < faces; face++) {
      // Ignora vetor normal (12 bytes)
      offset += 12;

      // 3 vértices (cada um com 3 floats de 4 bytes)
      for (let v = 0; v < 3; v++) {
        positions[posOffset++] = reader.getFloat32(offset, true);
        positions[posOffset++] = reader.getFloat32(offset + 4, true);
        positions[posOffset++] = reader.getFloat32(offset + 8, true);
        offset += 12;
      }
      // Ignora atributo de 2 bytes
      offset += 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  } else {
    // Parser ASCII
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n');
    const vertices: number[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('vertex')) {
        const parts = trimmed.split(/\s+/);
        vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    return geometry;
  }
}

/** Parser nativo de arquivos OBJ */
function parseOBJ(text: string): THREE.BufferGeometry {
  const lines = text.split('\n');
  const vList: number[][] = [];
  const positions: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('v ')) {
      const parts = trimmed.split(/\s+/).slice(1).map(Number);
      vList.push(parts);
    } else if (trimmed.startsWith('f ')) {
      const parts = trimmed.split(/\s+/).slice(1);
      const faceIndices = parts.map(p => {
        const idx = parseInt(p.split('/')[0], 10);
        return idx < 0 ? vList.length + idx : idx - 1;
      });

      // Triangula polígonos (fan triangulation)
      for (let i = 1; i < faceIndices.length - 1; i++) {
        const i0 = faceIndices[0];
        const i1 = faceIndices[i];
        const i2 = faceIndices[i + 1];

        if (vList[i0] && vList[i1] && vList[i2]) {
          positions.push(...vList[i0], ...vList[i1], ...vList[i2]);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}
