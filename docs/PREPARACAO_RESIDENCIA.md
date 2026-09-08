# Preparação para residência médica — Anatomia

## Escopo

A central **Residência** usa o atlas 3D como ferramenta de evocação ativa e revisão de anatomia. Ela não tenta representar todo o conteúdo de uma prova de residência; o objetivo é transformar a exploração anatômica em estudo estruturado e mensurável.

## Modos de estudo

### Treino rápido

- 10 questões;
- alterna formatos automaticamente;
- feedback imediato;
- explicação anatômica após a resposta;
- indicado para estudo diário e aquecimento.

### Simulado

- 20 questões;
- cronômetro de sessão;
- não revela acerto/erro de alternativas durante a prova;
- apresenta percentual, acertos, erros e tempo ao final;
- registra melhor desempenho histórico.

### Revisão espaçada

Cada estrutura respondida recebe uma próxima data de revisão. Uma sequência de respostas corretas amplia os intervalos:

```text
1 → 3 → 7 → 14 → 30 → 60 dias
```

Uma resposta incorreta reinicia o intervalo para 1 dia.

A intenção é priorizar retenção de longo prazo sem exigir uma conta ou backend.

### Caderno de erros

Toda estrutura respondida incorretamente entra no histórico de erros. Esse modo cria sessões somente com conceitos que já causaram dificuldade, respeitando os filtros atuais.

## Formatos de questão

### 1. Localização 3D

O enunciado informa uma estrutura. O estudante precisa clicar diretamente na parte correta do corpo.

### 2. Identificação visual

O atlas destaca uma estrutura, mas o painel não revela o nome. O estudante escolhe entre alternativas anatomicamente próximas sempre que possível.

### 3. Região anatômica

Pergunta em qual região o conceito está classificado.

### 4. Sistema anatômico

Pergunta a qual sistema pertence a estrutura.

### 5. Categoria anatômica

Pergunta se o conceito é osso, músculo, artéria, veia, nervo, órgão etc.

## Filtros

Antes de iniciar uma sessão, o estudante pode restringir o banco por:

- sistema;
- região;
- dificuldade.

A dificuldade é estimada deterministicamente a partir da granularidade e complexidade do nome/conceito. Ela serve para organizar o estudo e não representa uma classificação oficial de provas.

## Painel de progresso

A central mostra:

- percentual global de acerto;
- número de estruturas estudadas;
- revisões vencidas;
- estruturas com sequência de domínio;
- quantidade no caderno de erros;
- desempenho por sistema, ordenando os temas mais fracos primeiro.

## Persistência e privacidade

O arquivo `app/servicos/progresso-residencia.ts` salva o estado em `localStorage`:

```text
atlas-anatomico:progresso-residencia:v1
```

Não há envio de respostas, notas ou histórico para serviços externos.

## Arquitetura

```text
app/
├── componentes/
│   └── central-residencia.tsx
├── dominio/
│   └── estudo-residencia.ts
└── servicos/
    └── progresso-residencia.ts

scripts/
└── testar-residencia.mjs
```

`estudo-residencia.ts` é uma camada de domínio pura. Ela gera questões, monta filas, registra respostas, calcula revisão espaçada e produz métricas sem depender de React.

`central-residencia.tsx` cuida somente do fluxo visual da sessão.

`progresso-residencia.ts` cuida da persistência local.

## Validação

Execute:

```bash
npm run testar:residencia
```

O teste usa o `atlas.json` real e valida:

- tamanho mínimo do banco elegível;
- os cinco tipos de questão;
- alternativas contendo a resposta correta;
- caderno de erros;
- revisão espaçada;
- registro de acertos/erros;
- resultado de simulado;
- filtros por sistema.

## Limite educacional

A classificação anatômica do atlas e as questões são derivadas do catálogo local. O recurso é destinado à revisão educacional de anatomia e não substitui materiais oficiais, cursos preparatórios, bancos de questões das instituições ou orientação acadêmica.

## Estudo aprofundado com guias anatômicos

Além das sessões de perguntas, o produto agora inclui uma biblioteca de **Guias de prova** dentro do painel de exploração anatômica, com 53 roteiros de alto rendimento.

Esses guias foram desenhados para apoiar a revisão de temas de alta incidência em residência, incluindo:

- Triângulo de Hesselbach;
- Triângulo de Calot;
- Tríade portal e pedículo hepático;
- Túnel do carpo;
- Triângulo femoral;
- Círculo arterial cerebral (de Willis);
- Pedículo renal;
- Hilo pulmonar;
- Coração e grandes vasos;
- Vias biliares extra-hepáticas.

Cada guia apresenta:

- resumo do tema;
- instrução de como visualizar no atlas;
- limites e componentes, quando aplicável;
- pontos de residência;
- correlação clínica;
- observação explícita quando uma estrutura importante não existe como malha isolada nesta base 3D.

### Limite geométrico conhecido

O recurso amplia bastante o valor educacional do atlas, mas **não cria automaticamente novas malhas anatômicas microscópicas, histológicas ou cirúrgicas**. Quando a base BodyParts3D não traz uma estrutura isolada — por exemplo, alguns ligamentos, nervos finos ou pequenas artérias — o sistema destaca o contexto anatômico disponível e informa a limitação no próprio painel.
