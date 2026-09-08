# Guia do código

## 1. Convenção adotada nesta versão

O código de negócio usa nomes em português do Brasil para facilitar leitura pela equipe responsável por esta versão.

Exemplos:

```text
state              → estado
selected           → selecionados
visible            → sistemasVisiveis
explode            → explosao
reset              → reinicio
createExplosion... → criarLayoutExplosao
loadChunk           → carregarBloco
decodeModel...      → decodificarRespostaModelo
```

Não foram renomeadas propriedades obrigatórias de APIs externas, como `shader.vertexShader`, `Response.ok`, `document`, `addEventListener`, propriedades do Three.js e contratos do shadcn/ui.

## 2. `app/anatomia.ts`

Centraliza:

- tipos principais;
- lista de sistemas;
- descrições dos sistemas;
- leitura dos nomes anatômicos já localizados;
- normalização de texto;
- adaptação do `atlas.json` para o modelo interno.

Os nomes anatômicos não são mais traduzidos nesse arquivo. A localização do catálogo fica em `scripts/traducao_anatomica.py` e é materializada em `public/models/atlas.json`. O nome original é carregado em `nomeOriginal` apenas para busca e rastreabilidade interna.

## 3. `app/pagina.tsx`

Controla a experiência de usuário.

Principais estados:

```ts
atlas
estado
progresso
erro
painel
detalhes
sobre
consulta
escolhido
```

### Fluxo de seleção

```text
Usuário seleciona resultado ou peça
   ↓
selecionarConceito / selecionarParte
   ↓
definirEstado(... selecionados ...)
   ↓
Cena recebe novo EstadoCena
   ↓
Texturas de seleção/visibilidade são atualizadas
   ↓
Painel de detalhes é aberto
```

## 4. `app/cena.tsx`

É o trecho mais sensível do projeto.

Ao alterar esse arquivo:

- valide desktop e celular;
- execute `npm run validar`;
- verifique seleção após mover a câmera;
- verifique o modo explodido;
- confirme que recursos Three.js são liberados no cleanup.

### Por que usar refs?

A cena Three.js é criada dentro de um `useEffect` dependente do atlas. Recriar toda a cena a cada mudança de React seria caro.

Por isso:

```ts
estadoAtualRef.current = estado;
selecionarRef.current = aoSelecionar;
```

permitem que o loop de animação enxergue os valores atuais sem recriar renderer, câmera e geometrias.

## 5. Shaders

As variáveis GLSL continuam em inglês porque fazem parte de um trecho especializado de shader e de identificadores injetados no pipeline Three.js.

O shader recebe:

- `partState`;
- `selectionState`;
- `stateWidth`;
- `partIndex`.

Renomeá-las não traria benefício funcional e aumentaria o risco de quebrar as substituições de string feitas em `onBeforeCompile`.

## 6. Erros

Falhas de download e inicialização WebGL são propagadas para a interface por `aoFalhar`.

A aplicação não deve falhar silenciosamente em etapas críticas de carregamento.

## 7. Adicionando um novo sistema

É necessário revisar, no mínimo:

1. `IdSistema`;
2. `SISTEMAS`;
3. `MAPA_SISTEMA_ORIGEM`;
4. `SISTEMAS_VISIVEIS_PADRAO`, se aplicável;
5. mapa de sistema usado na reconstrução dos modelos.

Depois execute:

```bash
npm run validar
```

## 8. Alterando uma tradução anatômica

Edite a equivalência ou regra correspondente em `scripts/traducao_anatomica.py`. Depois gere novamente o manifesto e valide:

```bash
npm run localizar:atlas
npm run validar:traducao
```

Nunca edite manualmente centenas de nomes em `atlas.json`: ele é um artefato gerado. O inglês original deve continuar preservado em `atlas.en.json`/`nameEn`, mas não deve ser usado como fallback de exibição.

## 9. Alterando modelos binários

Não edite manualmente offsets ou contagens em `atlas.json`.

Use a cadeia de scripts de reconstrução e, ao final:

```bash
npm run validar:atlas
```

Offsets incorretos podem causar leitura fora dos limites ou geometria corrompida.

## 10. Checklist antes de entregar mudanças

```text
[ ] npm ci executado em ambiente limpo quando necessário
[ ] npm run verificar aprovado
[ ] npm run validar:traducao aprovado
[ ] npm run validar:atlas aprovado
[ ] npm run validar:interacoes aprovado
[ ] npm run build aprovado
[ ] interface verificada em navegador com WebGL
[ ] textos novos em português revisados
[ ] atribuição BodyParts3D preservada
```

## V2 — onde alterar cada recurso

### Busca, sinônimos, região e categoria

Edite:

```text
app/dominio/catalogo-anatomico.ts
```

Depois execute:

```bash
npm run testar:dominio
```

### Contrato do atlas

Edite:

```text
app/dominio/schema-atlas.ts
scripts/gerar-atlas-ptbr.py
```

Mantenha `schemaVersion` sincronizado e rode:

```bash
npm run testar:schema
```

### Preferências

Edite:

```text
app/servicos/preferencias.ts
```

### Links compartilháveis

Edite:

```text
app/servicos/navegacao-url.ts
```

### Hierarquia / preparação para residência / métricas

Edite os componentes em:

```text
app/componentes/
```

### Foco, câmera, realce e performance Three.js

Edite:

```text
app/cena.tsx
```

Evite criar uma malha renderizada por peça. A performance depende da combinação de geometrias e do estado por textura GPU.

## Preparação para residência

- `app/componentes/central-residencia.tsx`: fluxo de treino, simulado e painel de desempenho;
- `app/dominio/estudo-residencia.ts`: regras puras de questões, revisão espaçada e caderno de erros;
- `app/servicos/progresso-residencia.ts`: armazenamento local do histórico;
- `scripts/testar-residencia.mjs`: regressões do módulo de estudo.

Ao alterar regras de estudo, prefira modificar o domínio e cobri-lo com `npm run testar:residencia`, em vez de colocar regras dentro de `pagina.tsx`.
