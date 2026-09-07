# Arquitetura do projeto

## 1. Visão geral

O projeto é uma aplicação web estática. Não existe backend obrigatório.

```text
Navegador
   │
   ├── React / TypeScript
   │      ├── interface
   │      ├── estado
   │      └── busca/seleção
   │
   ├── Three.js / WebGL
   │      └── renderização 3D
   │
   └── arquivos estáticos
          ├── atlas.json
          ├── body-*.bin
          └── body-*.bin.gz
```

## 2. Ponto de entrada

`web/main.tsx` localiza o elemento `#root` e monta `PaginaInicial`.

Fluxo:

```text
web/index.html
   ↓
web/main.tsx
   ↓
app/pagina.tsx
   ↓
app/cena.tsx
```

## 3. Carregamento do atlas

`app/pagina.tsx` requisita:

```text
/models/atlas.json
```

O arquivo mantém o contrato original do BodyParts3D. Em seguida, `normalizarAtlas`, definido em `app/anatomia.ts`, converte o contrato externo para o modelo interno em português.

Exemplo conceitual:

```text
parts        → partes
concepts     → conceitos
chunks       → blocos
system       → sistema
vertexCount  → quantidadeVertices
indexCount   → quantidadeIndices
```

Essa adaptação foi centralizada para evitar alterações no arquivo científico de origem e reduzir o risco de inconsistência.

## 4. Estado principal

O tipo `EstadoCena` concentra o estado visual:

- `explosao`: nível de separação das estruturas;
- `sistemasVisiveis`: sistemas atualmente exibidos;
- `selecionados`: IDs das estruturas selecionadas;
- `isolar`: informa se somente a seleção deve aparecer;
- `vista`: orientação da câmera;
- `rotacionar`: habilita rotação automática;
- `reinicio`: contador usado para forçar reposicionamento da câmera;
- `inspetorAberto`: informa à cena que o painel de detalhes ocupa espaço.

## 5. Renderização 3D

`app/cena.tsx` é responsável por:

- criar `WebGLRenderer`;
- criar câmera e `OrbitControls`;
- configurar iluminação;
- baixar blocos binários;
- criar geometrias Three.js;
- combinar geometrias para reduzir chamadas de desenho;
- atualizar visibilidade e deslocamento por textura GPU;
- fazer raycasting para seleção;
- adaptar a câmera a desktop, celular e painel de detalhes;
- liberar recursos de GPU ao desmontar o componente.

## 6. Estratégia de desempenho

Renderizar mais de duas mil malhas como objetos independentes teria custo alto. O projeto utiliza duas representações:

1. **malhas combinadas** para renderização;
2. **malhas individuais não adicionadas à cena** para seleção precisa.

O estado de cada estrutura é enviado ao shader por texturas:

```text
RGB → deslocamento X/Y/Z
A   → visibilidade
```

Uma segunda textura marca a seleção.

Essa estratégia reduz chamadas de desenho sem perder a capacidade de clicar em estruturas específicas.

## 7. Modo explodido

`app/layout-explosao.ts` calcula células 2D para cada estrutura visível.

Objetivo:

- evitar sobreposição;
- adaptar o layout à proporção da tela;
- manter cada estrutura individualmente acessível.

A cena interpola a posição original até a posição calculada pelo layout.

## 8. Seleção por ponteiro

`app/toque-ponteiro.ts` evita interpretar um arraste como clique.

A classe `DetectorToquePonteiro` observa:

- distância percorrida;
- quantidade de ponteiros ativos;
- cancelamento do evento.

Somente um toque curto e individual pode selecionar uma estrutura.

## 9. Download dos modelos

`app/download-modelo.ts` trata dois comportamentos possíveis de hosts estáticos:

- `.gz` entregue ainda compactado;
- `.gz` automaticamente descompactado por `Content-Encoding`.

A assinatura gzip é verificada antes de aplicar `DecompressionStream`.

Também é validado o tamanho final do buffer.

## 10. Busca

A busca compara:

- nome oficial da fonte;
- tradução conhecida em português;
- identificador do conceito.

A normalização remove acentos e converte para minúsculas.

## 11. Integração opcional com ferramentas do navegador

`app/ferramentas-agente.ts` usa `document.modelContext.registerTool` somente quando essa API existe.

Se a capacidade não estiver disponível, a aplicação continua funcionando normalmente.

## 12. Componentes de interface

`components/ui/` contém componentes derivados do ecossistema shadcn/ui. Nomes de propriedades exigidos pelas bibliotecas foram preservados para facilitar atualização e compatibilidade com upstream.

Textos visíveis e rótulos de acessibilidade relevantes foram traduzidos.

## 13. Scripts de preparação dos modelos

### `converter-anatomia.py`

Lê OBJ e metadados, converte coordenadas e cria o manifesto/binários iniciais.

### `otimizar-anatomia.mjs`

Simplifica malhas e reorganiza os buffers.

### `compactar-modelos.mjs`

Gera arquivos gzip.

### `gerar-atlas-ptbr.py` e `traducao_anatomica.py`

Geram, de forma determinística, os nomes anatômicos de exibição em PT-BR e preservam `nameEn` para rastreabilidade.

### `validar-traducao-anatomica.mjs`

Percorre todos os conceitos/partes, bloqueia regressões de idioma e confere casos anatômicos obrigatórios.

### `validar-atlas.mjs`

Valida integridade estrutural e binária.

### `validar-interacoes.mjs`

Valida regras importantes de interação sem depender do navegador.

## 14. Limites conhecidos

- o BodyParts3D é uma referência masculina adulta e não representa toda variação humana;
- os nomes originais da fonte são majoritariamente em inglês, mas ficam restritos a `atlas.en.json`/`nameEn`;
- os nomes de exibição do manifesto carregado são localizados integralmente para PT-BR;
- a aplicação é educacional e não clínica;
- o desempenho final depende de GPU, navegador e dispositivo.
