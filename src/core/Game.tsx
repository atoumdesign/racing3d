import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BasicCar } from '../cars/BasicCar';
import { RedCar } from '../cars/RedCar';
import { GreenCar } from '../cars/GreenCar';
import { YellowCar } from '../cars/YellowCar';
import { FuscaCar } from '../cars/FuscaCar';
import { TaxiCar } from '../cars/TaxiCar';
import { BusCar } from '../cars/BusCar';
import { TruckCar } from '../cars/TruckCar';
import { UnoCar } from '../cars/UnoCar';
import { SportCar } from '../cars/SportCar';
import { FamilyCar } from '../cars/FamilyCar';
import { loadGLTFCar } from '../cars/CarLoader';
import { BasicTrack } from '../tracks/BasicTrack';
import { loadGLTFTrack } from '../tracks/TrackLoader';
import { useBasicPhysics } from '../physics/useBasicPhysics';
import { useBasicControls, ControlConfig } from '../controls/useBasicControls';

import { useFollowCamera, CameraType } from '../camera/useFollowCamera';
import { GameMenu } from './GameMenu';
import styles from './Game.module.css';


const CAR_OPTIONS = [
  { label: 'Azul (Padrão)', value: 'basic' },
  { label: 'Vermelho', value: 'red' },
  { label: 'Verde', value: 'green' },
  { label: 'Amarelo', value: 'yellow' },
  { label: 'Fusca', value: 'fusca' },
  { label: 'Taxi', value: 'taxi' },
  { label: 'Ônibus', value: 'bus' },
  { label: 'Caminhão', value: 'truck' },
  { label: 'Fiat Uno', value: 'uno' },
  { label: 'Esportivo', value: 'sport' },
  { label: 'Passeio', value: 'family' },
];

export const Game: React.FC<{ onOpenEditor?: () => void; customCarConfig?: any }> = ({ onOpenEditor, customCarConfig }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<THREE.Object3D | null>(null);
  const { carState, updatePhysics } = useBasicPhysics();

  // Estado para velocímetro, odômetro, FPS e grid
  const [speed, setSpeed] = useState(0); // km/h
  const [distance, setDistance] = useState(0); // km
  const [fps, setFps] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [carType, setCarType] = useState('basic');
  const [customCar, setCustomCar] = useState<any>(customCarConfig || null);
  const [importedCarUrl, setImportedCarUrl] = useState<string | null>(null);
  const [importedCarName, setImportedCarName] = useState<string>('');
  const [importedTrackUrl, setImportedTrackUrl] = useState<string | null>(null);
  const [importedTrackName, setImportedTrackName] = useState<string>('');

  const cameraTypes: CameraType[] = ['traseira', 'cinematica', 'frontal', 'topo'];
  const [cameraType, setCameraType] = React.useState<CameraType>('traseira');
  // Ref para sempre acessar o valor mais recente de cameraType dentro do loop
  const cameraTypeRef = useRef(cameraType);
  useEffect(() => { cameraTypeRef.current = cameraType; }, [cameraType]);
  React.useEffect(() => {
    if (customCarConfig) {
      setCustomCar(customCarConfig);
      setCarType('custom'); // Seleciona automaticamente o carro personalizado
    }
  }, [customCarConfig]);
  const [controlConfig, setControlConfig] = React.useState<Partial<ControlConfig>>();
  // Debounce para evitar múltiplas trocas de câmera por pressionamento
  const cameraSwitching = useRef(false);
  const { controls, config, setConfig } = useBasicControls(() => {
    if (!cameraSwitching.current) {
      cameraSwitching.current = true;
      setCameraType(prev => {
        const idx = cameraTypes.indexOf(prev);
        return cameraTypes[(idx + 1) % cameraTypes.length];
      });
      setTimeout(() => { cameraSwitching.current = false; }, 200);
    }
  }, controlConfig);
  const { camera, updateCamera } = useFollowCamera(carRef, cameraType);

  // Atualiza a câmera imediatamente ao trocar cameraType
  useEffect(() => {
    if (carRef.current) {
      updateCamera(camera, carRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraType]);

  // --- Monta cena e renderer apenas uma vez ---
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const gridRef = useRef<THREE.GridHelper>();
  const carObjRef = useRef<THREE.Object3D | null>(null);
  const lastPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const totalDistanceRef = useRef<number>(0);
  const [trackLoaded, setTrackLoaded] = useState(false);

  useEffect(() => {
    if (!sceneRef.current) {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current = renderer;
      mountRef.current?.appendChild(renderer.domElement);

      // Luz
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(10, 10, 10);
      scene.add(light);

      // Plano infinito
      const planeGeometry = new THREE.PlaneGeometry(10000, 10000);
      const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xe0e0e0, depthWrite: true });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.01;
      plane.receiveShadow = true;
      scene.add(plane);

      // Grid helper
      const grid = new THREE.GridHelper(10000, 100, 0x888888, 0xcccccc);
      grid.position.y = 0.001;
      scene.add(grid);
      gridRef.current = grid;
    }
    return () => {
      rendererRef.current?.dispose();
      if (mountRef.current && rendererRef.current?.domElement)
        mountRef.current.removeChild(rendererRef.current.domElement);
    };
  }, []);

  // --- Atualiza pista ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let track: THREE.Object3D;
    (async () => {
      if (importedTrackUrl) {
        try {
          track = await loadGLTFTrack(importedTrackUrl);
          track.name = importedTrackName || 'Pista Importada';
        } catch (e) {
          track = BasicTrack();
          track.name = 'Pista Básica';
        }
      } else {
        track = BasicTrack();
        track.name = 'Pista Básica';
      }
      scene.traverse(obj => {
        if (["Pista Importada", "Pista Básica"].includes(obj.name)) {
          scene.remove(obj);
        }
      });
      scene.add(track);
      setTrackLoaded(true);
    })();
  }, [importedTrackUrl, importedTrackName]);

  // --- Atualiza carro ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !trackLoaded) return;
    // Limpeza robusta: remove todos os objetos do grupo/carro anterior
    const carNames = [
      'Importado', 'Carro Básico', 'Carro Vermelho', 'Carro Verde', 'Carro Amarelo',
      'Fusca', 'Taxi', 'Ônibus', 'Caminhão', 'Fiat Uno', 'Esportivo', 'Passeio', 'Carro Personalizado'
    ];
    let removed = true;
    while (removed) {
      removed = false;
      scene.traverse(obj => {
        if (carNames.includes(obj.name) && obj.parent) {
          obj.parent.remove(obj);
          removed = true;
        }
      });
    }
    let car: THREE.Object3D;
    if (carType === 'custom' && customCar) {
      car = new THREE.Group();
      car.name = 'Carro Personalizado';
      if (customCar.parts && Array.isArray(customCar.parts)) {
        const loader = new GLTFLoader();
        (async () => {
          for (const part of customCar.parts) {
            if (part.fileName) {
              try {
                const url = `/parts/${part.fileName}`;
                // eslint-disable-next-line no-await-in-loop
                const gltf = await loader.loadAsync(url);
                let mesh: THREE.Object3D;
                if (part.meshType === 'child' && gltf.scene.children.length === 1 && (gltf.scene.children[0] as any).isMesh) {
                  mesh = gltf.scene.children[0];
                } else {
                  mesh = gltf.scene;
                }
                mesh.traverse(obj => {
                  if (obj instanceof THREE.Mesh) {
                    obj.material = new THREE.MeshStandardMaterial({ color: part.color || 0x222222 });
                  }
                });
                if (part.position) mesh.position.set(part.position.x, part.position.y, part.position.z);
                if (part.rotation) mesh.rotation.set(part.rotation.x, part.rotation.y, part.rotation.z);
                if (part.scale) mesh.scale.set(part.scale.x, part.scale.y, part.scale.z);
                mesh.name = part.name || 'Parte';
                car.add(mesh);
              } catch (e) {
                alert(`Arquivo da peça não encontrado: ${part.fileName}\nColoque o arquivo em public/parts/ e recarregue a página.`);
                const mesh = new THREE.Mesh(
                  new THREE.BoxGeometry(1, 1, 1),
                  new THREE.MeshStandardMaterial({ color: part.color || 0x222222 })
                );
                if (part.position) mesh.position.set(part.position.x, part.position.y, part.position.z);
                if (part.rotation) mesh.rotation.set(part.rotation.x, part.rotation.y, part.rotation.z);
                if (part.scale) mesh.scale.set(part.scale.x, part.scale.y, part.scale.z);
                mesh.name = part.name || 'Parte';
                car.add(mesh);
              }
            } else {
              const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial({ color: part.color || 0x222222 })
              );
              if (part.position) mesh.position.set(part.position.x, part.position.y, part.position.z);
              if (part.rotation) mesh.rotation.set(part.rotation.x, part.rotation.y, part.rotation.z);
              if (part.scale) mesh.scale.set(part.scale.x, part.scale.y, part.scale.z);
              mesh.name = part.name || 'Parte';
              car.add(mesh);
            }
          }
          carObjRef.current = car;
          scene.add(car);
          lastPositionRef.current = car.position.clone();
        })();
      }
    } else if (importedCarUrl) {
      (async () => {
        try {
          car = await loadGLTFCar(importedCarUrl);
          car.name = importedCarName || 'Importado';
          const box = new THREE.Box3().setFromObject(car);
          const center = box.getCenter(new THREE.Vector3());
          car.position.sub(center);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0 && maxDim !== 4) {
            const scale = 4 / maxDim;
            car.scale.setScalar(scale);
          }
          const newBox = new THREE.Box3().setFromObject(car);
          const minY = newBox.min.y;
          if (minY !== 0) car.position.y -= minY;
          carObjRef.current = car;
          scene.add(car);
          lastPositionRef.current = car.position.clone();
        } catch (e) {
          car = BasicCar();
          car.name = 'Carro Básico';
          carObjRef.current = car;
          scene.add(car);
          lastPositionRef.current = car.position.clone();
        }
      })();
    } else {
      switch (carType) {
        case 'red':
          car = RedCar();
          car.name = 'Carro Vermelho';
          break;
        case 'green':
          car = GreenCar();
          car.name = 'Carro Verde';
          break;
        case 'yellow':
          car = YellowCar();
          car.name = 'Carro Amarelo';
          break;
        case 'fusca':
          car = FuscaCar();
          car.name = 'Fusca';
          break;
        case 'taxi':
          car = TaxiCar();
          car.name = 'Taxi';
          break;
        case 'bus':
          car = BusCar();
          car.name = 'Ônibus';
          break;
        case 'truck':
          car = TruckCar();
          car.name = 'Caminhão';
          break;
        case 'uno':
          car = UnoCar();
          car.name = 'Fiat Uno';
          break;
        case 'sport':
          car = SportCar();
          car.name = 'Esportivo';
          break;
        case 'family':
          car = FamilyCar();
          car.name = 'Passeio';
          break;
        case 'basic':
        default:
          car = BasicCar();
          car.name = 'Carro Básico';
      }
      carObjRef.current = car;
      scene.add(car);
      lastPositionRef.current = car.position.clone();
    }
  }, [carType, customCar, importedCarUrl, importedCarName, trackLoaded]);

  // --- Loop de animação ---
  useEffect(() => {
    let disposed = false;
    const animate = () => {
      if (disposed) return;
      requestAnimationFrame(animate);
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      const car = carObjRef.current;
      const grid = gridRef.current;
      if (!scene || !renderer || !car) return;
      updatePhysics(car, controls);
      updateCamera(camera, car);
      if (grid) grid.visible = showGrid;
      renderer.render(scene, camera);

      // Velocímetro (km/h)
      const velocity = carState.current.velocity.length();
      const speedKmh = velocity * 60 * 60 / 1000;
      setSpeed(Number(speedKmh.toFixed(1)));

      // Odômetro (km)
      const delta = car.position.distanceTo(lastPositionRef.current);
      totalDistanceRef.current += delta;
      setDistance(Number((totalDistanceRef.current / 1000).toFixed(3)));
      lastPositionRef.current.copy(car.position);

      // FPS
      frames++;
      const now = performance.now();
      if (now - lastFpsUpdate > 500) {
        setFps(Math.round((frames * 1000) / (now - lastFpsUpdate)));
        lastFpsUpdate = now;
        frames = 0;
      }
    };
    let frames = 0;
    let lastFpsUpdate = performance.now();
    animate();
    return () => { disposed = true; };
  }, [controls, camera, showGrid]);

  return (
    <>
      <div ref={mountRef} className={styles.gameRoot} />
      {/* HUD do jogo */}
      <div className={styles.hudTopLeft}>
        <div>Velocidade: <b>{speed}</b> km/h</div>
        <div>Distância: <b>{distance}</b> km</div>
        <div>FPS: <b>{fps}</b></div>
      </div>
      <GameMenu
        cameraType={cameraType}
        setCameraType={setCameraType}
        controlConfig={config}
        setControlConfig={cfg => setConfig(prev => ({ ...prev, ...cfg }))}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        carType={carType}
        setCarType={setCarType}
        importedCarName={importedCarName}
        setImportedCarName={setImportedCarName}
        setImportedCarUrl={setImportedCarUrl}
        importedTrackName={importedTrackName}
        setImportedTrackName={setImportedTrackName}
        setImportedTrackUrl={setImportedTrackUrl}
        onOpenEditor={onOpenEditor}
        hasCustomCar={!!customCar}
      />
    </>
  );
};
