# Registro de alterações

## 2026-09-06 — Localização integral da terminologia anatômica

### Correção

- removido o fallback que exibia o nome BodyParts3D em inglês quando não havia tradução pontual;
- gerado `public/models/atlas.json` com os 3.432 conceitos e 2.234 partes localizados para PT-BR;
- preservado `public/models/atlas.en.json` e o campo `nameEn` exclusivamente para rastreabilidade;
- adicionadas regras para ossos da mão e do pé, falanges, vasos, músculos, nervos, encéfalo, vísceras, lateralidade e ordinais;
- `metacarpal bone` passou a ser exibido como `metacarpo`;
- adicionada validação automatizada para impedir regressão de rótulos anatômicos em inglês;
- busca continua aceitando internamente o nome original, mas os resultados e detalhes são exibidos em português.

### Validação medida

- 3.432 conceitos localizados;
- 2.234 partes localizadas;
- 0 tokens da fonte sem regra de localização;
- 0 rótulos contendo o conjunto de termos ingleses bloqueados;
- integridade dos 2.288.268 triângulos e buffers binários mantida.


## 2026-09-06 — Localização PT-BR e documentação

Responsável técnico: adaptação realizada nesta versão do projeto.

### Alterações

- interface principal traduzida para português do Brasil;
- mensagens de erro e rótulos de acessibilidade traduzidos;
- tipos, estados, funções e variáveis do código de negócio renomeados para português;
- arquivos principais renomeados para português;
- criado adaptador entre o contrato original do `atlas.json` e o modelo interno em português;
- adicionada busca por traduções frequentes de estruturas anatômicas;
- comentários técnicos ampliados em trechos críticos;
- scripts de conversão, otimização, compactação e validação traduzidos e documentados;
- adicionados comandos npm de validação;
- README reescrito em português;
- adicionada documentação detalhada de execução local, arquitetura e código;
- mantida a integridade dos dados científicos e dos identificadores BodyParts3D.

### Decisão técnica

Os nomes de propriedades pertencentes a bibliotecas externas e ao formato original dos dados não foram traduzidos em seus pontos de integração. Essa decisão reduz risco de incompatibilidade e mantém a rastreabilidade com a fonte. Internamente, o atlas é convertido para nomes em português por `normalizarAtlas`.
