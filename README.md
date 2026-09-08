# Atlas Anatômico Humano 3D — V2

Aplicação web interativa para explorar anatomia humana masculina adulta em 3D, baseada no **BodyParts3D 4.0**. A versão `0.7.0` utiliza React, TypeScript, Vite e Three.js e mantém todos os nomes anatômicos exibidos em **português do Brasil**.

## Principais recursos

- corpo humano 3D com órbita, zoom e seleção direta;
- 2.234 peças modeladas e 3.432 conceitos anatômicos;
- nomes anatômicos de exibição integralmente localizados para PT-BR;
- busca por nome, FMA ID, sinônimos, termos sem acento e pequenos erros de digitação;
- árvore `Sistema → Região → Categoria → Estrutura`;
- foco automático da câmera ao selecionar uma estrutura;
- isolamento da estrutura e visualização somente do sistema correspondente;
- estruturas relacionadas com segundo nível de destaque visual;
- comparação anatômica entre estrutura principal e estrutura relacionada;
- vistas anterior, posterior, laterais, superior, inferior e três quartos;
- central **Residência** com treino rápido, simulado, revisão espaçada e caderno de erros;
- biblioteca com **53 guias anatômicos de prova** para marcos clínicos, correlações cirúrgicas e revisão orgânica;
- **filtro automático do modelo** ao usar “Mostrar no modelo”: oculta peças externas ao guia, realça a principal e mantém todas as relacionadas visíveis;
- Central **Avançado** com **53 rotas sequenciais**, 165 etapas e associações 3D para neuroanatomia, arterial, venosa, linfáticos, nervos periféricos e especialidades;
- 5 formatos de questão: localização 3D, identificação visual, região, sistema e categoria;
- filtros de estudo por sistema, região e dificuldade;
- desempenho acumulado por sistema e métricas de retenção;
- progresso de estudo salvo localmente no navegador;
- modo explodido progressivo;
- links compartilháveis por `#estrutura=FMA:...`;
- persistência local de preferências visuais;
- painel opcional de FPS, draw calls, triângulos, geometrias e texturas;
- schema `2.0` validado antes do carregamento;
- validações automatizadas e workflow de CI.

## Pré-requisitos

- **Node.js 22.13.0 ou superior**;
- npm;
- navegador com WebGL.

Verifique:

```bash
node --version
npm --version
```

## Execução local

Na raiz do projeto:

```bash
npm ci
npm run dev
```

Abra:

```text
http://localhost:3016
```

Use `npm ci`, não `npm install --force` ou `--legacy-peer-deps`. As versões críticas de React/RSC são fixadas e validadas automaticamente.

## Validação completa

```bash
npm run validar
```

A sequência inclui:

1. compatibilidade das dependências React/RSC;
2. verificação TypeScript;
3. teste do schema do manifesto;
4. testes do domínio anatômico e da busca;
5. testes da central de preparação para residência;
6. testes dos guias anatômicos de prova;
7. teste do filtro automático de visualização;
8. testes da Central de Estudo Avançado;
9. validação de localização PT-BR;
10. validação estrutural/binária do atlas;
11. testes de interação;
12. build de produção.

Execução separada:

```bash
npm run validar:dependencias
npm run verificar
npm run testar:schema
npm run testar:dominio
npm run testar:residencia
npm run testar:guias
npm run testar:marcos
npm run testar:filtro-modelo
npm run testar:avancado
npm run validar:traducao
npm run validar:atlas
npm run validar:interacoes
npm run build
```

## Dependências React/RSC

O projeto usa exatamente:

```text
react                     19.2.6
react-dom                 19.2.6
react-server-dom-webpack  19.2.6
```

`scripts/validar-dependencias.mjs` falha se uma dessas versões divergir ou se for usada com `^`/`~`.

## Estrutura principal

```text
atlas-anatomico-3d/
├── .github/workflows/
│   └── qualidade.yml
├── app/
│   ├── anatomia.ts
│   ├── pagina.tsx
│   ├── cena.tsx
│   ├── dominio/
│   │   ├── catalogo-anatomico.ts
│   │   ├── estudo-detalhado.ts
│   │   ├── estudo-residencia.ts
│   │   ├── rotas-estudo-avancado.ts
│   │   └── schema-atlas.ts
│   ├── servicos/
│   │   ├── navegacao-url.ts
│   │   ├── preferencias.ts
│   │   └── progresso-residencia.ts
│   └── componentes/
│       ├── arvore-anatomica.tsx
│       ├── central-residencia.tsx
│       ├── central-estudo-avancado.tsx
│       └── metricas-cena.tsx
├── components/ui/
├── docs/
├── public/models/
│   ├── atlas.en.json
│   ├── atlas.json
│   └── body-*.bin(.gz)
├── scripts/
│   ├── gerar-atlas-ptbr.py
│   ├── traducao_anatomica.py
│   ├── testar-schema.mjs
│   ├── testar-dominio.mjs
│   ├── testar-residencia.mjs
│   ├── testar-guias-estudo.mjs
│   ├── testar-filtro-modelo.mjs
│   ├── testar-estudo-avancado.mjs
│   ├── validar-dependencias.mjs
│   ├── validar-traducao-anatomica.mjs
│   ├── validar-atlas.mjs
│   └── validar-interacoes.mjs
├── package.json
└── package-lock.json
```


## Preparação para provas de residência

O botão **Residência** abre uma central de estudo de anatomia integrada ao modelo 3D. Ela oferece:

- **Treino rápido:** 10 questões mistas com feedback e explicação após cada resposta;
- **Simulado:** 20 questões, cronômetro e feedback consolidado somente ao final;
- **Revisão espaçada:** agenda estruturas já estudadas em intervalos de 1, 3, 7, 14, 30 e 60 dias conforme a sequência de acertos;
- **Caderno de erros:** recupera conceitos em que o estudante já errou;
- **Questões no 3D:** o aluno precisa localizar a estrutura diretamente no corpo;
- **Identificação visual:** uma estrutura é destacada sem revelar seu nome;
- **Classificação:** questões de região, sistema e categoria anatômica;
- **Filtros:** sistema, região e nível fundamental/intermediário/avançado;
- **Desempenho:** acerto global, estruturas estudadas, revisões pendentes, estruturas dominadas e desempenho por sistema.

Todo o progresso é salvo em `localStorage`; nenhuma resposta do estudante é enviada para servidores. A central cobre **anatomia** e deve ser usada como complemento ao estudo das demais áreas cobradas nas provas de residência.


Além das questões, o painel **Explorar por hierarquia** agora traz uma biblioteca de **Guias de prova** com 53 roteiros anatômicos, cobrindo cabeça e pescoço, neurovascular, tórax, abdome, pelve, membro superior, membro inferior e coluna. Cada guia apresenta:

- resumo objetivo do tema;
- instrução de visualização dentro do modelo 3D;
- limites e componentes, quando aplicável;
- pontos de alta incidência em residência;
- correlação clínica/cirúrgica;
- observação explícita quando a base 3D não possui uma malha isolada para determinada estrutura.


### Mostrar no modelo — filtro automático

Nos **Guias de prova**, o botão **Mostrar no modelo** não apenas abre a explicação. A aplicação agora:

1. identifica todos os conceitos 3D associados ao guia;
2. oculta automaticamente qualquer peça que não pertença ao conjunto;
3. realça a estrutura principal;
4. mantém as demais estruturas do guia com realce secundário;
5. enquadra a câmera considerando todo o conjunto visível;
6. preserva os sistemas que estavam ativos para que **Exibir anatomia ao redor** restaure o contexto anterior.

O mesmo mecanismo é usado nas rotas do modo **Avançado**.

Detalhes: [Preparação para residência](docs/PREPARACAO_RESIDENCIA.md).

## Central de Estudo Avançado

O botão **Avançado** abre 53 rotas anatômicas sequenciais com **165 etapas** e **804 associações 3D**. As rotas são filtráveis e pesquisáveis e cobrem:

- neuroanatomia fina;
- vascular arterial;
- vascular venosa;
- linfáticos;
- nervos periféricos;
- 12 roteiros integrados por especialidade.

Cada etapa seleciona uma estrutura principal e realça até 20 estruturas relacionadas. Quando a malha específica não existe na base BodyParts3D, a aplicação usa âncoras anatômicas e informa a limitação explicitamente.

Detalhes: [Estudo anatômico avançado](docs/ESTUDO_AVANCADO.md).

## Localização anatômica

A aplicação carrega `public/models/atlas.json`, que possui os nomes de exibição em PT-BR. `public/models/atlas.en.json` preserva os nomes originais apenas para rastreabilidade.

Para regenerar:

```bash
npm run localizar:atlas
```

Exemplos:

- `metacarpal bone` → **metacarpo**;
- `first metacarpal bone` → **metacarpo 1º**;
- `proximal phalanx of thumb` → **falange proximal do polegar**;
- `inferior nasal concha` → **concha nasal inferior**;
- `heart` → **coração**.

A validação percorre os **3.432 conceitos e 2.234 partes** e bloqueia regressões inequívocas para inglês.

## Build de produção

```bash
npm run build
```

A saída é criada em `dist/`.

## Dados e uso

O modelo é baseado no BodyParts3D, referência masculina adulta distribuída sob CC BY 4.0. A aplicação é educacional e **não deve ser usada para diagnóstico, planejamento cirúrgico ou decisão clínica**.

## Documentação

- [Execução local detalhada](docs/EXECUCAO_LOCAL.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Evolução V2](docs/EVOLUCAO_V2.md)
- [Guia do código](docs/GUIA_DO_CODIGO.md)
- [Decisões técnicas](docs/DECISOES_TECNICAS.md)
- [Validação](docs/VALIDACAO.md)
- [Preparação para residência](docs/PREPARACAO_RESIDENCIA.md)
- [Estudo anatômico avançado](docs/ESTUDO_AVANCADO.md)
- [Mapa de renomeações](docs/MAPA_RENOMEACOES.md)
- [Changelog](CHANGELOG.md)
