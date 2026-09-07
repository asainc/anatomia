# Mapa das principais renomeações

Este documento registra as principais renomeações realizadas no código de negócio.

| Nome anterior | Nome atual | Contexto |
|---|---|---|
| `SystemId` | `IdSistema` | Tipo de sistema anatômico |
| `SYSTEMS` | `SISTEMAS` | Catálogo de sistemas |
| `DEFAULT_VISIBLE` | `SISTEMAS_VISIVEIS_PADRAO` | Sistemas exibidos inicialmente |
| `EXPLANATIONS` | `EXPLICACOES` | Descrições específicas |
| `explanation` | `obterExplicacao` | Recuperação de explicação |
| `Part` | `Parte` | Estrutura anatômica individual |
| `Concept` | `Conceito` | Conceito que pode reunir peças |
| `SceneState` | `EstadoCena` | Estado da visualização 3D |
| `View` | `Vista` | Orientação da câmera |
| `explode` | `explosao` | Intensidade do modo explodido |
| `visible` | `sistemasVisiveis` | Sistemas visíveis |
| `selected` | `selecionados` | IDs selecionados |
| `isolate` | `isolar` | Modo de isolamento |
| `rotate` | `rotacionar` | Rotação automática |
| `reset` | `reinicio` | Controle de reposicionamento |
| `createExplosionLayout` | `criarLayoutExplosao` | Cálculo do layout explodido |
| `PointerTap` | `DetectorToquePonteiro` | Diferencia clique/toque de gesto |
| `decodeModelResponse` | `decodificarRespostaModelo` | Tratamento dos buffers baixados |
| `atlasTools` | `criarFerramentasAtlas` | Criação de ferramentas opcionais |
| `registerAtlasTools` | `registrarFerramentasAtlas` | Registro no navegador |
| `Home` | `PaginaInicial` | Componente principal |
| `AnatomyScene` | `CenaAnatomia` | Componente Three.js |
| `state` | `estado` | Estado React principal |
| `progress` | `progresso` | Progresso de carregamento |
| `error` | `erro` | Mensagem de falha |
| `query` | `consulta` | Texto pesquisado |
| `chosen` | `escolhido` | Conceito selecionado |
| `choosePart` | `selecionarParte` | Seleção de uma peça |
| `toggle` | `alternarSistema` | Alternância de visibilidade |
| `reset` (função) | `reiniciar` | Retorno ao estado inicial |
| `loadChunk` | `carregarBloco` | Carregamento de geometria |
| `renderer` | `renderizador` | Renderer WebGL |
| `controls` | `controles` | OrbitControls |
| `pickers` | `malhasSelecao` | Malhas usadas no raycasting |
| `bounds` | `limites` | Caixas delimitadoras |
| `offsets` | `deslocamentos` | Deslocamentos no modo explodido |

## Nomes técnicos preservados propositalmente

Alguns **identificadores de API e propriedades de contratos externos** continuam em inglês. Isso não inclui os nomes anatômicos exibidos ao usuário, que estão localizados em PT-BR. Exemplos:

- propriedades do JSON BodyParts3D: `parts`, `concepts`, `chunks`, `vertexCount`, `indexCount`;
- propriedades React/DOM: `onClick`, `aria-label`, `addEventListener`;
- propriedades Three.js: `vertexShader`, `fragmentShader`, `needsUpdate`;
- identificadores GLSL injetados no shader: `partState`, `selectionState`, `partIndex`;
- propriedades de configuração esperadas pelas bibliotecas shadcn/ui.

Esses nomes não devem ser traduzidos sem criar uma camada explícita de adaptação, pois sua alteração direta quebra o contrato externo.
