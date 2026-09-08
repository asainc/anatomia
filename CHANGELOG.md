# Changelog

## 2026-09-07 — Versão 0.7.0: refinamento do estudo clínico visual

- adicionada legenda persistente para diferenciar **marco clínico** e **contexto anatômico**;
- adicionado controle para ocultar/reexibir o realce sem abandonar o guia nem desfazer o filtro automático;
- adicionado atalho `H` para alternar o realce clínico;
- anatomia de contexto é levemente dessaturada durante o realce, aumentando a hierarquia visual;
- contornos dos marcos passaram a usar `EdgesGeometry` e renderização sobreposta para maior legibilidade;
- substituída busca repetida de peças por mapa `id → índice` no renderizador do destaque;
- corrigida a liberação recursiva de geometrias e materiais temporários dos marcadores clínicos;
- criada documentação `docs/REALCE_CLINICO.md`;
- versão do projeto atualizada para **0.7.0**, sem novas dependências npm.

## 2026-09-07 — Versão 0.6.3: marcos clínicos com destaque visual dedicado

- cada **marco clínico** passa a exibir um destaque geométrico próprio em cor contrastante, em vez de apenas colorir a estrutura-âncora;
- o destaque visual agora cobre os 18 marcos clínicos do atlas, incluindo triângulo de Hesselbach, fossa cubital, túnel do carpo, tabaqueira anatômica, triângulo femoral e fossa poplítea;
- quando um marco clínico está ativo, a anatomia de contexto continua visível, mas sem competir visualmente com o destaque do marco;
- adicionada a nova camada de domínio `app/dominio/marco-clinico-visual.ts`;
- criado `scripts/testar-marcos-clinicos.mjs`;
- `package.json` e `package-lock.json` atualizados para **0.6.3**.

## 2026-09-07 — Versão 0.6.2: “Mostrar no modelo” com filtro automático

- o botão **Mostrar no modelo** passa a ocultar automaticamente todas as peças que não pertencem ao guia selecionado;
- a estrutura principal recebe realce forte e as estruturas relacionadas permanecem visíveis com realce secundário;
- o enquadramento da câmera considera seleção + contexto relacionado;
- as Rotas de Estudo Avançado usam o mesmo filtro contextual;
- adicionada indicação visual de **Filtro automático ativo** no painel de detalhes;
- **Exibir anatomia ao redor**, seleção de sistemas, comparação, limpeza e redefinição desativam corretamente o filtro;
- a regra de visibilidade foi centralizada em `parteVisivelNoEstado`;
- criado `scripts/testar-filtro-modelo.mjs`;
- nenhuma dependência npm nova foi adicionada.

## 2026-09-07 — Versão 0.6.1: correção do detalhamento

- corrigido corte de textos longos no painel de detalhamento;
- o painel inteiro passou a ser a superfície de rolagem, eliminando a pequena área interna que escondia linhas de “Como visualizar”, limites e correlações;
- removidos limites de altura e `overflow` que podiam truncar parágrafos e listas;
- melhorado o aproveitamento vertical do painel em desktop e mobile;
- no mobile, o dock inferior é ocultado enquanto o detalhamento está aberto para liberar espaço ao conteúdo.

## 2026-09-07 — Versão 0.6.0: projeto completo de estudo avançado

- adicionada a Central **Avançado** como funcionalidade nativa da aplicação;
- adicionadas 53 rotas sequenciais, 165 etapas e 804 associações 3D;
- cobertura dividida em neuroanatomia fina, vascular arterial, vascular venosa, linfáticos, nervos periféricos e correlações por especialidade;
- adicionados 12 roteiros por especialidade: Cirurgia Geral, Cardiologia, Neurologia, Neurocirurgia, Ortopedia de membro superior, Ortopedia de membro inferior, Cirurgia Vascular, Urologia, Otorrinolaringologia, Cirurgia Torácica, Medicina de Emergência e Radiologia;
- rotas de nervos periféricos e linfáticos usam âncoras anatômicas quando não existe malha isolada, sem inventar geometria;
- adicionada navegação por etapas, busca, filtros por área e destaque simultâneo de estruturas relacionadas;
- adicionado teste automatizado `scripts/testar-estudo-avancado.mjs`;
- package.json e package-lock.json sincronizados em `0.6.0`;
- nenhuma dependência npm nova foi adicionada.

## 2026-09-07 — Versão 0.5.0: cobertura ampliada dos marcos anatômicos de prova

- expandida a biblioteca de estudo detalhado para **53 guias anatômicos** cobrindo cabeça e pescoço, neurovascular, tórax, abdome, pelve, membro superior, membro inferior e coluna;
- adicionados roteiros para sistema carotídeo cervical, órbita, nervo óptico, tireoide, mediastino, circulação coronária, árvore traqueobrônquica, tronco celíaco, artérias mesentéricas, retroperitônio, trato urogenital masculino, manguito rotador, fossa cubital, tabaqueira anatômica, fossa poplítea, tendão calcâneo, arcos do pé, coluna vertebral e outros marcos de alto rendimento;
- criado o teste automatizado `scripts/testar-guias-estudo.mjs` para garantir unicidade, cobertura mínima e associação com conceitos reais do atlas;
- atualizado o README e a documentação da central de residência para refletir a nova cobertura.

## 2026-09-07 — Versão 0.4.0: estudo anatômico detalhado

- adicionada uma biblioteca de fichas anatômicas aprofundadas para marcos clínicos, correlações cirúrgicas e revisão orgânica;
- adicionados roteiros visuais para Triângulo de Hesselbach, Triângulo de Calot, Tríade portal, Túnel do carpo, Triângulo femoral, Círculo arterial cerebral, Pedículo renal, Hilo pulmonar, Coração e grandes vasos e Vias biliares extra-hepáticas;
- criada seção **Guias de prova** no painel de exploração para abrir diretamente roteiros de alto rendimento;
- enriquecido o painel de detalhes com limites, componentes, pontos de residência, correlação clínica e observações sobre limitações geométricas do modelo;
- mantida a rastreabilidade da fonte anatômica, explicitando quando uma estrutura relevante não existe como malha 3D isolada na base atual;
- nenhuma dependência npm nova foi adicionada.

## 2026-09-07 — Versão 0.3.0: preparação para residência médica

- substituído o exercício simples **Aprender** por uma central de estudo de anatomia para residência;
- adicionados Treino rápido, Simulado, Revisão espaçada e Caderno de erros;
- adicionados cinco tipos de questão: localização 3D, identificação visual, região, sistema e categoria;
- adicionados filtros por sistema, região e nível;
- adicionados cronômetro, resultado de sessão e desempenho por sistema;
- adicionado armazenamento local do progresso do estudante;
- adicionado teste automatizado `scripts/testar-residencia.mjs`;
- nenhuma dependência npm nova foi adicionada.


## 2026-09-07 — V2 do Atlas Anatômico 3D

- versão do projeto elevada para `0.2.0`;
- adicionado `schemaVersion: 2.0` ao manifesto localizado;
- busca anatômica com aliases, FMA, tolerância a acentos e fuzzy curto;
- hierarquia sistema → região → categoria → estrutura;
- painel de detalhes enriquecido;
- foco automático da câmera e novas vistas anatômicas;
- segundo nível de realce para estruturas relacionadas/comparadas;
- comparação anatômica;
- modo educacional Aprender;
- links compartilháveis por hash;
- persistência de preferências em `localStorage`;
- métricas 3D;
- validação de dependências React/RSC;
- testes de schema e domínio;
- workflow de CI;
- documentação atualizada;
- nenhuma nova dependência de runtime foi adicionada.

## Histórico anterior

## 2026-09-06 — Localização integral da terminologia anatômica

### Correção

- removido o fallback que exibia o nome BodyParts3D em inglês quando não havia tradução pontual;
- gerado `public/models/atlas.json` com os 3.432 conceitos e 2.234 partes localizados para PT-BR;
- preservado `public/models/atlas.en.json` e o campo `nameEn` exclusivamente para rastreabilidade;
- adicionadas regras para ossos da mão e do pé, falanges, vasos, músculos, nervos, encéfalo, vísceras, lateralidade e ordinais;
- `metacarpal bone` passou a ser exibido como `metacarpo`;
- adicionada validação automatizada para impedir regressão de rótulos anatômicos em inglês;
- busca continua aceitando internamente o nome original, mas os resultados e detalhes são exibidos em português.

### Validação medida

- 3.432 conceitos localizados;
- 2.234 partes localizadas;
- 0 tokens da fonte sem regra de localização;
- 0 rótulos contendo o conjunto de termos ingleses bloqueados;
- integridade dos 2.288.268 triângulos e buffers binários mantida.


## 2026-09-06 — Localização PT-BR e documentação

Responsável técnico: adaptação realizada nesta versão do projeto.

### Alterações

- interface principal traduzida para português do Brasil;
- mensagens de erro e rótulos de acessibilidade traduzidos;
- tipos, estados, funções e variáveis do código de negócio renomeados para português;
- arquivos principais renomeados para português;
- criado adaptador entre o contrato original do `atlas.json` e o modelo interno em português;
- adicionada busca por traduções frequentes de estruturas anatômicas;
- comentários técnicos ampliados em trechos críticos;
- scripts de conversão, otimização, compactação e validação traduzidos e documentados;
- adicionados comandos npm de validação;
- README reescrito em português;
- adicionada documentação detalhada de execução local, arquitetura e código;
- mantida a integridade dos dados científicos e dos identificadores BodyParts3D.

### Decisão técnica

Os nomes de propriedades pertencentes a bibliotecas externas e ao formato original dos dados não foram traduzidos em seus pontos de integração. Essa decisão reduz risco de incompatibilidade e mantém a rastreabilidade com a fonte. Internamente, o atlas é convertido para nomes em português por `normalizarAtlas`.
