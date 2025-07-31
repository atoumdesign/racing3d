
import { useEffect, useRef, useState } from 'react';

export type ControlConfig = {
  forward: string;
  backward: string;
  left: string;
  right: string;
  brake: string;
  changeCamera: string;
};

const defaultConfig: ControlConfig = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  brake: 'Space',
  changeCamera: 'KeyC',
};

export function useBasicControls(onChangeCamera?: () => void, initialConfig?: Partial<ControlConfig>) {
  const [config, setConfig] = useState<ControlConfig>({ ...defaultConfig, ...initialConfig });
  const controls = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === config.forward) controls.current.forward = true;
      if (e.code === config.backward) controls.current.backward = true;
      if (e.code === config.left) controls.current.left = true;
      if (e.code === config.right) controls.current.right = true;
      if (e.code === config.brake) controls.current.brake = true;
      if (e.code === config.changeCamera && onChangeCamera) onChangeCamera();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === config.forward) controls.current.forward = false;
      if (e.code === config.backward) controls.current.backward = false;
      if (e.code === config.left) controls.current.left = false;
      if (e.code === config.right) controls.current.right = false;
      if (e.code === config.brake) controls.current.brake = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config, onChangeCamera]);

  return {
    controls: controls.current,
    config,
    setConfig,
  };
}
