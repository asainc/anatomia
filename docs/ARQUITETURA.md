# Arquitetura do projeto — V2

## 1. Visão geral

O projeto continua sendo uma aplicação web estática, sem backend obrigatório.

```text
Navegador
   │
   ├── React / TypeScript
   │      ├── app/pagina.tsx                 → orquestração da interface
   │      ├── app/dominio/                   → busca, classificação e schema
   │      ├── app/servicos/                  → preferências e URL
   │      └── app/componentes/               → árvore, aprendizado e métricas
   │
   ├── Three.js / WebGL
   │      └── app/cena.tsx                   → renderização, picking e câmera
   │
   └── arquivos estáticos
          ├── atlas.json
          ├── atlas.en.json
          ├── body-*.bin
          └── body-*.bin.gz
```

## 2. Fluxo de inicialização

```text
web/index.html
   ↓
web/main.tsx
   ↓
app/pagina.tsx
   ↓ fetch /models/atlas.json
app/dominio/schema-atlas.ts
   ↓
app/anatomia.ts / normalizarAtlas
   ↓
app/dominio/catalogo-anatomico.ts
   ↓
app/cena.tsx + interface
```

O manifesto é validado antes de ser convertido para o modelo interno.

## 3. Manifesto e versionamento

O gerador grava:

```json
{
  "schemaVersion": "2.0",
  "locale": "pt-BR",
  "sourceLocale": "en"
}
```

`app/dominio/schema-atlas.ts` valida campos obrigatórios, tipos numéricos, limites 3D, chunks, conceitos e partes. O validador é implementado em TypeScript puro para evitar dependência adicional.

## 4. Modelo interno

`app/anatomia.ts` centraliza:

- `Atlas`;
- `Parte`;
- `Conceito`;
- `IdSistema`;
- `EstadoCena`;
- `Vista`;
- descrições gerais dos sistemas.

O estado da cena contém:

- `explosao`;
- `sistemasVisiveis`;
- `selecionados`;
- `relacionados`;
- `isolar`;
- `foco`;
- `vista`;
- `rotacionar`;
- `reinicio`;
- `inspetorAberto`.

## 5. Domínio anatômico

`app/dominio/catalogo-anatomico.ts` cria uma camada derivada a partir do atlas.

Cada conceito recebe, para navegação:

- sistema;
- região inferida;
- categoria inferida;
- aliases;
- termos de busca;
- nome latino quando disponível no catálogo local de termos frequentes.

Essa classificação é educacional e determinística. Ela não altera IDs nem geometria científica.

## 6. Busca

A busca calcula pontuação combinando:

1. igualdade exata;
2. prefixo;
3. ocorrência no nome;
4. tokens presentes em aliases/FMA/região/categoria;
5. aproximação Levenshtein limitada a consultas curtas.

Isso permite tolerância a acentos, sinônimos e pequenos erros sem servidor ou modelo de IA.

## 7. Hierarquia

A função `construirHierarquia` agrupa:

```text
Sistema
  └── Região
       └── Categoria
            └── Conceito
```

`app/componentes/arvore-anatomica.tsx` renderiza essa árvore com `<details>/<summary>`, mantendo navegação acessível e sem dependência extra.

## 8. Renderização 3D

`app/cena.tsx` preserva a estratégia de performance original:

- geometrias combinadas por sistema para renderização;
- malhas individuais fora da cena para raycasting;
- texturas GPU para estado por peça;
- chunks binários carregados em paralelo.

Textura de estado:

```text
RGB → deslocamento XYZ
A   → visibilidade
```

Textura de seleção:

```text
R → estrutura principal
G → estrutura relacionada/comparada
```

O shader aplica um realce mais forte no canal principal e um realce secundário para contexto.

## 9. Câmera

A cena oferece vistas:

- três quartos;
- anterior;
- posterior;
- lateral direita;
- lateral esquerda;
- superior;
- inferior.

Ao mudar a seleção, `foco` é incrementado e a câmera enquadra as caixas 3D das peças selecionadas. O enquadramento leva em conta painel de detalhes, mobile e landscape.

## 10. Modo explodido

`app/layout-explosao.ts` continua calculando uma distribuição 2D sem sobreposição. A cena interpola a posição original até a célula de destino conforme o slider.

## 11. Preferências

`app/servicos/preferencias.ts` grava em `localStorage`:

- explosão;
- sistemas visíveis;
- vista;
- exibição de métricas.

## 12. Navegação por URL

`app/servicos/navegacao-url.ts` usa o hash:

```text
#estrutura=FMA:...
```

Isso permite compartilhar uma estrutura sem precisar de backend ou roteador adicional.

## 13. Métricas de renderização

`app/cena.tsx` lê `renderer.info` e publica periodicamente:

- FPS calculado;
- draw calls;
- triângulos;
- geometrias;
- texturas.

## 14. Testes e validações

- `validar-dependencias.mjs`: versões React/RSC;
- `testar-schema.mjs`: contrato do manifesto;
- `testar-dominio.mjs`: classificação, aliases e busca;
- `validar-traducao-anatomica.mjs`: localização integral;
- `validar-atlas.mjs`: integridade binária;
- `validar-interacoes.mjs`: layout explodido, busca, picking lógico e gestos.

## 15. CI

`.github/workflows/qualidade.yml` executa `npm ci`, typecheck, testes, validações e build em push/pull request.

## 16. Limites conhecidos

- BodyParts3D representa uma referência masculina adulta;
- região/categoria/relação são classificações locais para navegação;
- nomes latinos existem apenas para um conjunto comum nesta V2;
- o conteúdo é educacional e não clínico;
- o desempenho final depende da GPU e do navegador.

## Camada de estudo para residência

A versão 0.3.0 adiciona uma camada de estudo sem acoplar regras pedagógicas ao renderizador 3D:

- `app/dominio/estudo-residencia.ts`: banco elegível, geração de questões, revisão espaçada, caderno de erros e métricas;
- `app/componentes/central-residencia.tsx`: fluxo visual de treino/simulado;
- `app/servicos/progresso-residencia.ts`: persistência local;
- `pagina.tsx`: somente conecta a questão ativa à seleção/destaque do modelo 3D.

Essa separação permite testar o algoritmo de estudo sem inicializar React ou WebGL.

## Central de Estudo Avançado — 0.6.0

A camada avançada é separada do renderizador:

```text
app/
├── dominio/
│   ├── estudo-detalhado.ts
│   └── rotas-estudo-avancado.ts
└── componentes/
    └── central-estudo-avancado.tsx
```

`rotas-estudo-avancado.ts` define as rotas pedagógicas e resolve cada etapa contra o índice anatômico real. Assim, o conteúdo educacional nunca injeta geometrias fictícias no Three.js.

`central-estudo-avancado.tsx` cuida de filtros, pesquisa, navegação por etapas e envio da seleção principal/contextual para a cena.

A cena continua recebendo somente IDs de peças em `selecionados` e `relacionados`, preservando o mecanismo eficiente de realce por GPU já utilizado pelo projeto.
