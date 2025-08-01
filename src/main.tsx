import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameSwitcher } from './core/GameSwitcher';

const root = createRoot(document.getElementById('root')!);
root.render(<GameSwitcher />);
