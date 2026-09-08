# Relatório de validação — V2

**Data:** 2026-09-07

## Validações concluídas nesta sessão

### Localização integral PT-BR

```bash
python scripts/gerar-atlas-ptbr.py
node scripts/validar-traducao-anatomica.mjs
```

Resultado:

- 3.432 conceitos localizados;
- 2.234 partes localizadas;
- `schemaVersion = 2.0`;
- `locale = pt-BR`;
- 0 rótulos com termos ingleses bloqueados.

### Integridade do atlas

```bash
node scripts/validar-atlas.mjs
```

Resultado:

- 2.234 malhas indexadas;
- 3.432 conceitos completos;
- 2.288.268 triângulos;
- buffers binários íntegros.

### Schema V2

```bash
node --experimental-strip-types scripts/testar-schema.mjs
```

Resultado:

- manifesto real aprovado;
- versão `2.0` aprovada;
- regressão com `parts=[]` corretamente rejeitada;
- regressão com triângulos negativos corretamente rejeitada.

### Domínio anatômico e busca

```bash
node --experimental-strip-types scripts/testar-dominio.mjs
```

Resultado:

- classificação de membro superior/inferior aprovada;
- categoria arterial aprovada;
- `omoplata` encontra `escápula`;
- `rotula` encontra `patela`;
- erro curto em `arteria radal` encontra `artéria radial`.


### Preparação para residência

```bash
node --experimental-strip-types scripts/testar-residencia.mjs
```

Resultado:

- 1.916 estruturas elegíveis para questões;
- 5 tipos de questão validados;
- treino e filtros por sistema validados;
- caderno de erros validado;
- revisão espaçada validada;
- registro de acertos/erros validado;
- consolidação do simulado validada.

### Dependências críticas

```bash
node scripts/validar-dependencias.mjs
```

Resultado:

```text
react                     19.2.6
react-dom                 19.2.6
react-server-dom-webpack  19.2.6
```

As versões estão exatas e alinhadas entre `package.json` e `package-lock.json`.

### Interações

```bash
node --experimental-strip-types scripts/validar-interacoes.mjs
```

Resultado aprovado para:

- modo explodido em proporções desktop/mobile;
- ausência de sobreposição no layout calculado;
- busca/inspeção;
- toque;
- arraste;
- multitoque;
- cancelamento;
- visualização vazia.

### Sintaxe TypeScript/TSX

Foi realizada análise sintática com o compilador TypeScript disponível no ambiente para os arquivos novos/modificados da V2.1/0.3.0, incluindo:

- `pagina.tsx`;
- `cena.tsx`;
- domínio;
- serviços;
- componentes.

Resultado: sem erros de parsing.

## Limitação de ambiente

Foi tentado `npm ci`, mas o download completo das dependências não terminou dentro da sessão. Uma tentativa offline confirmou que parte do cache não existe (`@xtuc/long`). A instalação parcial foi removida antes do empacotamento.

Por isso, **não é correto afirmar que `npm run verificar` e `npm run build` completos passaram nesta máquina**.

No ambiente local com acesso normal ao registro npm, execute:

```bash
npm ci
npm run validar
```

O workflow `.github/workflows/qualidade.yml` repete esse fluxo automaticamente em CI.

## Versão 0.6.0 — Central de Estudo Avançado

Validações executadas em 2026-09-07:

- dependências React/RSC alinhadas em `19.2.6`;
- schema do atlas validado;
- domínio anatômico e busca tolerante validados;
- preparação para residência: **1.916 estruturas elegíveis** e 5 tipos de questão;
- guias de prova: **53 roteiros** com associação ao atlas;
- estudo avançado: **53 rotas**, **165 etapas** e **804 associações 3D**;
- tradução: **3.432 conceitos + 2.234 partes** em PT-BR, sem termos ingleses bloqueados;
- geometria: **2.234 malhas** e **2.288.268 triângulos** íntegros;
- interações desktop/mobile aprovadas;
- análise sintática: **82 arquivos TypeScript/TSX**, 0 erros sintáticos;
- scripts Python principais compilados com `py_compile`.

### Build completo

O build integral continua dependente de `npm ci`. Neste ambiente de execução não há `node_modules` completo, portanto não é correto declarar `npm run build` como validado aqui. O projeto contém `package-lock.json` sincronizado e o comando `npm run validar` deve ser executado localmente após `npm ci`.

## Versão 0.6.2 — filtro automático “Mostrar no modelo”

Foi adicionado `scripts/testar-filtro-modelo.mjs` para validar o comportamento de visualização guiada. O teste usa o guia real do **Triângulo de Hesselbach** e confirma que:

- a estrutura principal possui peças 3D;
- as estruturas relacionadas possuem peças 3D;
- com `filtrarContexto=true`, somente seleção + relacionadas permanecem visíveis;
- nenhuma peça externa ao guia é renderizada;
- todas as peças relacionadas disponíveis são preservadas;
- `isolar=true` continua tendo precedência e mostra somente a seleção principal;
- ao desativar o filtro, os sistemas anteriormente visíveis voltam a aparecer.

Resultado medido nesta versão: **28 peças** permaneceram visíveis no teste do Triângulo de Hesselbach e todas as demais foram ocultadas.
