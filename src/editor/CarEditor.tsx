import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import styles from './CarEditor.module.css';

type CarPart = {
  name: string;
  mesh: THREE.Object3D | null;
  color: string;
  file?: File;
  fileName?: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
};

type LightConfig = {
  type: 'headlight' | 'indicator' | 'brake';
  position: [number, number, number];
  color: string;
};

type CarConfig = {
  name: string;
  parts: CarPart[];
  lights: LightConfig[];
  decals: { texture: string; position: [number, number, number]; scale: [number, number, number] }[];
};

// Hook para listar arquivos GLTF/GLB em public/parts
function usePartsFiles() {
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    fetch('/parts/index.json')
      .then(res => res.json())
      .then(setFiles)
      .catch(() => setFiles([]));
  }, []);
  return files;
}

export const CarEditor: React.FC<{ onBackToGame?: () => void; onExportToGame?: (config: any) => void }> = ({ onBackToGame, onExportToGame }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const [carConfig, setCarConfig] = useState<CarConfig>({
    name: 'Novo Carro',
    parts: [
      { name: 'Corpo', mesh: null, color: '#1976d2' },
      { name: 'Pneu Dianteiro Esquerdo', mesh: null, color: '#222222' },
      { name: 'Pneu Dianteiro Direito', mesh: null, color: '#222222' },
      { name: 'Pneu Traseiro Esquerdo', mesh: null, color: '#222222' },
      { name: 'Pneu Traseiro Direito', mesh: null, color: '#222222' },
      { name: 'Aerofólio', mesh: null, color: '#333333' },
      { name: 'Grade', mesh: null, color: '#444444' },
    ],
    lights: [],
    decals: [],
  });
  const [selectedPart, setSelectedPart] = useState<number>(0);
  const [transformControls, setTransformControls] = useState<TransformControls | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const partsFiles = usePartsFiles();

  React.useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e0e0e0');
    const camera = new THREE.PerspectiveCamera(60, 1.5, 0.1, 1000);
    camera.position.set(0, 4, 10);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 400);
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 1, 0);

    // Adiciona grade
    const grid = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
    grid.position.y = 0;
    scene.add(grid);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Grupo fixo para as partes do carro
    const carGroup = new THREE.Group();
    carGroup.name = 'CarGroup';
    scene.add(carGroup);
    carGroupRef.current = carGroup;

    // TransformControls
    const transform = new TransformControls(camera, renderer.domElement);
    scene.add(transform);
    setTransformControls(transform);

    // Click para selecionar parte
    renderer.domElement.addEventListener('pointerdown', (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const mouse = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const meshes = carGroup.children;
      const intersects = raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const idx = carGroup.children.findIndex(child => child === mesh.parent || child === mesh);
        if (idx >= 0) setSelectedPart(idx);
      }
    });

    sceneRef.current = scene;

    function animate() {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }, []);
  // Atualiza modo do TransformControls
  React.useEffect(() => {
    if (transformControls) {
      transformControls.setMode(transformMode);
    }
  }, [transformMode, transformControls]);
  // Atualiza TransformControls para parte selecionada
  React.useEffect(() => {
    const carGroup = carGroupRef.current;
    const transform = transformControls;
    if (!carGroup || !transform) return;
    const mesh = carConfig.parts[selectedPart]?.mesh;
    if (mesh) {
      transform.attach(mesh);
      transform.visible = true;
    } else {
      transform.detach();
      transform.visible = false;
    }
    // Atualiza posição no estado ao mover
    const onChange = () => {
      setCarConfig(prev => {
        const parts = [...prev.parts];
        if (parts[selectedPart] && parts[selectedPart].mesh) {
          const pos = parts[selectedPart].mesh!.position;
          parts[selectedPart] = { ...parts[selectedPart], mesh: parts[selectedPart].mesh };
        }
        return { ...prev, parts };
      });
    };
    transform.addEventListener('objectChange', onChange);
    return () => {
      transform.removeEventListener('objectChange', onChange);
    };
  }, [selectedPart, carConfig.parts, transformControls]);
  // Importar carro via JSON
  function handleImportCarJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        // Limpa grupo
        const carGroup = carGroupRef.current;
        if (carGroup) {
          while (carGroup.children.length > 0) carGroup.remove(carGroup.children[0]);
        }
        // Recria partes
        const newParts: CarPart[] = await Promise.all(json.parts.map(async (part: any) => {
              let mesh: THREE.Object3D | null = null;
              let meshType: 'scene' | 'child' = 'scene';
              if (part.fileName) {
                // Carrega mesh do arquivo GLTF/GLB
                const loader = new GLTFLoader();
                try {
                  const gltf = await loader.loadAsync(`/parts/${part.fileName}`);
                  if (gltf.scene.children.length === 1 && (gltf.scene.children[0] as any).isMesh) {
                    mesh = gltf.scene.children[0];
                    meshType = 'child';
                  } else {
                    mesh = gltf.scene;
                    meshType = 'scene';
                  }
                  mesh.name = part.name;
                  // Aplica transformações salvas
                  if (part.position) mesh.position.set(part.position.x, part.position.y, part.position.z);
                  if (part.rotation) mesh.rotation.set(part.rotation.x, part.rotation.y, part.rotation.z);
                  if (part.scale) mesh.scale.set(part.scale.x, part.scale.y, part.scale.z);
                  if (carGroupRef.current && !carGroupRef.current.children.includes(mesh)) {
                    carGroupRef.current.add(mesh);
                  }
                } catch {
                  mesh = null;
                }
              }
              return {
                name: part.name,
                mesh,
                color: part.color,
                file: undefined,
                fileName: part.fileName,
                meshType: part.meshType || meshType,
              };
        }));
        setCarConfig((prev) => ({
          ...prev,
          name: json.name || prev.name,
          parts: newParts,
          lights: json.lights || [],
          decals: json.decals || [],
        }));
      } catch (err) {
        alert('Erro ao importar carro: ' + err);
      }
    };
    reader.readAsText(file);
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const color = e.target.value;
    setCarConfig((prev) => {
      const parts = [...prev.parts];
      parts[selectedPart] = { ...parts[selectedPart], color };
      if (parts[selectedPart].mesh && (parts[selectedPart].mesh as any).material) {
        ((parts[selectedPart].mesh as any).material as THREE.MeshStandardMaterial).color.set(color);
      }
      return { ...prev, parts };
    });
  }

  function handleImportPart(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      let mesh: THREE.Object3D;
          let meshType: 'scene' | 'child' = 'scene';
          if (gltf.scene.children.length === 1 && (gltf.scene.children[0] as any).isMesh) {
        mesh = gltf.scene.children[0];
            meshType = 'child';
          } else {
        mesh = gltf.scene;
            meshType = 'scene';
          }
          mesh.name = carConfig.parts[idx].name;
          // Adiciona o mesh ao grupo da cena antes de atualizar o estado
          if (carGroupRef.current && !carGroupRef.current.children.includes(mesh)) {
            carGroupRef.current.add(mesh);
          }
          setCarConfig((prev) => {
            const parts = [...prev.parts];
            parts[idx] = { ...parts[idx], mesh, file, fileName: file.name, meshType };
            return { ...prev, parts };
          });
    });
  }

  function handleAddLight(type: LightConfig['type']) {
    setCarConfig((prev) => ({
      ...prev,
      lights: [
        ...prev.lights,
        { type, position: [0, 1, 2], color: type === 'brake' ? '#f00' : '#fff' },
      ],
    }));
  }

  function handleLightColor(idx: number, color: string) {
    setCarConfig((prev) => {
      const lights = [...prev.lights];
      lights[idx] = { ...lights[idx], color };
      return { ...prev, lights };
    });
  }

  function handleAddDecal() {
    setCarConfig((prev) => ({
      ...prev,
      decals: [
        ...prev.decals,
        { texture: '', position: [0, 1, 0], scale: [1, 1, 1] },
      ],
    }));
  }

  function handleExport() {
    // Atualiza as transformações no estado antes de exportar
    setCarConfig(prev => {
      const parts = prev.parts.map(p => {
        if (p.mesh) {
          return {
            ...p,
            position: {
              x: p.mesh.position.x,
              y: p.mesh.position.y,
              z: p.mesh.position.z,
            },
            rotation: {
              x: p.mesh.rotation.x,
              y: p.mesh.rotation.y,
              z: p.mesh.rotation.z,
            },
            scale: {
              x: p.mesh.scale.x,
              y: p.mesh.scale.y,
              z: p.mesh.scale.z,
            },
          };
        }
        return p;
      });
      // Após atualizar, exporta
      setTimeout(() => {
        const exportData = {
          ...prev,
          parts: parts.map((p) => ({
            name: p.name,
            color: p.color,
            fileName: p.file?.name || p.fileName || null,
            position: p.position,
            rotation: p.rotation,
            scale: p.scale,
                meshType: p.meshType || 'scene',
          })),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${prev.name.replace(/\s+/g, '_')}_car.json`;
        a.click();
      }, 0);
      return { ...prev, parts };
    });
  }

  // Handler para cor da peça
  function handlePartColorChange(part: CarPart, color: string) {
    setCarConfig((prev) => {
      const parts = prev.parts.map((p) =>
        p === part ? { ...p, color } : p
      );
      return { ...prev, parts };
    });
  }
  // Handler para coordenadas da peça
  function handlePartCoordChange(part: CarPart, axis: 'x' | 'y' | 'z', value: number) {
    if (!part.mesh) return;
    part.mesh.position[axis] = value;
    setCarConfig((prev) => ({ ...prev }));
  }
  // Handler para escala da peça
  function handlePartScaleChange(part: CarPart, axis: 'x' | 'y' | 'z', value: number) {
    if (!part.mesh) return;
    part.mesh.scale[axis] = value;
    setCarConfig((prev) => ({ ...prev }));
  }

  return (
    <div className={styles['car-editor-flex']}>
      <div>
        <h2>Editor de Carros</h2>
        <div className={styles['car-editor-section']}>
          <label>Modo de transformação: </label>
          <button onClick={() => setTransformMode('translate')} disabled={transformMode === 'translate'}>Mover</button>
          <button onClick={() => setTransformMode('rotate')} disabled={transformMode === 'rotate'}>Girar</button>
          <button onClick={() => setTransformMode('scale')} disabled={transformMode === 'scale'}>Escalar</button>
        </div>
        <div className={styles['car-editor-section']}>
          <label>
            Importar carro (.json):
            <input type="file" accept=".json" onChange={handleImportCarJson} className={styles['car-editor-input']} title="Importar configuração de carro (.json)" />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={() => {
              // Atualiza o estado carConfig ANTES de exportar, garantindo sincronização
              const syncedParts = carConfig.parts.map(part => {
                if (part.mesh) {
                  return {
                    ...part,
                    position: {
                      x: part.mesh.position.x,
                      y: part.mesh.position.y,
                      z: part.mesh.position.z,
                    },
                    rotation: {
                      x: part.mesh.rotation.x,
                      y: part.mesh.rotation.y,
                      z: part.mesh.rotation.z,
                    },
                    scale: {
                      x: part.mesh.scale.x,
                      y: part.mesh.scale.y,
                      z: part.mesh.scale.z,
                    },
                  };
                }
                return part;
              });
              const syncConfig = { ...carConfig, parts: syncedParts };
              // Atualiza o estado local para garantir consistência visual
              setCarConfig(syncConfig);
              if (onExportToGame) onExportToGame(syncConfig);
            }}
            className={styles['car-editor-back-btn']}
            title="Enviar este carro para o jogo agora"
          >
            Usar este carro no jogo
          </button>
          {onBackToGame && (
            <button onClick={onBackToGame} className={styles['car-editor-back-btn']}>
              Voltar ao Jogo
            </button>
          )}
        </div>
        <label>
          Nome do carro:
          <input
            type="text"
            value={carConfig.name}
            onChange={e => setCarConfig({ ...carConfig, name: e.target.value })}
            className={styles['car-editor-input']}
            title="Nome do carro"
            placeholder="Nome do carro"
          />
        </label>
        <h3>Peças</h3>
        <ul>
          {carConfig.parts.map((part, idx) => {
            const mesh = part.mesh;
            const pos = mesh ? mesh.position : { x: 0, y: 0, z: 0 };
            return (
              <li key={part.name} className={styles['car-editor-part-item']}>
                <button
                  onClick={() => setSelectedPart(idx)}
                  className={styles['car-editor-part-btn']}
                >
                  {part.name}
                </button>
                <input
                  type="color"
                  value={part.color}
                  onChange={e => handlePartColorChange(part, e.target.value)}
                  className={styles['car-editor-input']}
                  title="Cor da peça"
                  aria-label="Cor da peça"
                />
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={e => handleImportPart(e, idx)}
                  className={styles['car-editor-input']}
                  title="Importar modelo 3D da peça"
                />
                {partsFiles.length > 0 && (
                  <select
                    className={styles['car-editor-input']}
                    title="Selecionar modelo existente"
                    value={part.fileName || ''}
                    onChange={e => {
                      const fileName = e.target.value;
                      if (!fileName) return;
                      // Carrega o mesh do arquivo selecionado
                      const loader = new GLTFLoader();
                      loader.load(`/parts/${fileName}`, (gltf) => {
                        let mesh: THREE.Object3D;
                        if (gltf.scene.children.length === 1 && (gltf.scene.children[0] as any).isMesh) {
                          mesh = gltf.scene.children[0];
                        } else {
                          mesh = gltf.scene;
                        }
                        mesh.name = part.name;
                        if (carGroupRef.current && !carGroupRef.current.children.includes(mesh)) {
                          carGroupRef.current.add(mesh);
                        }
                        setCarConfig((prev) => {
                          const parts = [...prev.parts];
                          parts[idx] = { ...parts[idx], mesh, file: undefined, fileName };
                          return { ...prev, parts };
                        });
                      });
                    }}
                  >
                    <option value="">Selecione peça existente</option>
                    {partsFiles.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                )}
                {selectedPart === idx && mesh && (
                  <span className={styles['car-editor-coord-label']}>
                    X: <input type="number" value={pos.x.toFixed(2)} step="0.01" className={styles['car-editor-coord-input']} title="Coordenada X" placeholder="X" onChange={e => handlePartCoordChange(part, 'x', parseFloat(e.target.value))} />
                    Y: <input type="number" value={pos.y.toFixed(2)} step="0.01" className={styles['car-editor-coord-input']} title="Coordenada Y" placeholder="Y" onChange={e => handlePartCoordChange(part, 'y', parseFloat(e.target.value))} />
                    Z: <input type="number" value={pos.z.toFixed(2)} step="0.01" className={styles['car-editor-coord-input']} title="Coordenada Z" placeholder="Z" onChange={e => handlePartCoordChange(part, 'z', parseFloat(e.target.value))} />
                  </span>
                )}
                {selectedPart === idx && (
                  <div className={styles['car-editor-scale-container']}>
                    <label>Escala:</label>
                    <input
                      type="number"
                      value={mesh ? mesh.scale.x : 1}
                      step="0.01"
                      className={styles['car-editor-coord-input']}
                      title="Escala X"
                      placeholder="Escala X"
                      onChange={e => handlePartScaleChange(part, 'x', parseFloat(e.target.value))}
                    />
                    <input
                      type="number"
                      value={mesh ? mesh.scale.y : 1}
                      step="0.01"
                      className={styles['car-editor-coord-input']}
                      title="Escala Y"
                      placeholder="Escala Y"
                      onChange={e => handlePartScaleChange(part, 'y', parseFloat(e.target.value))}
                    />
                    <input
                      type="number"
                      value={mesh ? mesh.scale.z : 1}
                      step="0.01"
                      className={styles['car-editor-coord-input']}
                      title="Escala Z"
                      placeholder="Escala Z"
                      onChange={e => handlePartScaleChange(part, 'z', parseFloat(e.target.value))}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <h3>Luzes</h3>
        <button onClick={() => handleAddLight('headlight')}>Adicionar Farol</button>
        <button onClick={() => handleAddLight('indicator')}>Adicionar Seta</button>
        <button onClick={() => handleAddLight('brake')}>Adicionar Luz de Freio</button>
        <ul>
          {carConfig.lights.map((light, idx) => (
            <li key={idx}>
              {light.type} - Cor:
              <input
                type="color"
                value={light.color}
                onChange={e => handleLightColor(idx, e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </li>
          ))}
        </ul>
        <h3>Personalizações</h3>
        <button onClick={handleAddDecal}>Adicionar Adesivo/Decalque</button>
        <ul>
          {carConfig.decals.map((decal, idx) => (
            <li key={idx}>
              Textura:
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  setCarConfig(prev => {
                    const decals = [...prev.decals];
                    decals[idx] = { ...decals[idx], texture: url };
                    return { ...prev, decals };
                  });
                }}
                style={{ marginLeft: 8 }}
              />
            </li>
          ))}
        </ul>
        <button className={styles['car-editor-export-btn']} onClick={handleExport}>
          Exportar Carro
        </button>
        {onExportToGame && (
          <button className={styles['car-editor-use-btn']} onClick={() => onExportToGame(carConfig)}>
            Usar este carro no jogo
          </button>
        )}
      </div>
      <div>
        <h3>Visualização</h3>
        <div ref={mountRef} className={styles['car-editor-canvas']} />
      </div>
    </div>
  );
};
