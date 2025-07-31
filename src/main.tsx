import React from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './core/Game';

const root = createRoot(document.getElementById('root')!);
root.render(<Game />);
