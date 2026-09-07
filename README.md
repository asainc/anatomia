# Atlas Anatômico Humano 3D

Aplicação web interativa para explorar a anatomia humana masculina adulta em 3D. O projeto utiliza React, TypeScript, Vite, Three.js e componentes shadcn/ui, com os modelos anatômicos derivados do **BodyParts3D 4.0**.

Esta versão foi adaptada para **português do Brasil**. O código de negócio, os estados, funções, tipos, controles, mensagens e documentação foram traduzidos e reorganizados para facilitar leitura e manutenção.

## O que a aplicação faz

A aplicação permite:

- visualizar o corpo humano em 3D;
- orbitar, aproximar e afastar a câmera;
- selecionar estruturas anatômicas diretamente no modelo;
- ativar ou ocultar sistemas anatômicos;
- exibir apenas o esqueleto ou os principais órgãos;
- separar progressivamente as estruturas com o controle **Explodir anatomia**;
- pesquisar estruturas por nome ou identificador do atlas;
- pesquisar **todas as estruturas anatômicas pelos nomes em português do Brasil**, incluindo metacarpos, falanges, vasos, músculos e subdivisões;
- isolar uma estrutura selecionada;
- consultar descrições educacionais;
- validar a integridade dos arquivos binários e das interações principais.

## Pré-requisitos

Para executar a aplicação já empacotada, é necessário:

- **Node.js 22.13.0 ou superior**;
- **npm**, instalado junto com o Node.js;
- navegador com suporte a **WebGL**.

Python **não é necessário** para executar a aplicação. Ele só é usado caso seja necessário reconstruir os arquivos anatômicos a partir dos OBJ originais do BodyParts3D.

Verifique o ambiente:

```bash
node --version
npm --version
```

A versão do Node.js deve ser `22.13.0` ou superior.

## Execução local — caminho rápido

Na raiz do projeto:

```bash
npm ci
npm run dev
```

Depois, abra no navegador:

```text
http://localhost:3016
```

O comando `npm ci` instala exatamente as versões registradas no `package-lock.json`.

## Validação completa

Antes de publicar ou entregar alterações, execute:

```bash
npm run validar
```

Esse comando executa, nesta ordem:

1. verificação de tipos TypeScript;
2. validação de todos os rótulos anatômicos em PT-BR;
3. validação da estrutura e dos buffers do atlas;
4. validação das interações principais;
5. build de produção.

Também é possível executar cada etapa separadamente:

```bash
npm run verificar
npm run validar:traducao
npm run validar:atlas
npm run validar:interacoes
npm run build
```

## Build de produção

```bash
npm run build
```

Os arquivos gerados ficam em:

```text
dist/
```

O conteúdo de `dist/` pode ser servido por um servidor HTTP estático compatível.

## Estrutura principal

```text
anatomy/
├── app/
│   ├── anatomia.ts             # Tipos, sistemas, traduções e normalização do atlas
│   ├── pagina.tsx              # Página principal e estado da interface
│   ├── cena.tsx                # Renderização Three.js e interação com o modelo 3D
│   ├── layout-explosao.ts      # Distribuição das peças no modo explodido
│   ├── download-modelo.ts      # Download e descompactação dos blocos binários
│   ├── ferramentas-agente.ts   # Integração opcional com ferramentas do navegador
│   ├── toque-ponteiro.ts       # Diferencia toque de arraste/multitoque
│   └── globals.css             # Estilos globais
├── components/ui/              # Componentes de interface derivados de shadcn/ui
├── docs/
│   ├── ARQUITETURA.md
│   ├── EXECUCAO_LOCAL.md
│   └── GUIA_DO_CODIGO.md
├── public/
│   ├── models/                 # Manifesto e geometrias binárias
│   └── ATTRIBUTION.md          # Créditos e licenças dos dados anatômicos
├── scripts/
│   ├── converter-anatomia.py
│   ├── gerar-atlas-ptbr.py     # Gera os 5.666 rótulos PT-BR
│   ├── traducao_anatomica.py   # Vocabulário e regras anatômicas
│   ├── otimizar-anatomia.mjs
│   ├── compactar-modelos.mjs
│   ├── validar-atlas.mjs
│   ├── validar-traducao-anatomica.mjs
│   └── validar-interacoes.mjs
├── web/
│   ├── index.html
│   └── main.tsx
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

## Como os nomes anatômicos são localizados

A interface **não usa mais fallback em inglês**. O projeto possui dois manifestos:

- `public/models/atlas.en.json`: cópia preservada dos nomes originais, usada para rastreabilidade;
- `public/models/atlas.json`: manifesto carregado pela aplicação, com todos os nomes de exibição em PT-BR.

A geração é determinística e pode ser refeita com:

```bash
npm run localizar:atlas
```

O script `scripts/traducao_anatomica.py` aplica equivalências anatômicas, regras para nomes compostos, lateralidade, ordinais e nomenclatura muscular. Cada item localizado também conserva `nameEn`, portanto IDs e nomes da fonte podem ser auditados sem mostrar inglês ao usuário.

Exemplos presentes no catálogo gerado:

- `metacarpal bone` → **metacarpo**;
- `first metacarpal bone` → **metacarpo 1º**;
- `proximal phalanx of thumb` → **falange proximal do polegar**;
- `inferior nasal concha` → **concha nasal inferior**;
- `heart` → **coração**.

A validação específica é executada por:

```bash
npm run validar:traducao
```

Ela percorre os **3.432 conceitos e 2.234 partes**, verifica a presença do nome PT-BR e do nome original para auditoria, bloqueia termos ingleses inequívocos e testa traduções obrigatórias de regressão. Termos cuja grafia é legitimamente idêntica em português e inglês, como `aorta`, `ulna`, `ureter`, `face` e `atlas`, são tratados como cognatos válidos.

Os nomes de propriedades exigidos por React, Three.js, Vite e outras bibliotecas permanecem conforme as respectivas APIs; essa regra não se aplica aos nomes anatômicos exibidos.

## Dados anatômicos

O visualizador utiliza o **BodyParts3D 4.0**, uma referência anatômica masculina adulta licenciada sob **CC BY 4.0**. O modelo desta distribuição contém 2.234 malhas individuais e 3.432 conceitos nomeados.

A geometria foi simplificada para uso no navegador, preservando cada malha de origem. Consulte os detalhes de licença e atribuição em [public/ATTRIBUTION.md](public/ATTRIBUTION.md).

A aplicação é educacional. Ela **não deve ser utilizada como ferramenta de diagnóstico, planejamento cirúrgico ou decisão clínica**.

## Documentação complementar

- [Execução local detalhada](docs/EXECUCAO_LOCAL.md)
- [Arquitetura do projeto](docs/ARQUITETURA.md)
- [Guia do código e fluxo de execução](docs/GUIA_DO_CODIGO.md)
- [Decisões técnicas](docs/DECISOES_TECNICAS.md)
- [Relatório de validação desta adaptação](docs/VALIDACAO.md)
- [Mapa das principais renomeações](docs/MAPA_RENOMEACOES.md)
- [Registro das alterações](CHANGELOG.md)

## Licença

O código original da aplicação é disponibilizado sob licença MIT. Os dados anatômicos possuem licença própria CC BY 4.0 e exigem preservação da atribuição ao serem redistribuídos.
