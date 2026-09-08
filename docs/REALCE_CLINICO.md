# Realce clínico no modelo 3D

## Objetivo

Os guias classificados como **Marco clínico** não devem apenas listar limites em texto. Ao clicar em **Mostrar no modelo**, a aplicação:

1. filtra automaticamente as peças relacionadas ao guia;
2. enquadra o conjunto anatômico relevante;
3. mantém a anatomia necessária como contexto;
4. desenha o marco clínico em uma cor contrastante;
5. reduz discretamente a saturação do contexto para tornar o marco visualmente dominante.

## Controles

- **Mostrar no modelo**: ativa o filtro e o realce.
- **Ocultar realce clínico**: remove somente a marcação colorida; o contexto filtrado permanece.
- **Mostrar realce clínico**: restaura a marcação.
- **H**: alterna rapidamente entre realce visível/oculto.
- **Exibir anatomia ao redor**: encerra o filtro clínico e retorna à exploração normal.

## Formas visuais

Os marcos podem usar:

- triângulo;
- círculo;
- anel;
- cápsula;
- retângulo/região.

A forma e as peças-âncora são configuradas em:

```text
app/dominio/marco-clinico-visual.ts
```

## Cobertura

Todos os 18 guias classificados como `marco-clinico` possuem uma especificação visual dedicada e são validados por:

```bash
npm run testar:marcos
```

## Limite educacional

Alguns marcos — como triângulos, fossas, túneis e regiões de superfície — não existem como uma malha fechada no BodyParts3D. Nesses casos a aplicação calcula a posição do realce a partir das peças anatômicas disponíveis e desenha uma **representação didática do território**, em vez de alegar que a base contém uma malha anatômica que não existe.

Por isso, o realce é apropriado para **estudo e orientação espacial**, mas não deve ser usado como referência para navegação cirúrgica, planejamento de procedimento, diagnóstico ou mensuração clínica.
