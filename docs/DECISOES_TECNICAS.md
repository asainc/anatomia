# Registro de decisões técnicas

## DT-001 — Preservar o contrato original do BodyParts3D

**Data:** 2026-09-06  
**Decisão:** manter as propriedades estruturais do manifesto BodyParts3D (`parts`, `concepts`, offsets e IDs), preservar uma cópia `atlas.en.json` e gerar `atlas.json` com os nomes de exibição em PT-BR.

### Motivo

O manifesto aponta offsets e metadados associados aos buffers binários. Por isso os campos estruturais e identificadores não são renomeados. Apenas os valores textuais de `name` são localizados; o valor original permanece em `nameEn` e em `atlas.en.json`.

### Implementação

`scripts/gerar-atlas-ptbr.py` cria o manifesto localizado. Depois, `normalizarAtlas` converte as propriedades estruturais externas para objetos internos em português.

### Consequência

Propriedades técnicas em inglês aparecem apenas na fronteira do contrato de dados. Os nomes anatômicos mostrados ao usuário vêm do manifesto PT-BR.

---

## DT-002 — Traduzir o código de negócio, mas preservar APIs externas

**Data:** 2026-09-06  
**Decisão:** nomes de variáveis, tipos, funções e estados controlados pelo projeto foram traduzidos. Nomes exigidos por React, DOM, Three.js, Vite, shadcn/ui e GLSL foram preservados.

### Motivo

Renomear propriedades de APIs de terceiros quebraria o contrato de execução ou criaria wrappers sem ganho funcional.

### Consequência

O código fica majoritariamente em português sem comprometer compatibilidade com bibliotecas.

---

## DT-003 — Localizar integralmente os nomes anatômicos para PT-BR

**Data:** 2026-09-06  
**Decisão:** remover o fallback visual em inglês e gerar uma versão PT-BR para todos os conceitos e partes do atlas.

### Motivo

Uma tradução apenas para estruturas frequentes deixava nomes como `metacarpal bone`, vasos segmentares e várias estruturas musculares em inglês. Isso tornava a experiência inconsistente e não atendia ao objetivo de uma interface totalmente em português.

### Implementação

- `public/models/atlas.en.json` preserva o manifesto nominal original;
- `scripts/traducao_anatomica.py` contém terminologia e regras determinísticas;
- `scripts/gerar-atlas-ptbr.py` gera `public/models/atlas.json`;
- cada item localizado mantém `nameEn` para auditoria;
- `scripts/validar-traducao-anatomica.mjs` impede regressões para inglês.

### Consequência

Os 3.432 conceitos e 2.234 nomes de partes usados pela interface são localizados. Cognatos cuja grafia é válida nos dois idiomas, como `aorta`, `ulna`, `ureter`, `face` e `atlas`, podem permanecer graficamente iguais.

---

## DT-004 — Manter a estratégia original de renderização por GPU

**Data:** 2026-09-06  
**Decisão:** preservar a combinação de geometrias e o controle por texturas GPU.

### Motivo

O atlas contém milhares de malhas. A estratégia reduz chamadas de desenho e mantém a seleção individual sem renderizar milhares de objetos independentes.

### Consequência

`app/cena.tsx` permanece como o componente mais complexo e deve ser alterado com validação de desempenho e interação.

---

## DT-005 — Adicionar um comando único de validação

**Data:** 2026-09-06  
**Decisão:** incluir `npm run validar`.

### Motivo

Concentrar verificação de tipos, integridade do atlas, regras de interação e build reduz a chance de uma entrega ser validada parcialmente.

### Fluxo

```text
npm run verificar
npm run validar:traducao
npm run validar:atlas
npm run validar:interacoes
npm run build
```
