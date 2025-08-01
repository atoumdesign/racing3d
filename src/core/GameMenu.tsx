import React, { useEffect, useState } from 'react';
import styles from './GameMenu.module.css';
import type { CameraType } from '../camera/useFollowCamera';
import type { ControlConfig } from '../controls/useBasicControls';

export interface GameMenuProps {
  cameraType: CameraType;
  setCameraType: (type: CameraType) => void;
  controlConfig: ControlConfig;
  setControlConfig: (cfg: Partial<ControlConfig>) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  carType: string;
  setCarType: (type: string) => void;
  importedCarName: string;
  setImportedCarName: (name: string) => void;
  setImportedCarUrl: (url: string | null) => void;
  importedTrackName: string;
  setImportedTrackName: (name: string) => void;
  setImportedTrackUrl: (url: string | null) => void;
  onOpenEditor?: () => void;
  hasCustomCar?: boolean;
}

function usePublicFiles(folder: string) {
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    fetch(`/${folder}/index.json`)
      .then(res => res.json())
      .then(setFiles)
      .catch(() => setFiles([]));
  }, [folder]);
  return files;
}

export function GameMenu(props: GameMenuProps) {
  const {
    cameraType,
    setCameraType,
    controlConfig,
    setControlConfig,
    showGrid,
    setShowGrid,
    carType,
    setCarType,
    importedCarName,
    setImportedCarName,
    setImportedCarUrl,
    importedTrackName,
    setImportedTrackName,
    setImportedTrackUrl,
    onOpenEditor,
    hasCustomCar
  } = props;
  const [editing, setEditing] = useState<keyof ControlConfig | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const carFiles = usePublicFiles('cars');
  const trackFiles = usePublicFiles('tracks');

  React.useEffect(() => {
    if (!editing) return;
    const handler = (e: KeyboardEvent) => {
      setControlConfig({ ...controlConfig, [editing!]: e.code });
      setEditing(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editing, setControlConfig]);

  const handleImportCar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImportedCarUrl(url);
      setImportedCarName(file.name);
      setCarType('imported');
    }
  };

  const handleImportTrack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setImportedTrackUrl(fileUrl);
      setImportedTrackName(file.name);
    }
  };



  return (
    <div className={styles.menuRoot}>
      <div className={styles.menuSection}>
        {onOpenEditor && (
          <button className={styles.menuButton} onClick={onOpenEditor}>
            Editor de Carros
          </button>
        )}
      </div>
      <div className={styles.menuSection}>
        <label htmlFor="track-import">Importar pista:</label>
        <input
          id="track-import"
          type="file"
          accept=".gltf,.glb"
          onChange={handleImportTrack}
          className={styles.importCarInput}
          title="Importar modelo de pista (.gltf ou .glb)"
        />
        {importedTrackName && (
          <div className={styles.importedTrackName}>Pista: {importedTrackName}</div>
        )}
      </div>
      <div className={styles.menuSection}>
        <label htmlFor="car-select">Carro:</label>
        <select
          id="car-select"
          className={styles.menuSelect}
          value={carType}
          onChange={e => {
            setCarType(e.target.value);
            if (e.target.value !== 'imported') setImportedCarUrl(null);
          }}
        >
          <option value="basic">Azul (Padrão)</option>
          <option value="red">Vermelho</option>
          <option value="green">Verde</option>
          <option value="yellow">Amarelo</option>
          <option value="fusca">Fusca</option>
          <option value="taxi">Taxi</option>
          <option value="bus">Ônibus</option>
          <option value="truck">Caminhão</option>
          <option value="uno">Fiat Uno</option>
          <option value="sport">Esportivo</option>
          <option value="family">Passeio</option>
          {hasCustomCar && <option value="custom">Carro Personalizado</option>}
          {importedCarName && <option value="imported">{importedCarName} (importado)</option>}
        </select>
        <input
          type="file"
          accept=".gltf,.glb"
          onChange={handleImportCar}
          className={styles.importCarInput}
          title="Importar modelo de carro (.gltf ou .glb)"
        />
      </div>
      <div className={styles.menuSection}>
        {carFiles.length > 0 && (
          <div className={styles.menuSection}>
            <label htmlFor="car-public-select">Carro (arquivo):</label>
            <select
              id="car-public-select"
              className={styles.menuSelect}
              value={carType.startsWith('public:') ? carType : ''}
              onChange={e => {
                setCarType(e.target.value);
                setImportedCarUrl(`/cars/${e.target.value.replace('public:', '')}`);
                setImportedCarName(e.target.value.replace('public:', ''));
              }}
            >
              <option value="">Selecione um carro</option>
              {carFiles.map(f => (
                <option key={f} value={`public:${f}`}>{f}</option>
              ))}
            </select>
          </div>
        )}
        {trackFiles.length > 0 && (
          <div className={styles.menuSection}>
            <label htmlFor="track-public-select">Pista (arquivo):</label>
            <select
              id="track-public-select"
              className={styles.menuSelect}
              value={importedTrackName && importedTrackName.startsWith('public:') ? importedTrackName : ''}
              onChange={e => {
                setImportedTrackUrl(`/tracks/${e.target.value.replace('public:', '')}`);
                setImportedTrackName(`public:${e.target.value.replace('public:', '')}`);
              }}
            >
              <option value="">Selecione uma pista</option>
              {trackFiles.map(f => (
                <option key={f} value={`public:${f}`}>{f}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className={styles.menuTitle}>Configurações</div>
      <div className={styles.menuSection}>
        <label htmlFor="camera-select">Câmera:</label>
        <select
          id="camera-select"
          className={styles.menuSelect}
          value={cameraType}
          onChange={e => setCameraType(e.target.value as CameraType)}
        >
          <option value="traseira">Traseira (padrão)</option>
          <option value="cinematica">Cinemática (acima e atrás)</option>
          <option value="frontal">Frontal</option>
          <option value="topo">Topo</option>
        </select>
      </div>
      <div className={styles.menuSection}>
        <label className={styles.gridToggleLabel}>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={e => setShowGrid(e.target.checked)}
            className={styles.gridToggleCheckbox}
          />
          Exibir grid no chão
        </label>
      </div>
      <div className={styles.menuSection}>
        <button
          className={styles.menuButton + ' ' + styles.menuButtonAccordion}
          onClick={() => setControlsOpen(o => !o)}
        >
          {controlsOpen ? 'Ocultar controles ▲' : 'Configurar controles ▼'}
        </button>
        {controlsOpen && (
          <div>
            <div className={styles.menuControlsTitle}>Controles:</div>
            {(['forward','backward','left','right','brake','changeCamera'] as (keyof ControlConfig)[]).map(key => (
              <div key={key} className={styles.menuControlRow}>
                <span className={styles.menuControlLabel}>{
                  key === 'forward' ? 'Acelerar' :
                  key === 'backward' ? 'Ré' :
                  key === 'left' ? 'Esquerda' :
                  key === 'right' ? 'Direita' :
                  key === 'brake' ? 'Freio' :
                  key === 'changeCamera' ? 'Trocar Câmera' : key
                }:</span>
                <button
                  className={
                    styles.menuButton + (editing === key ? ' ' + styles.menuButtonActive : '')
                  }
                  onClick={() => setEditing(key)}
                  disabled={!!editing}
                >
                  {editing === key ? 'Pressione...' : controlConfig[key]}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Outras opções futuras aqui */}
    </div>
  );
};
