# Evolução V2 — Atlas Anatômico 3D

## Objetivo

A versão 0.3.0 transforma o visualizador em um produto educacional mais navegável, auditável e resiliente, sem trocar o núcleo de renderização que já era eficiente.

## Entregas da V2

### 1. Busca anatômica aprimorada

A busca agora usa `app/dominio/catalogo-anatomico.ts` e considera:

- nomes em português do Brasil;
- nome original preservado internamente;
- FMA ID;
- sinônimos comuns, como `omoplata` → `escápula` e `rótula` → `patela`;
- ausência de acentos;
- pequenos erros de digitação em consultas curtas;
- região, sistema e categoria como termos auxiliares.

Os resultados exibem também o caminho anatômico resumido.

### 2. Hierarquia anatômica

O painel **Explorar** organiza o catálogo em:

```text
Sistema → Região → Categoria → Estrutura
```

A classificação de região e categoria é inferida localmente por regras determinísticas e serve como recurso de navegação educacional.

### 3. Painel anatômico enriquecido

A inspeção da estrutura mostra:

- nome em PT-BR;
- nome latino quando existe no catálogo local de termos frequentes;
- região;
- categoria;
- FMA ID;
- quantidade de peças 3D;
- descrição educacional;
- peças componentes;
- estruturas relacionadas.

### 4. Relações e comparação

A V2 diferencia dois níveis de realce no shader:

- estrutura principal: destaque forte;
- estrutura relacionada/comparada: destaque secundário.

O usuário pode comparar uma estrutura com outra relacionada e visualizar diferenças de região, categoria e sistema.

### 5. Foco e isolamento progressivo

Ao selecionar uma estrutura, a câmera passa a enquadrá-la automaticamente, mesmo sem isolamento.

O painel oferece:

- **Focar**;
- **Isolar estrutura**;
- **Somente sistema**;
- **Mostrar relacionadas**.

### 6. Vistas anatômicas

Foram adicionadas vistas:

- três quartos;
- anterior;
- posterior;
- lateral direita;
- lateral esquerda;
- superior;
- inferior.

### 7. Central Residência

O antigo exercício simples de localização evoluiu para uma central de estudo de anatomia voltada à preparação para provas de residência.

Foram adicionados:

- treino rápido de 10 questões;
- simulado de 20 questões com cronômetro e feedback somente ao final;
- revisão espaçada;
- caderno de erros;
- cinco formatos de questão;
- filtros por sistema, região e dificuldade;
- painel de desempenho e temas mais fracos;
- persistência local do progresso.

O domínio fica em `app/dominio/estudo-residencia.ts`, a persistência em `app/servicos/progresso-residencia.ts` e a interface em `app/componentes/central-residencia.tsx`.

### 8. Links compartilháveis

A estrutura selecionada pode ser armazenada no hash da URL:

```text
#estrutura=FMA:...
```

Ao abrir a URL, o atlas tenta localizar e enquadrar o conceito correspondente.

### 9. Preferências persistentes

`app/servicos/preferencias.ts` salva em `localStorage`:

- nível de explosão;
- sistemas visíveis;
- vista anatômica;
- preferência de exibição das métricas 3D.

A seleção anatômica não é persistida localmente; ela é compartilhada pela URL quando necessário.

### 10. Schema versionado e validado

O manifesto gerado agora contém:

```json
{
  "schemaVersion": "2.0",
  "locale": "pt-BR",
  "sourceLocale": "en"
}
```

`app/dominio/schema-atlas.ts` valida o contrato necessário antes de normalizar o atlas. O validador não possui dependências externas.

### 11. Métricas de performance

A aplicação pode mostrar:

- FPS;
- draw calls;
- triângulos renderizados;
- geometrias na memória;
- texturas na memória.

Esses números são obtidos diretamente de `WebGLRenderer.info`.

### 12. Dependências críticas protegidas

`scripts/validar-dependencias.mjs` impede que `react`, `react-dom` e `react-server-dom-webpack` fiquem em versões divergentes ou usem ranges como `^`/`~`.

Na V2, os três permanecem fixados em `19.2.6`.

### 13. Testes adicionais

Foram adicionados:

- `scripts/testar-schema.mjs`;
- `scripts/testar-dominio.mjs`;
- `scripts/testar-residencia.mjs`;
- validação automática de dependências.

Optou-se por `node:test`/`assert` e execução TypeScript nativa do Node 22 em vez de adicionar Vitest/Playwright imediatamente. A decisão reduz a superfície de dependências após o conflito ERESOLVE e mantém os testes de domínio executáveis com a árvore atual.

### 14. CI

`.github/workflows/qualidade.yml` executa em push e pull request:

1. `npm ci`;
2. validação de dependências;
3. typecheck;
4. testes de schema/domínio;
5. validação de tradução;
6. integridade do atlas;
7. validação de interações;
8. build.

## O que foi preservado

O renderizador mantém a estratégia de alta performance existente:

- geometrias combinadas por sistema para desenho;
- malhas individuais fora da cena para raycasting;
- texturas GPU para deslocamento, visibilidade e realce;
- carregamento em blocos binários.

A V2 amplia esse mecanismo, em vez de substituí-lo por milhares de objetos Three.js independentes.

## Limites científicos

Região, categoria, relações e descrições gerais são recursos educacionais calculados por regras locais. Eles não substituem revisão de nomenclatura por anatomista e não tornam o produto adequado a diagnóstico, cirurgia ou decisão clínica.
