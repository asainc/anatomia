# Relatório de validação desta adaptação

**Data:** 2026-09-06

## Validações executadas com sucesso

## Localização integral dos nomes anatômicos

Comandos executados:

```bash
python scripts/gerar-atlas-ptbr.py
node scripts/validar-traducao-anatomica.mjs
```

**Resultado medido:**

- 3.432 conceitos localizados para PT-BR;
- 2.234 partes/malhas com nome localizado;
- 0 tokens do vocabulário-fonte sem regra de localização;
- 0 rótulos contendo os termos ingleses bloqueados pela validação;
- nomes originais preservados em `nameEn`, sem uso como fallback de interface.

Casos de regressão verificados incluem `metacarpal bone` → `metacarpo`, `first metacarpal bone` → `metacarpo 1º`, `proximal phalanx of thumb` → `falange proximal do polegar` e `inferior nasal concha` → `concha nasal inferior`.


### Sintaxe TypeScript/TSX

Foi realizada análise sintática local dos arquivos `.ts` e `.tsx` do projeto, incluindo os componentes de interface.

**Resultado medido:** 71 arquivos analisados sem erro sintático.

### Python

Comando equivalente executado:

```bash
python -m py_compile scripts/converter-anatomia.py
```

**Resultado:** aprovado.

### Integridade do atlas

Comando:

```bash
node scripts/validar-atlas.mjs
```

**Resultado medido:**

- 2.234 malhas indexadas;
- 3.432 conceitos completos;
- 2.288.268 triângulos;
- buffers binários verificados;
- vínculos entre conceitos e elementos verificados.

### Interações

Comando:

```bash
node --experimental-strip-types scripts/validar-interacoes.mjs
```

**Resultado:** aprovado para:

- empacotamento do modo explodido em proporções de tela diferentes;
- ausência de sobreposição das células calculadas;
- busca por `fêmur` em português;
- inspeção de estrutura;
- tratamento de estrutura inexistente;
- toque simples;
- arraste;
- multitoque;
- cancelamento;
- visualização vazia.

## Etapa não concluída neste ambiente

A instalação completa com `npm ci` não foi concluída no ambiente usado para esta adaptação porque o acesso ao registro npm apresentou falha temporária de resolução de rede (`EAI_AGAIN`). Consequentemente, **não foi possível afirmar que `npm run verificar` e `npm run build` foram executados com todas as dependências instaladas neste ambiente**.

Essa limitação é de ambiente, não um resultado de aprovação ou reprovação do build.

## Validação recomendada no ambiente local

Em uma máquina com acesso normal ao registro npm, execute:

```bash
npm ci
npm run validar
```

Somente após esse comando concluir sem erros o build de produção deve ser considerado validado no ambiente de destino.
