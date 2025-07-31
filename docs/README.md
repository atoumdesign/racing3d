# Jogo de Corrida 3D - Arquitetura e Fluxos

Este projeto é um jogo de corrida 3D modularizado em React, TypeScript e Three.js, preparado para expansão futura (editor, hub, múltiplos carros e pistas).

## Diagrama de Arquitetura

```mermaid
flowchart TD
    Main[main.tsx] --> Game[Game.tsx]
    Game --> |"Renderiza"| ThreeScene[Three.js Scene]
    Game --> |"Importa"| Car[BasicCar]
    Game --> |"Importa"| Track[BasicTrack]
    Game --> |"Hook"| Physics[useBasicPhysics]
    Game --> |"Hook"| Controls[useBasicControls]
    Game --> |"Hook"| Camera[useFollowCamera]
    Game --> |"Futuro"| Hub[Hub]
    Game --> |"Futuro"| Editor[Editor]
    ThreeScene --> Car
    ThreeScene --> Track
```

## Diagrama de Sequência (Loop Principal)

```mermaid
sequenceDiagram
    participant User
    participant Controls
    participant Game
    participant Physics
    participant Camera
    participant Renderer
    User->>Controls: Pressiona teclas
    Controls->>Game: Atualiza estado dos controles
    Game->>Physics: updatePhysics(car, controls)
    Physics-->>Game: Atualiza posição/rotação do carro
    Game->>Camera: updateCamera(camera, car)
    Camera-->>Game: Atualiza posição da câmera
    Game->>Renderer: renderer.render(scene, camera)
    Renderer-->>Game: Exibe frame
    loop Próximo frame
        Game->>Game: requestAnimationFrame(animate)
    end
```

## Estrutura de Pastas

```text
src/
  core/         # Game principal, estilos
  cars/         # Carros e módulos relacionados
  tracks/       # Pistas e módulos relacionados
  physics/      # Física e hooks
  controls/     # Controles e hooks
  camera/       # Câmera e hooks
  hub/          # Hub do jogo (futuro)
  editor/       # Editor visual (futuro)
docs/           # Documentação e diagramas
```

---

> Os diagramas Mermaid acima podem ser visualizados no VS Code com extensões apropriadas ou em sites como [Mermaid Live Editor](https://mermaid.live/).
