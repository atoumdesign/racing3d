import React, { useState } from 'react';
import { Game } from './Game';
import { CarEditor } from '../editor/CarEditor';

export function GameSwitcher() {
  const [view, setView] = React.useState<'game' | 'editor'>('game');
  const [customCarConfig, setCustomCarConfig] = React.useState<any>(null);

  return (
    <>
      {view === 'game' && (
        <Game
          onOpenEditor={() => setView('editor')}
          customCarConfig={customCarConfig}
        />
      )}
      {view === 'editor' && (
        <CarEditor
          onBackToGame={() => setView('game')}
          onExportToGame={config => {
            // Sempre cria uma nova referência profunda para garantir atualização
            setCustomCarConfig(JSON.parse(JSON.stringify(config)));
            setView('game');
          }}
        />
      )}
    </>
  );
}
