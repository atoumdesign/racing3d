// Declaração global para React, caso precise importar hooks em arquivos não JSX
import * as React from 'react';
declare global {
  const React: typeof import('react');
}
