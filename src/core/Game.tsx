import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
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

export const Game: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<THREE.Object3D>(null);
  const { carState, updatePhysics } = useBasicPhysics();

  // Estado para velocímetro, odômetro, FPS e grid
  const [speed, setSpeed] = useState(0); // km/h
  const [distance, setDistance] = useState(0); // km
  const [fps, setFps] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [carType, setCarType] = useState('basic');
  const [importedCarUrl, setImportedCarUrl] = useState<string | null>(null);
  const [importedCarName, setImportedCarName] = useState<string>('');
  const [importedTrackUrl, setImportedTrackUrl] = useState<string | null>(null);
  const [importedTrackName, setImportedTrackName] = useState<string>('');

  const cameraTypes: CameraType[] = ['traseira', 'cinematica', 'frontal', 'topo'];
  const [cameraType, setCameraType] = React.useState<CameraType>('traseira');
  // Ref para sempre acessar o valor mais recente de cameraType dentro do loop
  const cameraTypeRef = useRef(cameraType);
  useEffect(() => { cameraTypeRef.current = cameraType; }, [cameraType]);
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

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
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

    // Pista
    let track: THREE.Object3D;
    let trackLoaded = false;
    async function setupTrack() {
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
        if (['Pista Importada', 'Pista Básica'].includes(obj.name)) {
          scene.remove(obj);
        }
      });
      scene.add(track);
      trackLoaded = true;
    }
    setupTrack();

    // Carro
    let car: THREE.Object3D;
    let carLoaded = false;
    let disposed = false;
    let lastPosition: THREE.Vector3;
    let totalDistance = 0;

    async function setupCar() {
      // Remove carros anteriores
      scene.traverse(obj => {
        if ([
          'Importado', 'Carro Básico', 'Carro Vermelho', 'Carro Verde', 'Carro Amarelo',
          'Fusca', 'Taxi', 'Ônibus', 'Caminhão', 'Fiat Uno', 'Esportivo', 'Passeio'
        ].includes(obj.name)) {
          scene.remove(obj);
        }
      });
      if (importedCarUrl) {
        try {
          car = await loadGLTFCar(importedCarUrl);
          car.name = importedCarName || 'Importado';
          // Centralizar e ajustar escala do modelo importado
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
        } catch (e) {
          car = BasicCar();
          car.name = 'Carro Básico';
        }
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
      }
      carRef.current = car;
      scene.add(car);
      lastPosition = car.position.clone();
      carLoaded = true;
    }

    setupCar();

    // FPS
    let frames = 0;
    let lastFpsUpdate = performance.now();

    // Loop de animação
    const animate = () => {
      requestAnimationFrame(animate);
      if (!carLoaded || !trackLoaded) return;
      updatePhysics(car, controls);
      updateCamera(camera, car);
      grid.visible = showGrid;
      renderer.render(scene, camera);

      // Velocímetro (km/h)
      const velocity = carState.current.velocity.length();
      const speedKmh = velocity * 60 * 60 / 1000;
      setSpeed(Number(speedKmh.toFixed(1)));

      // Odômetro (km)
      const delta = car.position.distanceTo(lastPosition);
      totalDistance += delta;
      setDistance(Number((totalDistance / 1000).toFixed(3)));
      lastPosition.copy(car.position);

      // FPS
      frames++;
      const now = performance.now();
      if (now - lastFpsUpdate > 500) {
        setFps(Math.round((frames * 1000) / (now - lastFpsUpdate)));
        lastFpsUpdate = now;
        frames = 0;
      }
    };
    animate();

    return () => {
      disposed = true;
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [showGrid, carType, importedCarUrl, importedTrackUrl]);

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
        setControlConfig={setConfig}
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
      />
    </>
  );
};
